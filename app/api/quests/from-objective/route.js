import { NextRequest, NextResponse } from 'next/server';
import { createQuestFromObjective } from '../../../lib/create-quest-from-objective';
import { getUserFromToken } from '../../../lib/auth';

// POST - Converter Goal (unificado) em Quest
export async function POST(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { objectiveId } = await request.json();
    
    if (!objectiveId) {
      return NextResponse.json({ error: 'Objective ID is required' }, { status: 400 });
    }

    const sessionId = user.userId;
    const result = await createQuestFromObjective(sessionId, objectiveId);

    if (!result.success) {
      const isLimitError = /limit|upgrade your plan/i.test(result.error || '');
      return NextResponse.json(
        { error: result.error },
        { status: isLimitError ? 403 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questId: result.questId,
      message: 'Quest criada a partir do objetivo!',
      quest: {
        id: result.questId,
        title: result.title,
        milestones: result.milestones,
        xp_reward: result.xp_reward
      }
    });

  } catch (error) {
    console.error('Error creating quest from objective:', error);
    return NextResponse.json({ error: 'Failed to create quest' }, { status: 500 });
  }
}
