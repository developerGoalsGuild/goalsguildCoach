# Internacionalização (i18n) - GoalsGuild Coach

## 📋 **Sistema de Globalização**

### **Idiomas Suportados:**
- 🇧🇷 **Português (pt-BR)** - Idioma padrão
- 🇺🇸 **Inglês (en-US)** - Novo idioma

---

## 🎯 **Funcionalidades:**

### **1. Detecção Automática de Idioma**
- Detecta idioma do navegador
- Permite seleção manual do usuário
- Armazena preferência em cookies

### **2. Interface Traduzida**
- Todas as 11 páginas traduzidas
- Componentes (TopNavigation, botões, etc.)
- Mensagens de erro e validação

### **3. Coach Multilíngue**
- Responde no idioma do usuário
- Mantém contexto da conversa
- Tradução automática de mensagens

### **4. Formatação Localizada**
- Datas (DD/MM/YYYY vs MM/DD/YYYY)
- Números (1.000,00 vs 1,000.00)
- Moeda (R$ vs $)

---

## 📁 **Estrutura de Arquivos:**

```
goalsguild-coach/
├── app/
│   ├── [locale]/              # Novo: rotas com locale
│   │   ├── page.js            # Home
│   │   ├── login/
│   │   ├── coach/
│   │   ├── objectives/
│   │   ├── quests/
│   │   ├── tasks/
│   │   ├── daily/
│   │   ├── analytics/
│   │   ├── reports/
│   │   ├── achievements/
│   │   └── insights/
│   ├── i18n/
│   │   ├── pt-BR.json         # Traduções PT-BR
│   │   ├── en-US.json         # Traduções EN-US
│   │   └── index.js           # Configuração i18n
│   └── lib/
│       └── i18n.js            # Funções i18n
├── middleware.js              # Detecção de idioma
└── messages/
    ├── pt-BR.js               # Mensagens Coach PT-BR
    └── en-US.js               # Mensagens Coach EN-US
```

---

## 🚀 **Plano de Implementação:**

### **Fase 1: Configuração Base**
- Instalar next-intl
- Criar arquivos de tradução
- Configurar middleware

### **Fase 2: Migrar Páginas**
- Mover páginas para [locale]
- Adicionar tradução de textos
- Atualizar navegação

### **Fase 3: Coach Multilíngue**
- Atualizar API do chat
- Traduzir respostas do Coach
- Detectar idioma da mensagem

### **Fase 4: Testes**
- Testar ambas as línguas
- Verificar formatação
- Testar mudança de idioma

---

## 📝 **Arquivos de Tradução:**

### **pt-BR.json**
```json
{
  "nav": {
    "home": "Início",
    "objectives": "Objetivos",
    "quests": "Quests",
    "tasks": "Tarefas",
    "daily": "Check-in Diário",
    "analytics": "Analytics",
    "reports": "Relatórios",
    "achievements": "Conquistas",
    "insights": "Insights",
    "coach": "Coach"
  },
  "home": {
    "title": "GoalsGuild Coach",
    "subtitle": "Transforme seus objetivos em realidade",
    "cta": "Começar Agora"
  },
  "coach": {
    "title": "Coach de Produtividade",
    "placeholder": "Converse com seu coach...",
    "send": "Enviar"
  }
}
```

### **en-US.json**
```json
{
  "nav": {
    "home": "Home",
    "objectives": "Objectives",
    "quests": "Quests",
    "tasks": "Tasks",
    "daily": "Daily Check-in",
    "analytics": "Analytics",
    "reports": "Reports",
    "achievements": "Achievements",
    "insights": "Insights",
    "coach": "Coach"
  },
  "home": {
    "title": "GoalsGuild Coach",
    "subtitle": "Transform your goals into reality",
    "cta": "Get Started"
  },
  "coach": {
    "title": "Productivity Coach",
    "placeholder": "Chat with your coach...",
    "send": "Send"
  }
}
```

---

## 🔧 **Implementação Técnica:**

### **Middleware (middleware.js)**
```javascript
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['pt-BR', 'en-US'],
  defaultLocale: 'pt-BR',
  localePrefix: 'as-needed'
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

### **Uso nas Páginas**
```javascript
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <button>{t('cta')}</button>
    </div>
  );
}
```

### **Coach Multilíngue**
```javascript
// Detectar idioma do usuário e responder na língua dele
const systemPrompt = locale === 'pt-BR' 
  ? ptBRSystemPrompt 
  : enUSSystemPrompt;
```

---

## ✅ **Benefícios:**

- ✅ Expansão global do produto
- ✅ Melhor experiência para usuários internacionais
- ✅ Fácil adicionar mais idiomas (es, fr, de...)
- ✅ SEO multilíngue
- ✅ Acessibilidade

---

**Próximo passo:** Implementar o sistema! 🚀
