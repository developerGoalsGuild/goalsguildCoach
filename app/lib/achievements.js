// Função para verificar achievements automaticamente após ações importantes

export async function checkAndUnlockAchievements(sessionId) {
  try {
    const response = await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
      // Mostrar notificações
      data.newlyUnlocked.forEach((achievement, index) => {
        setTimeout(() => {
          showAchievementNotification(achievement);
        }, index * 1000);
      });
    }

    return data.newlyUnlocked || [];
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

function showAchievementNotification(achievement) {
  // Criar notificação customizada
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #000;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 350px;
  `;

  const header = document.createElement('div');
  header.style.cssText = 'display: flex; align-items: center; margin-bottom: 0.5rem;';

  const icon = document.createElement('div');
  icon.style.cssText = 'font-size: 1.5rem; margin-right: 0.75rem;';
  icon.textContent = '🏆';

  const textWrap = document.createElement('div');
  textWrap.style.cssText = 'flex: 1;';

  const title = document.createElement('div');
  title.style.cssText = 'font-size: 0.875rem; font-weight: 700; color: #000;';
  title.textContent = 'Achievement Desbloqueado!';

  const body = document.createElement('div');
  body.style.cssText = 'font-size: 0.75rem; color: #000;';
  body.textContent = achievement?.name || 'Nova conquista';

  textWrap.appendChild(title);
  header.appendChild(icon);
  header.appendChild(textWrap);
  notification.appendChild(header);
  notification.appendChild(body);

  // Adicionar animação
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Remover após 5 segundos
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(notification);
      document.head.removeChild(style);
    }, 300);
  }, 5000);
}

// Hook React para verificar achievements automaticamente
export function useAchievementChecker() {
  const checkAchievements = async () => {
    await checkAndUnlockAchievements();
  };

  return { checkAchievements };
}
