import { getPool } from './db.js';

// Agendar notificação
export async function scheduleNotification(sessionId, notification) {
  const pool = getPool();

  const { type, title, message, scheduledFor, data } = notification;

  const result = await pool.query(`
    INSERT INTO notifications (
      session_id,
      type,
      title,
      message,
      scheduled_for,
      data,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, [sessionId, type, title, message, scheduledFor, JSON.stringify(data), 'scheduled']);

  return result.rows[0].id;
}

// Buscar notificações pendentes
export async function getPendingNotifications() {
  const pool = getPool();
  const now = new Date();

  const result = await pool.query(`
    SELECT 
      id,
      session_id,
      type,
      title,
      message,
      data
    FROM notifications
    WHERE status = 'scheduled'
      AND scheduled_for <= $1
    ORDER BY scheduled_for ASC
  `, [now]);

  return result.rows;
}

// Marcar notificação como enviada
export async function markNotificationAsSent(notificationId) {
  const pool = getPool();

  await pool.query(
    'UPDATE notifications SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['sent', notificationId]
  );
}

// Criar notificações automáticas baseadas no usuário
export async function createAutomaticNotifications(sessionId) {
  const notifications = [];

  // Check-in diário (9h e 21h)
  notifications.push({
    type: 'daily_checkin',
    title: '📝 Check-in Diário',
    message: 'Como está seu dia? Faça seu check-in!',
    scheduledFor: getNextTimeFor(9, 0),
    recurring: 'daily',
    data: { action: 'daily_checkin' }
  });

  notifications.push({
    type: 'daily_checkin',
    title: '📝 Check-in Noturno',
    message: 'Como foi seu dia? Faça seu check-in!',
    scheduledFor: getNextTimeFor(21, 0),
    recurring: 'daily',
    data: { action: 'daily_checkin' }
  });

  // Weekly review (domingo 10h)
  const nextSunday = getNextDayOfWeek(0); // 0 = domingo
  nextSunday.setHours(10, 0, 0, 0);

  notifications.push({
    type: 'weekly_review',
    title: '📊 Weekly Review',
    message: 'Hora de revisar sua semana!',
    scheduledFor: nextSunday,
    recurring: 'weekly',
    data: { action: 'weekly_review' }
  });

  // Salvar notificações
  for (const notification of notifications) {
    await scheduleNotification(sessionId, notification);
  }

  return notifications;
}

// Notificações de objetivos
export async function createObjectiveNotifications(sessionId, objectiveId, objective) {
  const notifications = [];

  // Lembrete de objetivo em risco (sem atividade há 3 dias)
  if (objective.lastActivity) {
    const daysSinceActivity = Math.floor(
      (new Date() - new Date(objective.lastActivity)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity >= 3) {
      notifications.push({
        type: 'objective_at_risk',
        title: '⚠️ Objetivo em Risco',
        message: `"${objective.statement}" - Há ${daysSinceActivity} dias sem atividade`,
        scheduledFor: new Date(),
        data: { objectiveId, action: 'check_objective' }
      });
    }
  }

  // Celebração de achievement
  if (objective.newAchievement) {
    notifications.push({
      type: 'achievement_unlocked',
      title: '🏆 Achievement Desbloqueado!',
      message: `Parabéns! Você desbloqueou "${objective.newAchievement}"`,
      scheduledFor: new Date(),
      data: { action: 'view_achievements' }
    });
  }

  // Salvar notificações
  for (const notification of notifications) {
    await scheduleNotification(sessionId, notification);
  }

  return notifications;
}

// Helper functions
function getNextTimeFor(hour, minute) {
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hour, minute, 0, 0);

  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  return scheduled;
}

function getNextDayOfWeek(dayOfWeek) {
  const date = new Date();
  date.setDate(date.getDate() + (dayOfWeek + 7 - date.getDay()) % 7);
  return date;
}

// Processar notificações pendentes e enviar
export async function processPendingNotifications() {
  const notifications = await getPendingNotifications();

  for (const notification of notifications) {
    try {
      // Aqui você enviaria a notificação
      // Como não temos um sistema real de push, vamos simular
      
      console.log(`📬 Notificação para session ${notification.session_id}:`);
      console.log(`   ${notification.title}`);
      console.log(`   ${notification.message}`);

      // Marcar como enviada
      await markNotificationAsSent(notification.id);

      // Se for recorrente, criar próxima
      if (notification.data && notification.data.recurring) {
        // Lógica para criar próxima notificação recorrente
      }
    } catch (error) {
      console.error(`Erro ao processar notificação ${notification.id}:`, error);
    }
  }

  return notifications.length;
}

// Notificações de tarefas pendentes
export async function createPendingTasksNotifications(sessionId, pendingTasks) {
  if (pendingTasks.length === 0) return [];

  const notifications = [];

  notifications.push({
    type: 'pending_tasks',
    title: `⏳ ${pendingTasks.length} Tarefas Pendentes`,
    message: 'Você tem tarefas pendentes. Vamos resolver?',
    scheduledFor: new Date(),
    data: { action: 'view_tasks', count: pendingTasks.length }
  });

  for (const notification of notifications) {
    await scheduleNotification(sessionId, notification);
  }

  return notifications;
}

// Buscar notificações do usuário
export async function getUserNotifications(sessionId) {
  const pool = getPool();

  const result = await pool.query(`
    SELECT 
      id,
      type,
      title,
      message,
      scheduled_for,
      sent_at,
      status,
      data
    FROM notifications
    WHERE session_id = $1
      AND created_at >= CURRENT_DATE
    ORDER BY scheduled_for DESC
    LIMIT 50
  `, [sessionId]);

  return result.rows.map(row => ({
    ...row,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
  }));
}
