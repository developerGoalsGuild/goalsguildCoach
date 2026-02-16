/**
 * Nomes de tabelas/colunas. Padrão: quest_milestones (coerente com quest_journal).
 */
export const TABLES = {
  milestones: 'quest_milestones',
  tasks: 'tasks_table',
};

export const COLS = {
  questsUser: 'session_id',      // schema-working usa session_id; schema-with-auth usa user_id
  goalsUser: 'session_id',
};
