import { NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { getAuthToken, verifyJWT } from '../../lib/auth';
import { getLevelFromTotalXP, ensureLevelSchema } from '../../lib/level';

export async function GET(request) {
  try {
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    await ensureLevelSchema(pool);
    const sessionId = decoded.userId;

    const result = await pool.query(
      `SELECT COALESCE(total_xp, 0)::int as total_xp FROM sessions WHERE session_id = $1`,
      [sessionId]
    );
    const totalXP = Number(result.rows[0]?.total_xp ?? 0);
    const level = getLevelFromTotalXP(totalXP);

    return NextResponse.json({ total_xp: totalXP, ...level });
  } catch (error) {
    console.error('Level fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch level' }, { status: 500 });
  }
}
