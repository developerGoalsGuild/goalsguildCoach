# Testes Unitários - Frontend (React)

## 🧪 Testes Criados

### Componentes Testados
- ✅ `home.test.js` - HomePage (autenticação, dashboard, logout)
- ✅ `login.test.js` - LoginPage (formulário, validação, sucesso/erro)
- ✅ `tasks.test.js` - TasksPage (listagem, filtros, navegação)
- ✅ `quests.test.js` - QuestsPage (listagem, status, navegação)
- ✅ `coach.test.js` - CoachPage (chat histórico, personas, envio)

## 🚀 Como Rodar

### 1. Instalar dependências
```bash
cd goalsguild-coach
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### 2. Configurar Jest (já no package.json)
```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"]
  }
}
```

### 3. Rodar testes
```bash
# Todos os testes
npm test

# Com coverage
npm run test:coverage

# Modo watch
npm run test:watch
```

## 📊 Estrutura dos Testes

```
__tests__/
├── mocks/
│   └── localStorage.js    # Mock do localStorage
├── frontend/
│   ├── home.test.js       # HomePage tests
│   ├── login.test.js       # LoginPage tests
│   ├── tasks.test.js       # TasksPage tests
│   ├── quests.test.js      # QuestsPage tests
│   └── coach.test.js       # CoachPage tests
├── api/                    # Backend tests (criados antes)
│   ├── auth/login.test.js
│   ├── tasks/tasks.test.js
│   ├── quests/quests.test.js
│   └── chat/chat.test.js
└── isolation/
    └── isolation.test.js    # Isolamento de dados
```

## 🧪 O que os Testes Verificam

### HomePage (`home.test.js`)
- ✅ Redirecionamento para login se não autenticado
- ✅ Mostrar dashboard se autenticado
- ✅ Mostrar nome do usuário
- ✅ Botão de logout funcional

### LoginPage (`login.test.js`)
- ✅ Renderizar formulário de login
- ✅ Validação de campos obrigatórios
- ✅ Erro com credenciais inválidas
- ✅ Sucesso com credenciais válidas
- ✅ Salvar token e user no localStorage

### TasksPage (`tasks.test.js`)
- ✅ Listar tasks do usuário
- ✅ Mostrar botão de criar task
- ✅ Filtros por status (Todas, Pendentes, Completadas)
- ✅ Botões de navegação (Coach AI, Quests, Sair)

### QuestsPage (`quests.test.js`)
- ✅ Listar quests do usuário
- ✅ Mostrar botão de criar quest
- ✅ Mostrar status das quests (Ativa, Planejada, Completa)
- ✅ Botões de navegação

### CoachPage (`coach.test.js`)
- ✅ Carregar histórico de mensagens
- ✅ Mostrar botões de mudar persona
- ✅ Input de mensagem e botão de enviar
- ✅ Mostrar nome do usuário
- ✅ Botões de navegação

## 🎯 Coverage Esperado

| Componente | Coverage |
|------------|-----------|
| HomePage | 85%+ |
| LoginPage | 90%+ |
| TasksPage | 80%+ |
| QuestsPage | 80%+ |
| CoachPage | 75%+ |

**Total Frontend: ~82% coverage**

## 🔧 Como Funciona o Mock

### Mock localStorage
```javascript
const localStorageMock = {
  getItem: (key) => store[key] || null,
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { store = {}; },
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

### Mock authHelpers
```javascript
jest.mock('../../../app/lib/auth-helpers', () => ({
  authFetch: jest.fn((url, options) => {
    // Retorna responses baseado na URL
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: 'mocked' }),
    });
  }),
}));
```

### Mock Next.js Router
```javascript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));
```

## ✅ Checklist de Testes Frontend

### Autenticação
- [x] Redirecionamento se não autenticado
- [x] Mostrar dashboard se autenticado
- [x] Logout funcional (remove token/user)

### Componentes
- [x] Login renderiza formulário
- [x] Tasks lista corretamente
- [x] Quests lista corretamente
- [x] Coach carrega histórico

### Interações
- [x] Filtros funcionam
- [x] Botões de navegação funcionam
- [x] Inputs aceitam texto
- [x] Submissões funcionam

### Mocks
- [x] localStorage mockado
- [x] authHelpers mockado
- [x] Next.js router mockado
- [x] fetch/API mockado

## 🔧 Troubleshooting

### "Cannot find module '@testing-library/react'"
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### "localStorage is not defined"
```javascript
// Adicione o mock de localStorage ANTES dos imports dos testes
require('../mocks/localStorage');
import { render } from '@testing-library/react';
```

### Mock não está funcionando
```javascript
// Verifique a ordem: jest.mock() deve vir ANTES do import
jest.mock('../../../app/lib/auth-helpers', () => ({ ... }));
import Component from '../../../app/page';
```

## 🎉 Testes Frontend 100% Completos!

**Total de testes: 25+ (frontend + backend)**

Todos os componentes principais estão testados com mocks de localStorage, authHelpers e Next.js router.
