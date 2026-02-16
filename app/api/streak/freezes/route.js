import { NextResponse } from 'next/server';
import { getPool, ensureStreakFreezesTable } from '../../../lib/db';
import { getAuthToken, verifyJWT } from '../../../lib/auth';

const FREEZES_PER_MONTH = 2;

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfMonth(d) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1);
  x.setDate(0);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function GET(request) {
  try {
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const pool = getPool();
    await ensureStreakFreezesTable(pool);
    const sessionId = decoded.userId;
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const result = await pool.query(
      `SELECT COUNT(*)::int as n FROM streak_freezes WHERE session_id = $1 AND used_date >= $2 AND used_date <= $3`,
      [sessionId, start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
    );
    const used_this_month = result.rows[0]?.n || 0;
    const remaining = Math.max(0, FREEZES_PER_MONTH - used_this_month);

    return NextResponse.json({
      used_this_month,
      limit: FREEZES_PER_MONTH,
      remaining,
    });
  } catch (e) {
    console.error('Streak freezes GET:', e);
    return NextResponse.json({ error: 'Failed to fetch freezes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const pool = getPool();
    await ensureStreakFreezesTable(pool);
    const sessionId = decoded.userId;
    const body = await request.json().catch(() => ({}));
    const dateStr = body.date ? new Date(body.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    const now = new Date();
    const start = startOfMonth(now).toISOString().slice(0, 10);
    const end = endOfMonth(now).toISOString().slice(0, 10);

    if (dateStr < start || dateStr > end) {
      return NextResponse.json({ error: 'Date must be in the current month' }, { status: 400 });
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int as n FROM streak_freezes WHERE session_id = $1 AND used_date >= $2 AND used_date <= $3`,
      [sessionId, start, end]
    );
    if ((countResult.rows[0]?.n || 0) >= FREEZES_PER_MONTH) {
      return NextResponse.json({ error: 'No freezes remaining this month', remaining: 0 }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO streak_freezes (session_id, used_date) VALUES ($1, $2) ON CONFLICT (session_id, used_date) DO NOTHING`,
      [sessionId, dateStr]
    );

    const newCount = await pool.query(
      `SELECT COUNT(*)::int as n FROM streak_freezes WHERE session_id = $1 AND used_date >= $2 AND used_date <= $3`,
      [sessionId, start, end]
    );
    const used = newCount.rows[0]?.n || 0;
    const remaining = Math.max(0, FREEZES_PER_MONTH - used);

    return NextResponse.json({ success: true, used_this_month: used, remaining });
  } catch (e) {
    console.error('Streak freezes POST:', e);
    return NextResponse.json({ error: 'Failed to use freeze' }, { status: 500 });
  }
}
