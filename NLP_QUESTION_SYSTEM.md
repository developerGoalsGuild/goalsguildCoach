# 🤔 SISTEMA DE PERGUNTAS NLP - GOALSGUILD COACH

## ✅ **DATA:** 13/02/2026

---

## 🎯 **OBJETIVO:**

Se o usuário não fornecer informações NLP completas, o Coach faz perguntas guiadas para coletar as informações faltantes.

---

## 📋 **COMO FUNCIONA:**

### **Fluxo:**

```
1. Usuário manda mensagem incompleta
   ↓
2. Coach analisa e detecta critérios faltantes
   ↓
3. Coach faz pergunta específica
   ↓
4. Usuário responde
   ↓
5. Coach coleta a informação
   ↓
6. Repete até ter todos os critérios
   ↓
7. Coach mostra objetivo completo para aprovação
```

---

## 🤖 **EXEMPLO DE CONVERSA:**

### **Mensagem 1: Usuário (incompleta)**
```
"Quero aprender inglês."
```

### **Resposta 1: Coach (faz pergunta)**
```
🤔 **Deixa eu te fazer uma pergunta para entender melhor seu objetivo:**

Como você VÊ, OUVE e SENTE ao alcançar isso?

**Exemplos:**
• "Me vejo falando fluentemente com estrangeiros"
• "Sinto minha confiança aumentando"
• "Ouço-me pronunciando as palavras direito"

(Sua mensagem anterior: "Quero aprender inglês.")
```

### **Mensagem 2: Usuário**
```
"Me vejo falando com estrangeiros e me sinto confiante."
```

### **Resposta 2: Coach (próxima pergunta)**
```
🤔 **Outra pergunta:**

Por que isso é MOTIVADOR para você? O que te empolga?

**Exemplos:**
• "Me sinto livre e confiante"
• "Estou muito animado com essa conquista"
• "Isso vai mudar minha vida para melhor"
```

### **Mensagem 3: Usuário**
```
"Me sinto livre e isso vai mudar minha carreira."
```

### **Resposta 3: Coach (próxima pergunta)**
```
🤔 **Mais uma pergunta:**

QUANDO, ONDE e COM QUEM você vai fazer isso?

**Exemplos:**
• "Todos os dias às 19h, em casa, sozinho"
• "3x por semana na academia, pela manhã"
```

### **...continua até coletar todos os critérios...**

### **Resposta Final: Coach (mostra objetivo completo)**
```
🎯 **Objetivo NLP Completo Detectado!**

Detectei que você descreveu um objetivo com todos 
os critérios NLP. Aqui está o resumo:

**Título:** Aprender inglês

**Declaração:** Quero aprender inglês. Me vejo falando com 
estrangeiros e me sinto confiante. Isso vai mudar minha 
carreira.

**Critérios NLP (8/8):**
✅ Quero aprender inglês
✅ Me vejo falando com estrangeiros
✅ Me sinto confiante e livre
✅ Vai mudar minha carreira
✅ [Auto-iniciado]
✅ [Contexto]
✅ [Recursos]
✅ [Evidência]

---

**Deseja salvar este objetivo e sua memória?**
```

---

## 🔧 **CRITÉRIOS NLP E PERGUNTAS:**

### **1. Positivo (O que você QUER)**
**Pergunta:** "O que você QUER alcançar? (formule de forma positiva)"

**Exemplos:**
- Quero aprender inglês
- Pretendo me exercitar 3x por semana
- Almejo conseguir uma promoção

---

### **2. Sensório (VÊ, OUVE e SENTE)**
**Pergunta:** "Como você VÊ, OUVE e SENTE ao alcançar isso?"

**Exemplos:**
- Me vejo falando fluentemente
- Sinto minhas roupas mais folgadas
- Ouço meus colegas parabenizando

---

### **3. Motivador (O que te empolga)**
**Pergunta:** "Por que isso é MOTIVADOR para você?"

**Exemplos:**
- Me sinto livre e confiante
- Estou muito animado
- Isso vai mudar minha vida

---

### **4. Ecologia (Impacto em outras áreas)**
**Pergunta:** "Qual o IMPACTO positivo em outras áreas da sua vida?"

**Exemplos:**
- Melhorará minha carreira
- Vou ter mais energia
- Minha saúde vai melhorar

---

### **5. Auto-iniciado (Sob seu controle)**
**Pergunta:** "Isso é algo SOB SEU CONTROLE? O que você vai fazer?"

**Exemplos:**
- Vou estudar 1 hora por dia
- Estou comprometido com exercícios
- Vou dedicar tempo focado

---

### **6. Contexto (Quando, onde, com quem)**
**Pergunta:** "QUANDO, ONDE e COM QUEM você vai fazer isso?"

**Exemplos:**
- Todos os dias às 19h, em casa
- 3x por semana na academia
- Nos finais de semana no escritório

---

### **7. Recursos (O que precisa)**
**Pergunta:** "Quais RECURSOS você precisa?"

