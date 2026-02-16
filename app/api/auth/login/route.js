import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { signJWT, comparePasswordDetailed, hashPassword } from '../../../lib/auth';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = checkRateLimit({ key: `login:${ip}`, max: 8, windowMs: 15 * 60 * 1000 });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429 }
      );
    }

    const pool = getPool();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verify password
    const { valid: isValid, usedLegacy } = await comparePasswordDetailed(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (usedLegacy) {
      const upgradedHash = await hashPassword(password);
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [upgradedHash, user.id]
      );
    }

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
