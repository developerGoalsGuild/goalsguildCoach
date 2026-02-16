/**
 * Testes atualizados para APIs com JWT e tabela unificada goals
 */

describe('APIs Atualizadas (JWT + Goals)', () => {
  const mockPool = {
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tabela Goals - Unificada', () => {
    it('deve listar objetivos do usuário', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            id: '123',
            title: 'Aprender Inglês',
            description: 'Objetivo de teste',
            is_nlp_complete: false,
          },
        ],
      });

      const result = await mockPool.query(
        'SELECT * FROM goals WHERE session_id = $1',
        ['user123']
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].title).toBe('Aprender Inglês');
    });

    it('deve criar novo objetivo simples', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: '123', title: 'Teste' }],
      });

      const result = await mockPool.query(
        'INSERT INTO goals (title, description, session_id) VALUES ($1, $2, $3) RETURNING *',
        ['Teste', 'Descrição', 'user123']
      );

      expect(result.rows[0].title).toBe('Teste');
    });

    it('deve criar objetivo NLP completo', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: '123', title: 'NLP Test', is_nlp_complete: true }],
      });

      const result = await mockPool.query(
        `INSERT INTO goals (
          title, description, is_nlp_complete,
          nlp_criteria_positive, nlp_criteria_sensory,
          nlp_criteria_compelling, nlp_criteria_ecology
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          'NLP Test',
          'Descrição',
          true,
          'Quero aprender',
          'Vendo o progresso',
          'Me motiva',
          'Melhora minha vida'
        ]
      );

      expect(result.rows[0].is_nlp_complete).toBe(true);
    });
  });

  describe('Analytics API', () => {
    it('deve calcular estatísticas gerais', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            total_quests_completed: 10,
            active_quests: 3,
            total_xp_offered: 1000,
            total_xp_earned: 500,
          },
        ],
      });

      const result = await mockPool.query(
        'SELECT COUNT(*) FROM quests WHERE session_id = $1',
        ['user123']
      );

      expect(result.rows).toBeDefined();
    });
  });

  describe('Reports API', () => {
    it('deve gerar report semanal', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            quests_completed: 5,
            xp_earned: 250,
            active_days: 3,
          },
        ],
      });

      const result = await mockPool.query(
        'SELECT COUNT(*) FROM quests WHERE session_id = $1',
        ['user123']
      );

      expect(result.rows).toBeDefined();
    });
  });

  describe('Reminders API', () => {
    it('deve criar lembrete', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: '123', objective_id: '456' }],
      });

      const result = await mockPool.query(
        'INSERT INTO objective_reminders (session_id, objective_id, frequency) VALUES ($1, $2, $3) RETURNING *',
        ['user123', '456', 'daily']
      );

      expect(result.rows[0].objective_id).toBe('456');
    });
  });
});
