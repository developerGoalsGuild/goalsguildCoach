# Guia de Debugging e Melhorias de Testes

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Cannot find module 'jest'"
```bash
# SOLUÇÃO: Instalar Jest localmente (não global)
cd goalsguild-coach
npm install --save-dev jest @types/jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# Verificar instalação
npm list jest
```

### Problema 2: "ReferenceError: fetch is not defined"
```bash
# SOLUÇÃO: Adicionar polyfill de fetch
npm install --save-dev whatwg-fetch

# Ou usar node-fetch
npm install --save-dev node-fetch
```

Adicione ao `jest.setup.js`:
```javascript
// Polyfill fetch
global.fetch = require('node-fetch');
```

### Problema 3: "SyntaxError: Unexpected token '<'"
```bash
# SOLUÇÃO: Configurar transform para JSX
npm install --save-dev @babel/preset-react @babel/preset-env

# Adicionar ao jest.config.js:
module.exports = {
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
```

---

## 🔧 Melhorias Imediatas

### 1. Criar jest.config.js

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  testMatch: ['**/__tests__/**/*.{js,jsx}'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx}',
    '!app/**/*.test.js',
    '!app/**/__tests__/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

### 2. Atualizar jest.setup.js

```javascript
// jest.setup.js
import '@testing-library/jest-dom'

// Mock fetch
global.fetch = require('node-fetch');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return [] }
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Suppress console durante testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.OPENAI_API_KEY = 'test-key';
```

### 3. Simplificar Testes Inicialmente

Comece com um teste SIMPLES:

```javascript
// __tests__/simple.test.js
describe('Teste Simples', () => {
  test('deve somar 2 + 2', () => {
    expect(2 + 2).toBe(4);
  });

  test('deve verificar verdadeiro', () => {
    expect(true).toBe(true);
  });
});
```

Rode: `npm test`

Se isso funcionar, o Jest está configurado. Depois adicione os testes complexos.

---

## 🎯 Estratégia Alternativa: Testar Manualmente

Se Jest estiver com problemas, use este checklist manual:

### Backend API Testing (Manual)

```bash
# 1. Testar health
curl http://localhost:3002

# 2. Testar login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# 3. Testar sem token (deve falhar)
curl http://localhost:3002/api/tasks

# 4. Testar com token
curl http://localhost:3002/api/tasks \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Frontend Manual (Browser)

1. Acesse http://localhost:3002
2. Deve redirecionar para /login
3. Faça login
4. Verifique se funciona
5. Abra DevTools → Console
6. Veja se há erros

---

## 📦 Versão Simplificada dos Testes

### Testes Mínimos Viables

Crie apenas 3 testes essenciais:

```javascript
// __tests__/essential.test.js

// Teste 1: Soma simples (verifica Jest funciona)
test('Jest funciona', () => {
  expect(1 + 1).toBe(2);
});

// Teste 2: Import de módulos funciona
test('Módulos importam', async () => {
  const { verifyJWT } = require('../app/lib/auth');
  expect(typeof verifyJWT).toBe('function');
});

// Teste 3: Database mock funciona
test('Mock database funciona', () => {
  const mockDb = require('../__tests__/mocks/mockDb');
  const user = mockDb.createUser({
    email: 'test@test.com',
    password_hash: 'hash',
    name: 'Test',
  });
  expect(user.email).toBe('test@test.com');
});
```

---

## 🔍 Debug Mode

### Rodar com Debug
```bash
# Verbose
npm test -- --verbose

# Com debug
node --inspect-brk node_modules/.bin/jest --runInBand

# Apenas um teste
npm test -- --testNamePattern="deve somar"
```

### Console.log durante testes
```javascript
test('com debug', () => {
  const result = complexFunction();
  console.log('Resultado:', result); // Vai aparecer
  expect(result).toBe('expected');
});
```

---

## 📋 Checklist de Verificação

Antes de tentar rodar testes, verifique:

### Environment
- [ ] Node.js instalado (`node --version`)
- [ ] NPM instalado (`npm --version`)
- [ ] Projeto clonado/existente

### Dependências
- [ ] `cd goalsguild-coach`
- [ ] `npm install` (dependências principais)
- [ ] `npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom`

### Config
- [ ] `jest.config.js` existe
- [ ] `jest.setup.js` existe
- [ ] `package.json` tem script `"test": "jest"`

### Run
- [ ] `npm test` funciona
- [ ] Sem erros de módulos não encontrados

---

## 💡 Sugestões de Melhorias no Código

### 1. Adicionar Error Boundaries

```javascript
// app/components/ErrorBoundary.js
'use client';
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Algo deu errado.</div>;
    }
    return this.props.children;
  }
}
```

### 2. Adicionar Logging

```javascript
// app/lib/logger.js
export const logger = {
  info: (msg) => console.log('[INFO]', msg),
  error: (msg) => console.error('[ERROR]', msg),
  debug: (msg) => {
    if (process.env.DEBUG === 'true') {
      console.log('[DEBUG]', msg);
    }
  },
};
```

### 3. Adicionar Validation

```javascript
// app/lib/validation.js
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 6;
}
```

---

## 🎯 Próximos Passos Recomendados

### Se Jest NÃO Funciona:

1. **Use testes manuais via curl** (mais rápido)
2. **Teste no browser** (mais visual)
3. **Adicione logs no código** (debug simples)
4. **Use Postman/Insomnia** para testar APIs

### Se Jest Funciona:

1. **Comece com testes simples** (verifica config)
2. **Adicione um teste por vez** (isolado)
3. **Rodar com `npm test -- --testNamePattern`** (específico)
4. **Adicione mais gradualmente**

---

## 📞 Se Ainda Não Funcionar

### Informações que preciso:

1. **Erro exato** (copie e cole)
2. **Versão do Node** (`node --version`)
3. **Versão do NPM** (`npm --version`)
4. **SO** (Windows, Mac, Linux?)

### Com essas infos posso:

- Configurar Jest adequadamente
- Ajustar testes para seu ambiente
- Fornecer solução específica

---

**🔧 Melhorias implementadas, debug habilitado!**

Me diga qual erro aparece e ajusto para você!
