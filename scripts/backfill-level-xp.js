#!/usr/bin/env node
/**
 * Backfill sessions.total_xp from completed quests, tasks, and check-ins.
 * Run once for existing users: node scripts/backfill-level-xp.js
 * Uses same XP rules: quest XP (estimated_xp/xp_reward/current_xp or difficulty), 10 per task, 5 per check-in day.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local'), override: true });

import { getPool } from '../app/lib/db.js';
import { ensureLevelSchema } from '../app/lib/level.js';
import { TABLES, COLS } from '../app/lib/db-schema.js';

const XP_PER_TASK = 10;
const XP_PER_CHECKIN = 5;
const XP_BY_DIFFICULTY = { easy: 50, medium: 100, hard: 200, epic: 400 };
const DEFAULT_QUEST_XP = 100;

async function backfill() {
  const pool = getPool();
  await ensureLevelSchema(pool);

  // Detect which XP columns exist on quests
  const colResult = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name IN ('estimated_xp', 'xp_reward', 'current_xp', 'difficulty')`
  );
  const questCols = (colResult.rows || []).map((r) => r.column_name);
  const hasDifficulty = questCols.includes('difficulty');
  const xpCols = ['estimated_xp', 'xp_reward', 'current_xp'].filter((c) => questCols.includes(c));
  const selectXp = xpCols.length ? xpCols.join(', ') : '1 as _dummy';
  const selectDifficulty = hasDifficulty ? ', difficulty' : '';

  // All session_ids that have quests or tasks (or get from sessions)
  const sessionsResult = await pool.query(`
    SELECT DISTINCT session_id FROM (
      SELECT session_id FROM sessions
      UNION
      SELECT ${COLS.questsUser}::text FROM quests
      UNION
      SELECT ${COLS.questsUser}::text FROM ${TABLES.tasks}
    ) s
  `);
  const sessionIds = sessionsResult.rows.map((r) => r.session_id).filter(Boolean);
  console.log(`Found ${sessionIds.length} session(s) to backfill.`);

  for (const sessionId of sessionIds) {
    let total = 0;

    // XP from completed quests (only select columns that exist)
    const questsResult = await pool.query(
      `SELECT ${selectXp} ${selectDifficulty} FROM quests WHERE ${COLS.questsUser} = $1::text AND status = 'completed'`,
      [sessionId]
    );
    for (const q of questsResult.rows) {
      const xpFromRow =
        xpCols.length > 0
          ? Number(q.estimated_xp ?? q.xp_reward ?? q.current_xp ?? 0) || 0
          : 0;
      total += xpFromRow > 0 ? xpFromRow : (hasDifficulty && XP_BY_DIFFICULTY[q.difficulty] != null ? XP_BY_DIFFICULTY[q.difficulty] : DEFAULT_QUEST_XP);
    }

    // XP from completed tasks
    const tasksResult = await pool.query(
      `SELECT COUNT(*)::int as n FROM ${TABLES.tasks} WHERE ${COLS.questsUser} = $1::text AND status = 'completed'`,
      [sessionId]
    );
    total += (tasksResult.rows[0]?.n || 0) * XP_PER_TASK;

    // XP from check-ins (one per calendar day)
    const checkinsResult = await pool.query(
      `SELECT COUNT(DISTINCT DATE(qj.created_at))::int as n
       FROM quest_journal qj
       JOIN quests q ON qj.quest_id::text = q.id::text
       WHERE q.${COLS.questsUser} = $1::text AND qj.entry_type = 'daily_checkin'`,
      [sessionId]
    );
    total += (checkinsResult.rows[0]?.n || 0) * XP_PER_CHECKIN;

    await pool.query(
      `INSERT INTO sessions (session_id, total_xp) VALUES ($1, $2)
       ON CONFLICT (session_id) DO UPDATE SET total_xp = EXCLUDED.total_xp`,
      [sessionId, total]
    );
    console.log(`  ${sessionId}: ${total} XP`);
  }

  console.log('Backfill done.');
  process.exit(0);
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
