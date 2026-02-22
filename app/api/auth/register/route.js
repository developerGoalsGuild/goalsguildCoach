import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { signJWT, hashPassword } from '../../../lib/auth';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = checkRateLimit({ key: `register:${ip}`, max: 5, windowMs: 15 * 60 * 1000 });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Try again later.' },
        { status: 429 }
      );
    }

    const pool = getPool();
    const { email, password, name, planId, daily_work_hours, focus_area, context_for_coach } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPassword.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 chars and include upper, lower, and number' },
        { status: 400 }
      );
    }

    // Resolve plan: validate planId or fall back to free (only if subscription_plans exists)
    let resolvedPlanId = null;
    try {
      if (planId) {
        const planRow = await pool.query(
          'SELECT id FROM subscription_plans WHERE id = $1',
          [planId]
        );
        if (planRow.rows.length > 0) {
          resolvedPlanId = planRow.rows[0].id;
        }
      }
      if (!resolvedPlanId) {
        const freePlan = await pool.query(
          "SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1"
        );
        resolvedPlanId = freePlan.rows[0]?.id ?? null;
      }
    } catch (e) {
      // subscription_plans table may not exist yet; continue without plan
      if (e.code !== '42P01') console.error('Register plan lookup:', e.message);
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user (with default_plan_id and profile columns if they exist)
    const insertCols = ['email', 'password_hash', 'name'];
    const insertVals = [email.toLowerCase(), hashedPassword, name || email.split('@')[0]];
    if (resolvedPlanId) {
      const hasDefaultPlan = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'default_plan_id'`
      );
      if (hasDefaultPlan.rows.length > 0) {
        insertCols.push('default_plan_id');
        insertVals.push(resolvedPlanId);
      }
    }
    // Optional profile fields for coach
    const numHours = daily_work_hours != null && daily_work_hours !== '' ? parseFloat(daily_work_hours) : null;
    if (numHours != null && !Number.isNaN(numHours) && numHours >= 1 && numHours <= 24) {
      const hasCol = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'daily_work_hours'`
      );
      if (hasCol.rows.length > 0) {
        insertCols.push('daily_work_hours');
        insertVals.push(numHours);
      }
    }
    if (focus_area && typeof focus_area === 'string' && focus_area.trim()) {
      const hasCol = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'focus_area'`
      );
      if (hasCol.rows.length > 0) {
        insertCols.push('focus_area');
        insertVals.push(focus_area.trim());
      }
    }
    if (context_for_coach && typeof context_for_coach === 'string' && context_for_coach.trim()) {
      const hasCol = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'context_for_coach'`
      );
      if (hasCol.rows.length > 0) {
        insertCols.push('context_for_coach');
        insertVals.push(context_for_coach.trim());
      }
    }
    const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `INSERT INTO users (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING id, email, name, created_at`,
      insertVals
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = signJWT({ userId: user.id, email: user.email });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
