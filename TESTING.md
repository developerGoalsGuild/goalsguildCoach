# Testes Unitários - Documentação

## Testes Implementados

### Testes de Componentes (React)
- ✅ `__tests__/components/PomodoroTimer.test.js`
  - Testa timer 25/5/15 minutos
  - Testa início/pausa/reinício
  - Testa troca automática de modos
  - Testa contagem de pomodoros

### Testes de Bibliotecas (Lib)
- ✅ `__tests__/lib/insights.test.js`
  - Testa análise de padrões de produtividade
  - Testa previsão de conclusão de objetivos
  - Testa formatação de insights

### Testes de APIs (Backend)
- ✅ `__tests__/api/achievements.test.js`
  - Testa GET achievements
  - Testa POST (verificar e desbloquear)
  
- ✅ `__tests__/api/insights.test.js`
  - Testa GET insights
  - Testa POST insights + formatação texto

- ✅ `__tests__/api/weekly-review.test.js`
  - Testa GET weekly review
  - Testa POST salvar respostas

## Como Rodar os Testes

### 1. Instalar Dependências (se necessário)
```bash
cd /home/node/.openclaw/workspace/goalsguild-coach
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @jest/globals next-jest
```

### 2. Rodar Todos os Testes
```bash
npm test
```

### 3. Rodar em Modo Watch
```bash
npm run test:watch
```

### 4. Ver Cobertura de Código
```bash
npm run test:coverage
```

## Estrutura de Testes

### Testes de Componentes
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Componente', () => {
  test('deve renderizar', () => {
    render(<Component />);
    expect(screen.getByText('X')).toBeInTheDocument();
  });
});
```

### Testes de APIs
```javascript
import { GET, POST } from '../route';

describe('/api/endpoint', () => {
  test('deve retornar dados', async () => {
    const response = await GET(request);
    const data = await response.json();
    expect(response.status).toBe(200);
  });
});
```

### Testes de Bibliotecas
```javascript
import { funcao } from '../lib';

describe('Lib', () => {
  it('deve retornar resultado esperado', async () => {
    const resultado = await funcao(param);
    expect(resultado).toEqual(expected);
  });
});
```

## Mocks Utilizados

### PostgreSQL Pool
```javascript
jest.mock('../../app/lib/db', () => ({
  getPool: jest.fn(() => ({
    query: jest.fn(),
  })),
}));
```

### Next.js Router/Headers
```javascript
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
```

### Notifications API
```javascript
global.Notification = class Notification {
  static permission = 'granted';
  static requestPermission = jest.fn(() => Promise.resolve('granted'));
};
```

## Cobertura de Código

### Meta de Cobertura
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

### Arquivos Cobertos
- `app/components/PomodoroTimer.js`
- `app/lib/insights.js`
- `app/api/achievements/route.js`
- `app/api/insights/route.js`
- `app/api/weekly-review/route.js`

## Boas Práticas

1. **AAA Pattern:** Arrange, Act, Assert
2. **Nomes Descritivos:** `deve [fazer X] quando [condição Y]`
3. **Um Teste = Uma Coisa:** Teste unitário único
4. **Mock Isolado:** Cada teste independente
5. **Limpeza:** `beforeEach` e `afterEach`

## Exemplos de Testes

### Teste de API
```javascript
test('deve retornar lista de achievements', async () => {
  const pool = { query: jest.fn().mockResolvedValue({ rows: [...] }) };
  getPool.mockReturnValue(pool);
  
  const response = await GET(request);
  const data = await response.json();
  
  expect(response.status).toBe(200);
  expect(data.achievements).toBeDefined();
});
```

### Teste de Componente
```javascript
test('inicia timer ao clicar', () => {
  render(<PomodoroTimer />);
  fireEvent.click(screen.getByText('▶️ Iniciar'));
  expect(screen.getByText('⏸️ Pausar')).toBeInTheDocument();
});
```

### Teste de Lib
```javascript
test('deve identificar dia mais produtivo', async () => {
  const insights = await analyzeProductivityPatterns('session123');
  const dayInsight = insights.find(i => i.type === 'most_productive_day');
  expect(dayInsight).toBeDefined();
  expect(dayInsight.impact).toBe('high');
});
```

## Próximos Passos

1. Rodar todos testes: `npm test`
2. Ver cobertura: `npm run test:coverage`
3. Adicionar mais testes para:
   - APIs de tasks, quests, objectives
   - Componentes (TopNavigation, etc.)
   - Libs (notifications, weekly-review)
4. Integrar com CI/CD
5. Meta: 80%+ cobertura
