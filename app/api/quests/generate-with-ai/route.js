/**
 * POST /api/quests/generate-with-ai
 * Uses LLM to create one quest + tasks automatically.
 * Reads objective memory and completed quests/milestones/tasks to avoid duplicates.
 * Recurring tasks (e.g. daily/weekly habits) can be suggested again.
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getPool } from '../../../lib/db';
import { getUserFromToken } from '../../../lib/auth';
import { TABLES } from '../../../lib/db-schema';
import { checkSubscriptionLimit } from '../../../lib/subscription.js';

const XP_BY_DIFFICULTY = { easy: 50, medium: 100, hard: 200, epic: 400 };
const VALID_DIFFICULTY = ['easy', 'medium', 'hard', 'epic'];

const SYSTEM_PROMPT = `You are a productivity coach. Given the user's objectives (and their memory), and everything they have ALREADY completed (quests, milestones, tasks), you must suggest exactly ONE new quest, 2 to 5 milestones (stages of the quest), and 5 to 12 concrete, executable tasks.

CRITICAL RULES:
1. Do NOT suggest a quest whose title or purpose duplicates an already-completed quest.
2. Do NOT suggest milestones or tasks that duplicate already-completed ones, UNLESS the task is recurring (habits like "Daily standup", "Weekly review").
3. Recurring/habit tasks CAN be suggested again. Mark them with "is_recurring": true.
4. Use the objective memory to align the new quest with the user's real goals and context.
5. Quest: title (short), description (2-4 sentences), difficulty (easy|medium|hard|epic). target_date is REQUIRED: use YYYY-MM-DD, a realistic future date (e.g. 2–4 weeks from now).
6. Milestones: 2-5 stages that break the quest into phases (e.g. "Setup", "Execution", "Review", "Complete"). Each has title and optional description. Use order_index 0, 1, 2... for order.
7. Each task: specific, doable in one day, estimated_hours between 0.25 and 8.

Respond ONLY with valid JSON, no markdown or extra text:
{"quest":{"title":"...","description":"...","difficulty":"medium","target_date":"YYYY-MM-DD"},"milestones":[{"title":"...","description":"...","order_index":0}],"tasks":[{"title":"...","description":"...","estimated_hours":1,"is_recurring":false}]}`;

function buildUserContext(objective, memory, historyEntries, completedQuests, completedMilestones, completedTasks) {
  let s = '## CHOSEN OBJECTIVE (use this to create the quest)\n';
  s += `Title: ${objective.title || 'Untitled'}\n`;
  if (objective.description) s += `Description: ${objective.description}\n`;
  if (objective.target_date) s += `Target date: ${objective.target_date}\n`;
  if (memory) s += `\n**Objective memory (context and NLP summary):**\n${memory}\n`;

  if (historyEntries && historyEntries.length > 0) {
    s += '\n## HISTORY (check-ins, notes for this objective)\n';
    for (const e of historyEntries.slice(0, 15)) {
      const content = typeof e.content === 'object' ? JSON.stringify(e.content) : (e.content || '');
      s += `- [${e.entry_type}] ${(content || e.mood || '').toString().slice(0, 120)}...\n`;
    }
  }

  s += '\n## ALREADY COMPLETED FOR THIS OBJECTIVE (do not duplicate, except recurring tasks)\n';
  s += 'Quests: ' + (completedQuests.length ? completedQuests.map(q => q.title).join('; ') : 'None') + '\n';
  s += 'Milestones: ' + (completedMilestones.length ? completedMilestones.map(m => m.title).join('; ') : 'None') + '\n';
  s += 'Tasks: ' + (completedTasks.length ? completedTasks.map(t => t.title).join('; ') : 'None') + '\n';
  return s;
}

function parseLLMResponse(text) {
  try {
    let jsonStr = text.trim();
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) jsonStr = match[0];
    const data = JSON.parse(jsonStr);
    const quest = data.quest && typeof data.quest.title === 'string'
      ? {
          title: String(data.quest.title).substring(0, 200),
          description: String(data.quest.description || '').substring(0, 2000),
          difficulty: VALID_DIFFICULTY.includes(data.quest.difficulty) ? data.quest.difficulty : 'medium',
          target_date: data.quest.target_date && /^\d{4}-\d{2}-\d{2}$/.test(data.quest.target_date) ? data.quest.target_date : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })()
        }
      : null;
    const milestones = Array.isArray(data.milestones)
      ? data.milestones
          .filter(m => m && typeof m.title === 'string')
          .map((m, i) => ({
            title: String(m.title).substring(0, 200),
            description: m.description ? String(m.description).substring(0, 500) : '',
            order_index: typeof m.order_index === 'number' ? m.order_index : i
          }))
      : [];
    const tasks = Array.isArray(data.tasks)
      ? data.tasks
          .filter(t => t && typeof t.title === 'string')
          .map(t => ({
            title: String(t.title).substring(0, 200),
            description: t.description ? String(t.description).substring(0, 500) : '',
            estimated_hours: Math.min(24, Math.max(0.25, parseFloat(t.estimated_hours) || 1)),
            is_recurring: !!t.is_recurring
          }))
      : [];
    return { quest, milestones, tasks };
  } catch (e) {
    console.error('[generate-with-ai] Parse error:', e.message);
    return { quest: null, milestones: [], tasks: [] };
  }
}

export async function POST(request) {
  const user = getUserFromToken(request);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = user.userId;
  const pool = getPool();

  const questsAiLimit = await checkSubscriptionLimit(sessionId, 'quests_ai');
  if (!questsAiLimit.allowed) {
    return NextResponse.json(
      { error: questsAiLimit.message || 'AI quest limit reached for this month. Upgrade your plan for more.' },
      { status: 403 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch (_) {}
  const objectiveId = body.objectiveId ?? body.objective_id;
  const preview = body.preview === true;
  if (!objectiveId) {
    return NextResponse.json(
      { error: 'objectiveId is required. Choose an objective to create a quest from.' },
      { status: 400 }
    );
  }

  const hasOpenAI =
    !!process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'your-openai-api-key' &&
    process.env.OPENAI_API_KEY.length > 20;
  if (!hasOpenAI) {
    return NextResponse.json(
      { error: 'OpenAI not configured. Set OPENAI_API_KEY.' },
      { status: 503 }
    );
  }

  try {
    // Resolve milestones table name
    let milestonesTable = TABLES.milestones;
    try {
      const msTableResult = await pool.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('quest_milestones', 'milestones')`
      );
      if (msTableResult.rows.some((r) => r.table_name === 'quest_milestones')) {
        milestonesTable = 'quest_milestones';
      } else if (msTableResult.rows.some((r) => r.table_name === 'milestones')) {
        milestonesTable = 'milestones';
      }
    } catch (_) {}

    // Resolve tasks table (codebase uses tasks_table; some DBs have "tasks")
    let tasksTable = TABLES.tasks;
    try {
      const tTableResult = await pool.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('tasks_table', 'tasks')`
      );
      if (tTableResult.rows.some((r) => r.table_name === 'tasks') && !tTableResult.rows.some((r) => r.table_name === 'tasks_table')) {
        tasksTable = 'tasks';
      }
    } catch (_) {}

    // Detect user column: schema-with-auth uses user_id (UUID), schema-working uses session_id (varchar)
    const goalsCols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'goals' AND column_name IN ('user_id', 'session_id')`
    );
    const questsCols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name IN ('user_id', 'session_id')`
    );
    const goalsUserCol = goalsCols.rows.some((r) => r.column_name === 'user_id') ? 'user_id' : 'session_id';
    const questsUserCol = questsCols.rows.some((r) => r.column_name === 'user_id') ? 'user_id' : 'session_id';

    // 1. Load the chosen objective and verify it belongs to the user (core columns; NLP columns may not exist in all schemas)
    const objectiveResult = await pool.query(
      `SELECT id, title, description, target_date FROM goals WHERE id::text = $1::text AND (${goalsUserCol})::text = $2::text`,
      [String(objectiveId), String(sessionId)]
    );
    if (objectiveResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Objective not found or access denied.' },
        { status: 404 }
      );
    }
    const objective = objectiveResult.rows[0];

    // 2. Objective memory (NLP summary)
    let memory = null;
    try {
      const memResult = await pool.query(
        `SELECT memory FROM objective_memories WHERE objective_id::text = $1::text AND session_id::text = $2::text ORDER BY created_at DESC LIMIT 1`,
        [String(objectiveId), String(sessionId)]
      );
      memory = memResult.rows[0]?.memory || null;
    } catch (_) {}

    // 3. History: quest_journal entries for quests linked to this objective
    let historyEntries = [];
    try {
      const histResult = await pool.query(
        `SELECT qj.entry_type, qj.content, qj.mood, qj.created_at
         FROM quest_journal qj
         INNER JOIN quests q ON qj.quest_id::text = q.id::text
         WHERE q.parent_goal_id::text = $1::text
         ORDER BY qj.created_at DESC
         LIMIT 50`,
        [String(objectiveId)]
      );
      historyEntries = histResult.rows.map((r) => ({
        ...r,
        content: typeof r.content === 'string' ? (() => { try { return JSON.parse(r.content); } catch { return r.content; } })() : r.content
      }));
    } catch (_) {}

    // 4. Completed quests for THIS objective only
    const completedQuests = await pool.query(
      `SELECT id, title FROM quests WHERE (${questsUserCol})::text = $1::text AND parent_goal_id::text = $2::text AND status = 'completed' ORDER BY completed_at DESC`,
      [String(sessionId), String(objectiveId)]
    );

    // 5. Completed milestones for quests of this objective
    const completedMilestones = await pool.query(
      `SELECT m.title FROM ${milestonesTable} m WHERE m.quest_id::text IN (SELECT q.id::text FROM quests q WHERE (q.${questsUserCol})::text = $1::text AND q.parent_goal_id::text = $2::text) AND m.status = 'completed'`,
      [String(sessionId), String(objectiveId)]
    );

    // 6. Completed tasks for quests of this objective
    const tasksCols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name IN ('user_id', 'session_id')`,
      [tasksTable]
    );
    const tasksUserCol = tasksCols.rows.some((r) => r.column_name === 'user_id') ? 'user_id' : 'session_id';
    const completedTasks = await pool.query(
      `SELECT t.title FROM ${tasksTable} t INNER JOIN quests q ON t.quest_id::text = q.id::text WHERE q.parent_goal_id::text = $1::text AND t.${tasksUserCol}::text = $2::text AND t.status = 'completed'`,
      [String(objectiveId), String(sessionId)]
    );

    const userContext = buildUserContext(
      objective,
      memory,
      historyEntries,
      completedQuests.rows,
      completedMilestones.rows,
      completedTasks.rows
    );

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContext }
      ],
      temperature: 0.6,
      max_tokens: 2000
    });

    const content = completion.choices[0]?.message?.content || '';
    const { quest, milestones: milestonesFromLLM, tasks } = parseLLMResponse(content);

    if (!quest || quest.title.length === 0) {
      return NextResponse.json(
        { error: 'Could not generate a valid quest. Try again.' },
        { status: 422 }
      );
    }

    // If preview mode, return the structure without inserting
    if (preview) {
      const xp = XP_BY_DIFFICULTY[quest.difficulty] ?? 100;
      return NextResponse.json({
        preview: true,
        quest: {
          title: quest.title,
          description: quest.description,
          difficulty: quest.difficulty,
          target_date: quest.target_date || (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })(),
          xp_reward: xp
        },
        milestones: milestonesFromLLM,
        tasks: tasks
      });
    }

    // Insert quest: detect which columns exist (target_date, estimated_xp vs xp_reward vary by schema)
    const xp = XP_BY_DIFFICULTY[quest.difficulty] ?? 100;
    const questCols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name IN ('target_date', 'estimated_xp', 'xp_reward', 'parent_goal_id')`
    );
    const questColNames = questCols.rows.map((r) => r.column_name);
    let hasTargetDate = questColNames.includes('target_date');
    const hasParentGoalId = questColNames.includes('parent_goal_id');
    const xpCol = questColNames.includes('estimated_xp') ? 'estimated_xp' : questColNames.includes('xp_reward') ? 'xp_reward' : null;

    if (!hasTargetDate) {
      try {
        await pool.query('ALTER TABLE quests ADD COLUMN IF NOT EXISTS target_date DATE');
        hasTargetDate = true;
      } catch (alterErr) {
        console.error('[generate-with-ai] Could not add target_date column:', alterErr);
        return NextResponse.json(
          { error: 'Every quest must have a target date. The quests table is missing the target_date column. Add it with: ALTER TABLE quests ADD COLUMN target_date DATE;' },
          { status: 400 }
        );
      }
    }

    const qCols = [questsUserCol, 'title', 'description', 'difficulty'];
    const qVals = [String(sessionId), quest.title, quest.description, quest.difficulty];
    if (hasParentGoalId) {
      qCols.push('parent_goal_id');
      qVals.push(objectiveId);
    }
    if (xpCol) {
      qCols.push(xpCol);
      qVals.push(xp);
    }
    if (hasTargetDate) {
      qCols.push('target_date');
      qVals.push(quest.target_date || (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })());
    }
    const hasCreatedByAi = (await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name = 'created_by_ai'`
    )).rows.length > 0;
    if (hasCreatedByAi) {
      qCols.push('created_by_ai');
      qVals.push(true);
    }
    const placeholders = qCols.map((_, i) => (i === 0 ? '$1::text' : `$${i + 1}`)).join(', ');
    const questInsert = await pool.query(
      `INSERT INTO quests (${qCols.join(', ')}) VALUES (${placeholders}) RETURNING id, title, description, difficulty`,
      qVals
    );
    const newQuest = questInsert.rows[0];
    const questId = newQuest.id;

    // Insert milestones (quest_milestones or milestones table; optional order_index)
    const msColsResult = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
      [milestonesTable]
    );
    const msCols = msColsResult.rows.map((r) => r.column_name);
    const hasOrderIndex = msCols.includes('order_index');
    for (const m of milestonesFromLLM) {
      if (hasOrderIndex) {
        await pool.query(
          `INSERT INTO ${milestonesTable} (quest_id, title, description, status, order_index) VALUES ($1, $2, $3, $4, $5)`,
          [questId, m.title, m.description || '', 'pending', m.order_index]
        );
      } else {
        await pool.query(
          `INSERT INTO ${milestonesTable} (quest_id, title, description, status) VALUES ($1, $2, $3, $4)`,
          [questId, m.title, m.description || '', 'pending']
        );
      }
    }

    // Insert tasks (use tasks table's user column)
    for (const t of tasks) {
      await pool.query(
        `INSERT INTO ${tasksTable} (${tasksUserCol}, quest_id, title, description, estimated_hours, status) VALUES ($1::text, $2, $3, $4, $5, 'pending')`,
        [String(sessionId), questId, t.title, t.description || '', t.estimated_hours]
      );
    }

    return NextResponse.json({
      success: true,
      quest: {
        id: newQuest.id,
        title: newQuest.title,
        description: newQuest.description,
        difficulty: newQuest.difficulty,
        milestonesCount: milestonesFromLLM.length,
        tasksCount: tasks.length
      }
    });
  } catch (err) {
    console.error('[generate-with-ai] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate quest' },
      { status: 500 }
    );
  }
}
