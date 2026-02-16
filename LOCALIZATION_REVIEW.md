# Localization Review

## Summary

Localization has been reviewed and improved across **screens**, **coach API responses**, and **personalities**.

---

## ✅ What Was Done

### 1. Coach & API (locale-aware)

- **CoachClient** sends `locale` in every chat request: `body: JSON.stringify({ message: userMessage, locale })`.
- **`/api/chat`** reads `locale` (default `pt-BR`) and uses it for:
  - **Moderation** block message (PT/EN).
  - **Objective saved** (with/without quest) messages.
  - **Objective rejected** message.
  - **Quest created** / **Quest error** messages.
  - **Fallback** (no OpenAI): greeting, thanks, help, default — all localized.
- **`app/lib/openai.js`**:
  - `getSystemPrompt(persona, locale)` — adds **LANGUAGE** instruction: respond in Portuguese (pt-BR) or English (en-US) according to `locale`.
  - `getCoachResponse(messages, persona, locale)` — passes `locale` to the system prompt and localizes the “no active quest” context string.
  - API key error message is localized.

### 2. Personas (Coach personality UI)

- **`app/lib/personas.js`**:
  - `getPersonaDisplayName(preset, locale)` — returns `nameEn` for en-US, `name` for pt-BR.
  - `getPersonaDisplayDescription(preset, locale)` — same for description.
- **CoachClient**:
  - Uses these helpers for header title/description, message labels, preset dropdown, and selected preset card.
  - Welcome messages were already localized via `getWelcomeMessage(theme, locale)`.

### 3. Login page

- Uses `useTranslations('login')` and `useTranslations('home')`.
- All user-facing strings come from `messages/pt-BR.json` and `messages/en-US.json`.
- New keys: `subtitle`, `entering`, `createAccount`, `forgotPassword`, `recover`, `authFailed`, `networkError`, `testUserLabel`.

### 4. Tasks page toast

- Fixed use of toast: `const { success: showSuccess, ToastComponent } = useToast();` so “+X XP” toasts work (same pattern as quest detail page).

---

## 📋 Screens Already Using i18n

| Screen        | Namespace(s)     | Notes                          |
|---------------|------------------|--------------------------------|
| Home          | `home`, `nav`    | Full                           |
| Login         | `login`, `home`  | Full (updated in this pass)   |
| Coach         | `coach`, `common`| UI + locale sent to API        |
| Objectives    | `objectives`, `common` | Full + `useLocale()`     |
| Quests list   | `quests`, `common`    | Full                    |
| Quest detail  | `quests`, `common`    | Full + toast fix         |
| Quest new     | `quests`, `common`    | Full                    |
| Tasks list    | `tasks`, `common`      | Full + toast fix         |
| Task edit     | `tasks`, `common`      | Full                    |
| Daily check-in| `daily`               | Full                    |
| Analytics     | `analytics`, `common`  | Full                    |

---

## 📁 Message Files

- **`messages/pt-BR.json`** — Portuguese (Brazil).
- **`messages/en-US.json`** — English (US).
- Namespaces: `nav`, `home`, `login`, `coach`, `objectives`, `quests`, `tasks`, `daily`, `analytics`, `reports`, `achievements`, `insights`, `common`.

---

## 🔤 Optional Next Steps

- **Achievements, Insights, Reports, Reminders, NLP-goal** — If any UI text is still hardcoded, add `useTranslations(<namespace>)` and move strings into the message files.
- **NLP LLM / objective flow** — If the NLP question system has fixed PT-only prompts, consider passing `locale` and adding EN prompts (similar to chat fallback).
- **Date/number formatting** — Use `useLocale()` and `Intl` (e.g. `toLocaleDateString(locale)`) where dates/numbers are shown.

---

## How to Test

1. Switch language in TopNavigation (🇧🇷 PT / 🇺🇸 EN).
2. **Login**: labels, errors, links should follow the selected language.
3. **Coach**: send a message; the assistant reply should be in the selected language. Change personality — name and description should follow locale. Fallback (no OpenAI) responses should be in the selected language.
4. **Objectives / Quests / Tasks / Daily / Analytics**: all use existing namespaces; changing language should update labels and copy.
