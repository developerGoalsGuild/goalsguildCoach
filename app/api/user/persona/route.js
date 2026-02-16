import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { getUserFromToken } from '../../../lib/auth';

/**
 * GET /api/user/persona
 * Get user's coach personality preferences
 */
export async function GET(request) {
  const user = getUserFromToken(request);

  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = user.userId;

  try {
    const pool = getPool();
    
    // Ensure persona columns exist
    try {
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS persona_tone VARCHAR(50) DEFAULT \'neutral\'');
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS persona_specialization VARCHAR(50) DEFAULT \'general\'');
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS persona_archetype VARCHAR(50) DEFAULT \'mentor\'');
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS persona_theme VARCHAR(50)');
    } catch (alterErr) {
      console.warn('[persona GET] Could not add persona columns (may already exist):', alterErr.message);
    }

    // Theme column should exist now, always include it
    let selectCols = 'persona_tone, persona_specialization, persona_archetype, persona_theme';

    // Check if session exists, create if not
    let result = await pool.query(
      `SELECT ${selectCols} FROM sessions WHERE session_id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      // Create session with default persona values
      try {
        await pool.query(
          'INSERT INTO sessions (session_id, persona_tone, persona_specialization, persona_archetype) VALUES ($1, $2, $3, $4)',
          [sessionId, 'neutral', 'general', 'mentor']
        );
        result = await pool.query(
          `SELECT ${selectCols} FROM sessions WHERE session_id = $1`,
          [sessionId]
        );
      } catch (insertErr) {
        console.error('[persona GET] Error creating session:', insertErr);
        // Return defaults if insert fails
        return NextResponse.json({
          persona: {
            tone: 'neutral',
            specialization: 'general',
            archetype: 'mentor',
            theme: null
          }
        });
      }
    }

    const persona = {
      tone: result.rows[0]?.persona_tone || 'neutral',
      specialization: result.rows[0]?.persona_specialization || 'general',
      archetype: result.rows[0]?.persona_archetype || 'mentor',
      theme: result.rows[0]?.persona_theme || null
    };

    return NextResponse.json({ persona });
  } catch (error) {
    console.error('Error fetching persona:', error);
    return NextResponse.json({ error: 'Failed to fetch persona' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/persona
 * Update user's coach personality preferences
 */
export async function PATCH(request) {
  const user = getUserFromToken(request);

  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = user.userId;

  try {
    const body = await request.json();
    const { tone, specialization, archetype, theme } = body;

    const pool = getPool();

    // Ensure persona columns exist before updating
    try {
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS persona_tone VARCHAR(50) DEFAULT \'neutral\'');
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS persona_specialization VARCHAR(50) DEFAULT \'general\'');
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS persona_archetype VARCHAR(50) DEFAULT \'mentor\'');
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS persona_theme VARCHAR(50)');
    } catch (alterErr) {
      console.warn('[persona PATCH] Could not add persona columns (may already exist):', alterErr.message);
    }

    // Validate values
    const validTones = ['aggressive', 'gentle', 'neutral', 'sharp', 'warm'];
    const validSpecializations = ['productivity', 'fitness', 'career', 'general'];
    const validArchetypes = ['mentor', 'friend', 'drill-instructor', 'therapist'];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (tone && validTones.includes(tone)) {
      updates.push(`persona_tone = $${paramIndex++}`);
      values.push(tone);
    }

    if (specialization && validSpecializations.includes(specialization)) {
      updates.push(`persona_specialization = $${paramIndex++}`);
      values.push(specialization);
    }

    if (archetype && validArchetypes.includes(archetype)) {
      updates.push(`persona_archetype = $${paramIndex++}`);
      values.push(archetype);
    }

    // Theme is optional (for predefined personas) - always include it if provided
    if (theme !== undefined) {
      updates.push(`persona_theme = $${paramIndex++}`);
      values.push(theme || null);
    }

    // Se não há updates mas theme foi enviado, adicionar theme mesmo assim
    if (updates.length === 0 && theme !== undefined) {
      updates.push(`persona_theme = $${paramIndex++}`);
      values.push(theme || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid persona fields to update' }, { status: 400 });
    }
    
    // Only add updated_at if the column exists
    try {
      const colCheck = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'updated_at'`
      );
      if (colCheck.rows.length > 0) {
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
      }
    } catch (_) {
      // Ignore if check fails
    }
    
    values.push(sessionId);

    // Check if session exists, create if not
    let sessionCheck = await pool.query(
      'SELECT session_id FROM sessions WHERE session_id = $1',
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      // Create session with default persona values
      try {
        await pool.query(
          'INSERT INTO sessions (session_id, persona_tone, persona_specialization, persona_archetype) VALUES ($1, $2, $3, $4)',
          [sessionId, 'neutral', 'general', 'mentor']
        );
      } catch (insertErr) {
        console.error('[persona PATCH] Error creating session:', insertErr);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
    }

    // Add theme to RETURNING if it exists
    let returningCols = 'persona_tone, persona_specialization, persona_archetype';
    try {
      const themeColCheck = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'persona_theme'`
      );
      if (themeColCheck.rows.length > 0) {
        returningCols += ', persona_theme';
      }
    } catch (_) {}

    const result = await pool.query(
      `UPDATE sessions SET ${updates.join(', ')} WHERE session_id = $${paramIndex} RETURNING ${returningCols}`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const persona = {
      tone: result.rows[0].persona_tone,
      specialization: result.rows[0].persona_specialization,
      archetype: result.rows[0].persona_archetype,
      theme: result.rows[0].persona_theme || null
    };

    return NextResponse.json({ persona });
  } catch (error) {
    console.error('Error updating persona:', error);
    return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 });
  }
}
