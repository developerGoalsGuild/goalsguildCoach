import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { generateWeeklyReview, saveWeeklyReviewResponse } from '../../lib/weekly-review';

// GET - Buscar weekly review
export async function GET(request) {
  const sessionId = request.cookies.get('session_id')?.value;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const review = await generateWeeklyReview(sessionId);

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error generating weekly review:', error);
    return NextResponse.json({ error: 'Failed to generate weekly review' }, { status: 500 });
  }
}

// POST - Salvar respostas da weekly review
export async function POST(request) {
  const sessionId = request.cookies.get('session_id')?.value;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { weekStart, answers } = await request.json();

    const reviewId = await saveWeeklyReviewResponse(sessionId, weekStart, answers);

    return NextResponse.json({
      success: true,
      reviewId,
      message: 'Weekly review salva!'
    });

  } catch (error) {
    console.error('Error saving weekly review:', error);
    return NextResponse.json({ error: 'Failed to save weekly review' }, { status: 500 });
  }
}
