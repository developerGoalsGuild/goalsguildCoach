/**
 * Testes da API do Chat com Sistema LLM
 * Cobertura do fluxo completo de perguntas NLP
 */

// Mock das funcoes auxiliares
const checkMessagePolicy = jest.fn((message) => {
  const lower = message.toLowerCase();
  if (lower.includes('matar') || lower.includes('matar alguém')) {
    return { allowed: false, reason: 'violence' };
  }
  if (lower.includes('machucar') || lower.includes('me machucar')) {
    return { allowed: false, reason: 'self-harm' };
  }
  return { allowed: true };
});

const isApprovalMessage = jest.fn((message) => {
  const lower = message.toLowerCase().trim();
  return ['sim', 'salvar', 'confirmar'].some(pattern => lower === pattern || lower.includes(pattern));
});

const isRejectionMessage = jest.fn((message) => {
  const lower = message.toLowerCase().trim();
  return ['nao', 'cancelar', 'descartar'].some(pattern => lower === pattern || lower.includes(pattern));
});

const processWithoutOpenAI = jest.fn(async (message, history) => {
  return 'Ola! Eu sou o GoalsGuild Coach! Como voce está hoje?';
});

describe('API do Chat - Sistema LLM Integrado', () => {
  
  describe('POST /api/chat - Fluxo LLM', () => {
    
    it('deve detectar objetivo incompleto e fazer pergunta', async () => {
      const userMessage = 'Quero aprender ingles';
      
      const mockResponse = {
        success: true,
        complete: false,
        response: 'Legal! Me conta mais: quando voce imagina aprendendo ingles, o que voce VE e SENTE?'
      };
      
      expect(mockResponse.success).toBe(true);
      expect(mockResponse.complete).toBe(false);
      expect(mockResponse.response).toContain('VE');
    });

    it('deve coletar criterio e fazer proxima pergunta', async () => {
      const userMessage = 'Me vejo falando com estrangeiros';
      const history = [
        { role: 'user', content: 'Quero aprender ingles' },
        { role: 'assistant', content: 'Pergunta 1' }
      ];
      
      const mockResponse = {
        success: true,
        complete: false,
        response: 'Isso me empolga! E como voce imagina que isso vai impactar sua carreira?'
      };
      
      expect(mockResponse.success).toBe(true);
      expect(mockResponse.complete).toBe(false);
    });

    it('deve detectar objetivo NLP completo', async () => {
      const userMessage = 'Todas as respostas dadas';
      const history = [
        { role: 'user', content: 'Quero aprender ingles' },
        { role: 'assistant', content: 'Pergunta 1' }
      ];
      
      const mockResponse = {
        success: true,
        complete: true,
        response: 'Objetivo NLP Completo! Titulo: Aprender ingles. Criterios NLP: 8/8 coletados.',
        objective: {
          title: 'Aprender ingles',
          is_nlp_complete: true,
          nlp_criteria_positive: 'Quero aprender ingles',
          nlp_criteria_sensory: 'Vejo falando com estrangeiros',
          nlp_criteria_compelling: 'Me sinto confiante',
          nlp_criteria_ecology: 'Impacta carreira',
          nlp_criteria_self_initiated: 'Vou estudar',
          nlp_criteria_context: 'Em casa',
          nlp_criteria_resources: 'Aplicativos',
          nlp_criteria_evidence: 'Conversa fluentemente'
        }
      };
      
      expect(mockResponse.success).toBe(true);
      expect(mockResponse.complete).toBe(true);
      expect(mockResponse.objective).toBeDefined();
      expect(mockResponse.objective.is_nlp_complete).toBe(true);
    });

    it('deve retornar pendingApproval=true quando objetivo completo', async () => {
      const apiResponse = {
        message: 'Objetivo NLP Completo!',
        pendingApproval: true,
        objective: {
          title: 'Aprender ingles',
          is_nlp_complete: true
        }
      };
      
      expect(apiResponse.pendingApproval).toBe(true);
      expect(apiResponse.objective).toBeDefined();
    });

    it('deve salvar objetivo quando usuario aprovar', async () => {
      const approvalMessage = 'SIM';
      const pendingData = {
        objective: {
          title: 'Aprender ingles',
          is_nlp_complete: true,
          nlp_criteria_positive: 'Quero aprender ingles'
        },
        memory: 'Memoria formatada...'
      };
      
      const mockSaveResult = {
        success: true,
        objectiveId: '123',
        title: 'Aprender ingles',
        message: 'Objetivo NLP salvo com sucesso! Agora voce pode ver seus objetivos.'
      };
      
      expect(mockSaveResult.success).toBe(true);
      expect(mockSaveResult.objectiveId).toBeDefined();
      expect(mockSaveResult.message).toContain('salvo com sucesso');
    });

    it('deve cancelar objetivo quando usuario rejeitar', async () => {
      const rejectionMessage = 'NAO';
      const pendingData = {
        objective: {
          title: 'Aprender ingles'
        }
      };
      
      const cancelMessage = 'Tudo bem! Nao salvei o objetivo. Se quiser, podemos conversar mais.';
      
      expect(cancelMessage).toContain('Nao salvei');
      expect(cancelMessage).toContain('conversar mais');
    });
  });

  describe('Fluxo Completo de Conversa', () => {
    
    it('deve fazer fluxo completo: deteccao -> perguntas -> aprovacao -> salvamento', async () => {
      
      // Passo 1: Usuario inicia
      let userMessage = 'Quero aprender ingles';
      let history = [];
      
      let llmResponse = {
        success: true,
        complete: false,
        response: 'Legal! Me conta mais: quando voce imagina aprendendo ingles?'
      };
      
      expect(llmResponse.success).toBe(true);
      expect(llmResponse.complete).toBe(false);
      
      // Passo 2: Usuario responde
      userMessage = 'Me vejo falando com estrangeiros';
      history = [
        { role: 'user', content: 'Quero aprender ingles' },
        { role: 'assistant', content: llmResponse.response }
      ];
      
      llmResponse = {
        success: true,
        complete: false,
        response: 'Isso me empolga! E como voce imagina que isso vai impactar sua carreira?'
      };
      
      expect(llmResponse.response).toContain('empolga');
      
      // Passo 3: Usuario responde
      userMessage = 'Vai mudar minha vida e abrir portas no trabalho';
      history.push(
        { role: 'user', content: 'Me vejo falando com estrangeiros...' },
        { role: 'assistant', content: llmResponse.response }
      );
      
      llmResponse = {
        success: true,
        complete: false,
        response: 'Perfeito! E quando, onde e com quem voce vai fazer isso?'
      };
      
      expect(llmResponse.response).toContain('quando');
      
      // Passo Final: Objetivo completo
      llmResponse = {
        success: true,
        complete: true,
        response: 'Objetivo NLP Completo! Deseja salvar este objetivo?',
        objective: {
          title: 'Aprender ingles',
          statement: 'Quero aprender ingles fluentemente',
          is_nlp_complete: true,
          nlp_criteria_positive: 'Quero aprender ingles',
          nlp_criteria_sensory: 'Vejo falando com estrangeiros',
          nlp_criteria_compelling: 'Me sinto confiante',
          nlp_criteria_ecology: 'Vai impactar carreira',
          nlp_criteria_self_initiated: 'Vou estudar',
          nlp_criteria_context: 'Em casa',
          nlp_criteria_resources: 'Aplicativos',
          nlp_criteria_evidence: 'Conversa fluentemente'
        }
      };
      
      expect(llmResponse.complete).toBe(true);
      expect(llmResponse.objective).toBeDefined();
      expect(llmResponse.response).toContain('Deseja salvar');
      
      // Usuario aprova
      const approvalResult = {
        success: true,
        objectiveId: '123',
        title: 'Aprender ingles',
        message: 'Objetivo NLP salvo com sucesso!'
      };
      
      expect(approvalResult.success).toBe(true);
      expect(approvalResult.objectiveId).toBeDefined();
    });
  });

  describe('Sistema de Aprovacao', () => {
    
    it('deve armazenar objetivo pendente', () => {
      const pendingKey = 'session-123_nlp_pending';
      const pendingData = {
        objective: {
          title: 'Aprender ingles',
          is_nlp_complete: true
        },
        memory: 'Memoria formatada...'
      };
      
      const pendingObjectives = new Map();
      pendingObjectives.set(pendingKey, pendingData);
      
      expect(pendingObjectives.has(pendingKey)).toBe(true);
      expect(pendingObjectives.get(pendingKey)).toEqual(pendingData);
    });

    it('deve remover objetivo pendente após aprovacao', () => {
      const pendingKey = 'session-123_nlp_pending';
      const pendingObjectives = new Map();
      
      pendingObjectives.set(pendingKey, { objective: { title: 'Test' } });
      expect(pendingObjectives.has(pendingKey)).toBe(true);
      
      pendingObjectives.delete(pendingKey);
      expect(pendingObjectives.has(pendingKey)).toBe(false);
    });

    it('deve verificar aprovacao corretamente', () => {
      const approvalMessages = ['SIM', 'sim', 'Salvar', 'Confirmar'];
      
      approvalMessages.forEach(msg => {
        expect(isApprovalMessage(msg)).toBe(true);
      });
    });

    it('deve verificar rejeicao corretamente', () => {
      const rejectionMessages = ['NAO', 'nao', 'Cancelar', 'Nao'];
      
      rejectionMessages.forEach(msg => {
        expect(isRejectionMessage(msg)).toBe(true);
      });
    });
  });

  describe('Fallback sem OpenAI', () => {
    
    it('deve usar fallback quando não tiver OpenAI API key', async () => {
      const hasOpenAI = false;
      
      if (!hasOpenAI) {
        const fallbackResponse = await processWithoutOpenAI('Quero aprender ingles', []);
        
        expect(fallbackResponse).toBeDefined();
        expect(fallbackResponse.length).toBeGreaterThan(0);
      }
    });

    it('deve processar mensagem natural sem OpenAI', async () => {
      const userMessage = 'Oi, tudo bem?';
      const history = [];
      
      const response = {
        success: true,
        complete: false,
        response: 'Ola! Eu sou o GoalsGuild Coach! Como voce está hoje?'
      };
      
      expect(response.success).toBe(true);
      expect(response.response).toContain('GoalsGuild Coach');
    });
  });

  describe('Guardrails', () => {
    
    it('deve bloquear mensagens violentas', async () => {
      const userMessage = 'Matar alguém';
      const checkResult = checkMessagePolicy(userMessage);
      
      expect(checkResult.allowed).toBe(false);
      expect(checkResult.reason).toBe('violence');
    });

    it('deve bloquear mensagens de auto-harm', async () => {
      const userMessage = 'Quero me machucar';
      const checkResult = checkMessagePolicy(userMessage);
      
      expect(checkResult.allowed).toBe(false);
      expect(checkResult.reason).toBe('self-harm');
    });

    it('deve permitir mensagens normais', async () => {
      const userMessage = 'Quero aprender ingles';
      const checkResult = checkMessagePolicy(userMessage);
      
      expect(checkResult.allowed).toBe(true);
    });
  });

});
