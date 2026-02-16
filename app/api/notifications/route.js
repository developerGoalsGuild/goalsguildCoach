import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import {
  scheduleNotification,
  getUserNotifications,
  createAutomaticNotifications,
  createObjectiveNotifications,
  createPendingTasksNotifications
} from '../../lib/notifications';

// GET - Buscar notificações do usuário
export async function GET(request) {
  const sessionId = request.cookies.get('session_id')?.value;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = await getUserNotifications(sessionId);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST - Criar notificação
export async function POST(request) {
  const sessionId = request.cookies.get('session_id')?.value;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, title, message, scheduledFor, data } = body;

    const notificationId = await scheduleNotification(sessionId, {
      type,
      title,
      message,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      data
    });

    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notificação agendada!'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