**Exemplos:**
- Preciso de 1h por dia e um aplicativo
- Vou usar livros e vídeos
- Preciso de uma academia

---

### **8. Evidência (Como saber que alcançou)**
**Pergunta:** "Como você vai SABER que alcançou? Qual a EVIDÊNCIA?"

**Exemplos:**
- Quando puder ler livro sem tradutor
- Quando minhas roupas estiverem folgadas
- Quando eu receber a promoção

---

## 🎨 **PRIORIDADE DAS PERGUNTAS:**

O Coach prioriza perguntas nesta ordem:

1. ✅ **Positivo** - O que você QUER
2. ✅ **Sensório** - VÊ, OUVE e SENTE
3. ✅ **Contexto** - Quando, onde, com quem
4. ✅ **Recursos** - O que precisa
5. ✅ **Evidência** - Como saber
6. ✅ **Motivador** - Por que é empolgante
7. ✅ **Ecologia** - Impacto em outras áreas
8. ✅ **Auto-iniciado** - Sob seu controle

---

## 📊 **PROGRESSO DE COLETA:**

### **Exemplo:**

```
📊 **Progresso do Objetivo NLP**

Critérios coletados: 3/8 (38%)

✅ Positivo: "Quero aprender inglês"
✅ Sensório: "Me vejo falando com estrangeiros"
✅ Contexto: "Todos os dias às 19h, em casa"

❌ Motivador: ?
❌ Ecologia: ?
❌ Auto-iniciado: ?
❌ Recursos: ?
❌ Evidência: ?

🤔 **Próxima pergunta:** Por que isso é MOTIVADOR para você?
```

---

## 🚀 **INTEGRAÇÃO:**

### **No Coach API:**

```javascript
import nlpQuestionSystem from '../../lib/nlp-question-system';
import { shouldAskNLPQuestions } from '../../lib/nlp-question-system';

// Analisar mensagem do usuário
const shouldAsk = shouldAskNLPQuestions(message, history);

if (shouldAsk.shouldAsk) {
  // Iniciar sessão de perguntas
  nlpQuestionSystem.startSession(sessionId, message);

  // Gerar primeira pergunta
  const nextQuestion = nlpQuestionSystem.getNextQuestion(
    sessionId, 
    message
  );

  const questionMessage = generateNLPQuestionMessage(
    nextQuestion, 
    message
  );

  return NextResponse.json({ message: questionMessage });
}

// Se já tem sessão ativa
if (nlpQuestionSystem.hasActiveSession(sessionId)) {
  // Coletar resposta
  const currentQuestion = nlpQuestionSystem.getCurrentQuestion(sessionId);

  if (isAnsweringNLPQuestion(message, currentQuestion)) {
    nlpQuestionSystem.addAnswer(sessionId, currentQuestion.criteria, message);
  }

  // Verificar se completou
  if (nlpQuestionSystem.isComplete(sessionId)) {
    // Construir objetivo NLP completo
    const objective = nlpQuestionSystem.buildObjective(sessionId);

    // Mostrar para aprovação
    const approvalMessage = generateNLPApprovalMessage(objective);

    nlpQuestionSystem.endSession(sessionId);

    return NextResponse.json({ message: approvalMessage });
  }

  // Gerar próxima pergunta
  const nextQuestion = nlpQuestionSystem.getNextQuestion(sessionId, message);
  const questionMessage = generateNLPQuestionMessage(nextQuestion, message);

  return NextResponse.json({ message: questionMessage });
}
```

---

## 🦅 **Jarbas:**

> **"Sistema de perguntas criado!"** 🤔
>
> **O que faz:**
> - ✅ Detecta informações faltantes
> - ✅ Faz perguntas específicas
> - ✅ Coleta respostas do usuário
> - ✅ Constrói objetivo NLP completo
>
> **Como funciona:**
> 1. Analisa mensagem incompleta
> 2. Faz pergunta específica
> 3. Coleta resposta
> 4. Repete até completar
> 5. Mostra objetivo para aprovação
>
> **Resultado:**
> - ✅ Objetivos NLP mais completos
> - ✅ Melhor qualidade dos objetivos
> - ✅ Experiência conversacional
>
> **Próximo:** Integrar no Coach! 🚀

---

## 📝 **ARQUIVO CRIADO:**

✅ `app/lib/nlp-question-system.js` - Sistema de perguntas NLP

**Funcionalidades:**
- `analyzeNLPQuestions()` - Analisa critérios encontrados/faltantes
- `generateNextQuestion()` - Gera próxima pergunta
- `shouldAskNLPQuestions()` - Verifica se deve fazer perguntas
- `generateNLPQuestionMessage()` - Gera mensagem de pergunta
- `NLPQuestionSystem` - Classe para gerenciar sessão de perguntas

---

**Status:** ✅ SISTEMA DE PERGUNTAS NLP CRIADO

**Próximo passo:** Integrar no Coach API! 🚀
