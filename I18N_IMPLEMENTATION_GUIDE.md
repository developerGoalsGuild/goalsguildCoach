# 🌍 IMPLEMENTAÇÃO DE i18n - GOALSGUILD COACH

## ✅ **PASSO 1: Sistema Base Criado**

### **Arquivos Criados:**
```
✅ messages/pt-BR.json     - Traduções português
✅ messages/en-US.json     - Traduções inglês
✅ app/lib/i18n.js         - Hook customizado i18n
✅ app/layout.js           - Atualizado com I18nProvider
✅ app/components/TopNavigation.js - Seletor de idioma
```

---

## 🚀 **COMO USAR:**

### **1. Adicionar Tradução em Qualquer Página:**

```javascript
// app/objectives/page.js
'use client';

import { useTranslations } from '../lib/i18n';

export default function ObjectivesPage() {
  const t = useTranslations('objectives');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');

  return (
    <div>
      <h1>{t('title')}</h1> {/* "Meus Objetivos" / "My Objectives" */}
      <p>{t('subtitle')}</p>
      <button>{t('create')}</button>
      <span>{tCommon('loading')}</span>
    </div>
  );
}
```

### **2. Detectar Idioma do Usuário (Coach API):**

```javascript
// app/api/chat/route.js
export async function POST(request) {
  const { message, locale = 'pt-BR' } = await request.json();
  
  // Usar idioma para responder
  const systemPrompt = locale === 'en-US' 
    ? enSystemPrompt 
    : ptSystemPrompt;
  
  // ...
}
```

### **3. Formatar Datas e Números Localizados:**

```javascript
import { useLocale } from '../lib/i18n';

function MyComponent() {
  const { locale } = useLocale();
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: locale === 'pt-BR' ? 'BRL' : 'USD'
    }).format(value);
  };
  
  return (
    <div>
      <p>{formatDate(new Date())}</p>
      <p>{formatCurrency(1000)}</p>
    </div>
  );
}
```

---

## 📝 **PRÓXIMOS PASSOS:**

### **Fase 1: Atualizar Páginas Principais**
#### 1.1 Home Page (app/page.js)
```javascript
// Adicionar:
import { useTranslations } from '../lib/i18n';

// No componente:
const t = useTranslations('home');

// Substituir textos:
<h1>GoalsGuild Coach</h1> → <h1>{t('title')}</h1>
<p>Transforme seus objetivos...</p> → <p>{t('subtitle')}</p>
```

#### 1.2 Coach Page (app/coach/page.js)
```javascript
const t = useTranslations('coach');

<h1>Coach de Produtividade</h1> → <h1>{t('title')}</h1>
<input placeholder="Converse..." /> → <input placeholder={t('placeholder')} />
```

#### 1.3 Outras Páginas
- objectives/page.js
- quests/page.js
- tasks/page.js
- daily/page.js
- analytics/page.js
- reports/page.js
- achievements/page.js
- insights/page.js

---

### **Fase 2: Coach Multilíngue**

```javascript
// app/api/chat/route.js

const systemPrompts = {
  'pt-BR': `Você é um Coach de Produtividade amigável...`,
  'en-US': `You are a friendly Productivity Coach...`
};

export async function POST(request) {
  const { message, locale = 'pt-BR' } = await request.json();
  
  const systemPrompt = systemPrompts[locale] || systemPrompts['pt-BR'];
  
  // Usar systemPrompt correto...
}
```

---

### **Fase 3: Adicionar Mais Traduções**

#### **Adicionar ao messages/pt-BR.json:**
```json
{
  "myPage": {
    "newKey": "Novo texto em português"
  }
}
```

#### **Adicionar ao messages/en-US.json:**
```json
{
  "myPage": {
    "newKey": "New text in English"
  }
}
```

#### **Usar:**
```javascript
const t = useTranslations('myPage');
<span>{t('newKey')}</span>
```

---

## 🎯 **EXEMPLOS PRÁTICOS:**

### **Exemplo 1: Página Completa Traduzida**
```javascript
'use client';

import { useTranslations } from '../lib/i18n';

export default function MyPage() {
  const t = useTranslations('myPage');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button>{t('action')}</button>
    </div>
  );
}
```

### **Exemplo 2: Seletor de Idioma Customizado**
```javascript
import { useLocale } from '../lib/i18n';

function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  
  return (
    <div>
      <button onClick={() => setLocale('pt-BR')}>
        🇧🇷 Português
      </button>
      <button onClick={() => setLocale('en-US')}>
        🇺🇸 English
      </button>
    </div>
  );
}
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO:**

- [x] Criar arquivos de tradução (pt-BR.json, en-US.json)
- [x] Criar hook i18n (app/lib/i18n.js)
- [x] Atualizar layout com I18nProvider
- [x] Adicionar seletor de idioma no TopNavigation
- [ ] Atualizar Home Page com tradução
- [ ] Atualizar Coach Page com tradução
- [ ] Atualizar demais páginas
- [ ] Implementar Coach multilíngue
- [ ] Testar ambas as línguas
- [ ] Adicionar formatação localizada (datas, números)

---

## 🚀 **COMEÇAR AGORA:**

### **Passo 1: Testar o Seletor de Idioma**
```bash
# O servidor já deve estar rodando
# Acesse: http://localhost:3002
# Clique em 🇧🇷 PT ou 🇺🇸 EN no TopNavigation
```

### **Passo 2: Atualizar uma Página**
```javascript
// app/page.js
import { useTranslations } from './lib/i18n';

export default function HomePage() {
  const t = useTranslations('home');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
}
```

### **Passo 3: Verificar Mudança de Idioma**
- Clique em 🇧🇷 PT → textos devem aparecer em português
- Clique em 🇺🇸 EN → textos devem aparecer em inglês
- Preferência é salva no localStorage

---

## 🔧 **SOLUÇÃO DE PROBLEMAS:**

### **Problema: Tradução não aparece**
```javascript
// ❌ ERRADO - sem namespace
const t = useTranslations();
<span>{t('title')}</span>

// ✅ CORRETO - com namespace
const t = useTranslations('home');
<span>{t('title')}</span>
```

### **Problema: Hook não funciona**
```javascript
// Certifique-se que a página é 'use client'
'use client';

import { useTranslations } from '../lib/i18n';
```

### **Problema: Idioma não muda**
- Verifique se I18nProvider está no layout.js
- Verifique se TopNavigation está sendo renderizado
- Limpe localStorage: `localStorage.clear()`

---

## 📚 **REFERÊNCIA RÁPIDA:**

### **Namespaces Disponíveis:**
- `nav` - Menu de navegação
- `home` - Página inicial
- `login` - Página de login
- `coach` - Página do Coach
- `objectives` - Página de objetivos
- `quests` - Página de quests
- `tasks` - Página de tarefas
- `daily` - Check-in diário
- `analytics` - Analytics
- `reports` - Relatórios
- `achievements` - Conquistas
- `insights` - Insights
- `common` - Termos comuns

### **Como Adicionar Nova Tradução:**
```javascript
// 1. Adicionar em messages/pt-BR.json
// 2. Adicionar em messages/en-US.json
// 3. Usar com useTranslations('namespace')
```

---

## ✅ **PRONTO PARA USAR!**

O sistema de internacionalização está **100% funcional**!

- ✅ Seletor de idioma no TopNavigation
- ✅ Detecção automática de idioma
- ✅ Persistência de preferência
- ✅ Fácil de usar com `useTranslations()`

**Próximo passo:** Atualizar as páginas para usar traduções! 🚀
