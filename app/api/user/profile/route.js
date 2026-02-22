import { NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { getUserFromToken } from '../../../lib/auth';

/**
 * GET /api/user/profile
 * Returns current user's profile (name, email, daily_work_hours, focus_area, context_for_coach)
 */
export async function GET(request) {
  const user = getUserFromToken(request);

  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = getPool();
    const cols = ['id', 'email', 'name'];
    const profileCols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name IN ('daily_work_hours', 'focus_area', 'context_for_coach')`
    );
    profileCols.rows.forEach((r) => cols.push(r.column_name));
    const selectCols = cols.join(', ');
    const result = await pool.query(`SELECT ${selectCols} FROM users WHERE id = $1`, [user.userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const profile = {
      id: row.id,
      email: row.email,
      name: row.name ?? '',
      daily_work_hours: row.daily_work_hours ?? null,
      focus_area: row.focus_area ?? '',
      context_for_coach: row.context_for_coach ?? '',
    };
    return NextResponse.json(profile);
  } catch (error) {
    console.error('[profile GET]', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/profile
 * Updates name, daily_work_hours, focus_area, context_for_coach (only provided fields)
 */
export async function PATCH(request) {
  const user = getUserFromToken(request);

  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, daily_work_hours, focus_area, context_for_coach } = body;

    const pool = getPool();
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(typeof name === 'string' ? name.trim() : '');
    }
    if (daily_work_hours !== undefined) {
      const num = daily_work_hours === '' || daily_work_hours == null ? null : parseFloat(daily_work_hours);
      if (num !== null && (Number.isNaN(num) || num < 1 || num > 24)) {
        return NextResponse.json({ error: 'daily_work_hours must be between 1 and 24' }, { status: 400 });
      }
      const hasCol = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'daily_work_hours'`
      );
      if (hasCol.rows.length > 0) {
        updates.push('daily_work_hours = $' + idx++);
        values.push(num);
      }
    }
    if (focus_area !== undefined) {
      const hasCol = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'focus_area'`
      );
      if (hasCol.rows.length > 0) {
        updates.push('focus_area = $' + idx++);
        values.push(typeof focus_area === 'string' ? focus_area.trim() : '');
      }
    }
    if (context_for_coach !== undefined) {
      const hasCol = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'context_for_coach'`
      );
      if (hasCol.rows.length > 0) {
        updates.push('context_for_coach = $' + idx++);
        values.push(typeof context_for_coach === 'string' ? context_for_coach.trim() : '');
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(user.userId);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    const cols = ['id', 'email', 'name'];
    const profileCols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name IN ('daily_work_hours', 'focus_area', 'context_for_coach')`
    );
    profileCols.rows.forEach((r) => cols.push(r.column_name));
    const selectCols = cols.join(', ');
    const result = await pool.query(`SELECT ${selectCols} FROM users WHERE id = $1`, [user.userId]);
    const row = result.rows[0];
    const profile = {
      id: row.id,
      email: row.email,
      name: row.name ?? '',
      daily_work_hours: row.daily_work_hours ?? null,
      focus_area: row.focus_area ?? '',
      context_for_coach: row.context_for_coach ?? '',
    };
    return NextResponse.json(profile);
  } catch (error) {
    console.error('[profile PATCH]', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
