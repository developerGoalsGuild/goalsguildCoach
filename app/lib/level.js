/**
 * Level system: XP progression (5% harder per level), titles, and addXP.
 * Single source of truth for level math across analytics, API, and UI.
 */

const BASE = 1000;
const XP_PER_TASK = 10;
const XP_PER_TASK_LONG_BONUS = 5; // +5 if estimated_hours >= 2
const XP_PER_CHECKIN = 5;
const XP_PER_CHECKIN_STREAK_BONUS = 1; // +1 per consecutive day of check-in

/** Cumulative XP required to reach level N (1-based). Level 1 = 0, Level 2 = 1000, etc. */
export function getXPThresholdForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(BASE * (Math.pow(1.05, level - 1) - 1) / 0.05);
}

/** Level titles for display (optional) */
export const LEVEL_TITLES = {
  1: 'Iniciante',
  2: 'Explorador',
  3: 'Aventureiro',
  4: 'Guerreiro',
  5: 'Veterano',
  6: 'Mestre',
  7: 'Campeão',
  8: 'Herói',
  9: 'Lenda',
  10: 'Mito',
};

export { XP_PER_TASK, XP_PER_TASK_LONG_BONUS, XP_PER_CHECKIN, XP_PER_CHECKIN_STREAK_BONUS };

/**
 * Ensure sessions has total_xp column (for DBs created without it). Call before any SELECT/UPDATE on total_xp.
 * @param {import('pg').Pool} pool
 */
export async function ensureLevelSchema(pool) {
  try {
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0`);
  } catch (_) {}
}

/**
 * Compute level info from total XP.
 * @param {number} totalXP - Total XP earned (from sessions.total_xp)
 * @returns {{ level: number, current_xp: number, xp_to_next_level: number, xp_in_current_level_cap: number, level_title: string }}
 */
export function getLevelFromTotalXP(totalXP) {
  const xp = Math.max(0, Math.floor(Number(totalXP) || 0));
  let level = 1;
  while (getXPThresholdForLevel(level + 1) <= xp) {
    level++;
    if (level >= 100) break; // cap
  }
  const thresholdCurrent = getXPThresholdForLevel(level);
  const thresholdNext = getXPThresholdForLevel(level + 1);
  const current_xp = xp - thresholdCurrent;
  const xp_in_current_level_cap = thresholdNext - thresholdCurrent;
  const xp_to_next_level = Math.max(0, thresholdNext - xp);

  return {
    level,
    current_xp,
    xp_to_next_level,
    xp_in_current_level_cap,
    level_title: LEVEL_TITLES[level] || `Nível ${level}`,
  };
}

/**
 * Add XP to a session and return the new total.
 * Ensures total_xp column exists and session row exists (creates if missing).
 * @param {import('pg').Pool} pool
 * @param {string} sessionId - session_id (user identifier; will be coerced to string)
 * @param {number} amount - XP to add
 * @returns {Promise<number>} new total_xp
 */
export async function addXP(pool, sessionId, amount) {
  const sid = sessionId != null ? String(sessionId) : '';
  if (!sid) {
    console.warn('[level] addXP: sessionId is empty, skipping');
    return 0;
  }

  const amt = Math.max(0, Math.floor(Number(amount) || 0));

  await ensureLevelSchema(pool);

  if (amt <= 0) {
    const r = await pool.query(
      `SELECT COALESCE(total_xp, 0)::int as total_xp FROM sessions WHERE session_id = $1`,
      [sid]
    );
    return Number(r.rows[0]?.total_xp || 0);
  }

  const result = await pool.query(
    `UPDATE sessions SET total_xp = COALESCE(total_xp, 0) + $1 WHERE session_id = $2 RETURNING COALESCE(total_xp, 0)::int as total_xp`,
    [amt, sid]
  );

  if (result.rowCount === 0) {
    try {
      await pool.query(
        `INSERT INTO sessions (session_id, total_xp) VALUES ($1, $2) ON CONFLICT (session_id) DO UPDATE SET total_xp = COALESCE(sessions.total_xp, 0) + EXCLUDED.total_xp`,
        [sid, amt]
      );
    } catch (e) {
      console.warn('[level] addXP: insert/upsert failed:', e.message);
      return amt;
    }
    const r = await pool.query(
      `SELECT COALESCE(total_xp, 0)::int as total_xp FROM sessions WHERE session_id = $1`,
      [sid]
    );
    return Number(r.rows[0]?.total_xp || amt);
  }

  return Number(result.rows[0].total_xp);
}
