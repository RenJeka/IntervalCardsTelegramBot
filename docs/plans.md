# ICTB-10: Internationalization (i18n) Implementation Plan

## Overview

Implement internationalization using **i18next** to support English and Ukrainian languages. Users can change language via `/language` command. Language preference is persisted in DynamoDB and takes effect immediately.

## User Requirements

- ✅ Auto-detect user's Telegram language on first interaction
- ✅ `/language` command accessible from menu
- ✅ Supported languages: English (`en`), Ukrainian (`uk`)
- ✅ Language change takes effect immediately
- ✅ Only user-facing UI text is translated (not user words/translations)
- ✅ Language preference stored in DynamoDB Users table

---

## Proposed Changes

### 1. Install Dependencies

```bash
npm install i18next
```

---

### 2. Create Translation Files

#### [NEW] [en.json](file:///c:/GIT/IntervalCardsTelegramBot/src/locales/en.json)

English translation file with all UI strings organized by namespace.

#### [NEW] [uk.json](file:///c:/GIT/IntervalCardsTelegramBot/src/locales/uk.json)

Ukrainian translation file with matching keys.

**Translation Keys Structure:**
```json
{
  "welcome": "Welcome to the IntervalCards Telegram Bot!...",
  "instruction": { "title": "...", "step1": "...", ... },
  "addWord": { "prompt": "...", "success": "...", "duplicate": "..." },
  "removeWord": { "prompt": "...", "success": "...", ... },
  "interval": { "current": "...", "set": "...", ... },
  "language": { "prompt": "...", "changed": "..." },
  "errors": { "generic": "...", "noWords": "...", ... },
  "buttons": { "showAll": "...", "addWord": "...", ... },
  ...
}
```

---

### 3. Create i18n Service

#### [NEW] [i18n.service.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/services/i18n.service.ts)

```typescript
// Responsibilities:
// - Initialize i18next with en/uk resources
// - Export t(key, lng) function for getting translations
// - Export SUPPORTED_LANGUAGES constant
// - Export detectLanguage(telegramLangCode) helper
```

---

### 4. Update Database Layer

#### [MODIFY] [iDbService.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/common/interfaces/iDbService.ts)

Add methods:
- `setUserLanguage(userId: number, language: string): Promise<DbResponse>`
- `getUserLanguage(userId: number): Promise<string | null>`

#### [MODIFY] [common.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/common/interfaces/common.ts)

Add `language?: string` field to `UserDataAWS` interface.

#### [MODIFY] [db-aws-service.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/services/db-aws-service.ts)

Implement:
- `setUserLanguage()` - UPDATE command similar to `setUserInterval()`
- `getUserLanguage()` - SCAN command similar to `getUserInterval()`
- Update `initUser()` to auto-detect and set initial language from Telegram's `language_code`

---

### 5. Add Language Command & Handler

#### [MODIFY] [index.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/index.ts)

- Add `/language` to bot commands array
- Add case handler for `/language` command

#### [MODIFY] [keyboards.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/const/keyboards.ts)

Add `LANGUAGE_KEYBOARD_OPTIONS` with inline keyboard for English/Ukrainian selection.

#### [MODIFY] [message-service.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/services/message-service.ts)

Add:
- `languageMessageHandler()` - Shows language selection keyboard
- `setLanguageHandler()` - Handles language selection callback
- Update `generalCallbackHandler()` to route language callbacks
- Add new `UserStatus.SET_LANGUAGE` handling

#### [MODIFY] [userStatus.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/common/enums/userStatus.ts)

Add `SET_LANGUAGE = 'set_language'` enum value.

---

### 6. Refactor All User-Facing Text

#### [MODIFY] [message-service.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/services/message-service.ts)

Replace all hardcoded strings with `t(key, userLanguage)` calls. Key areas:
- `startMessageHandler()` - Welcome message
- `instructionMessageHandler()` - Instruction text
- `setIntervalMessageHandler()` - Interval setting messages
- `favoriteCategoriesMessageHandler()` - Category messages
- `myStatusMessageHandler()` - Status display
- `addWordMessageHandler()` / `addParticularWordHandler()` - Add word flow
- `removeWordMessageHandler()` / `removeParticularWordHandler()` - Remove word flow
- `startLearn()` / `stopLearn()` - Learning mode messages
- `goToMainPage()` - Navigation messages
- Error messages throughout

#### [MODIFY] [keyboards.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/const/keyboards.ts)

Keyboard button text needs to be dynamic based on user language:
- Convert static keyboard objects to functions that accept `language` parameter
- `getReplyKeyboardOptions(language)`
- `getSetIntervalKeyboardOptions(language)`
- etc.

#### [MODIFY] [formatter-helper.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/helpers/formatter-helper.ts)

Update `formatUserStatusSnapshot()` to accept language parameter for translating labels.

---

### 7. Auto-Detection on First Interaction

#### [MODIFY] [message-service.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/services/message-service.ts)

In `startMessageHandler()`:
- Get `message.from.language_code` from Telegram
- Map to supported language (`uk` → `uk`, everything else → `en`)
- Pass to `initUser()` or set via `setUserLanguage()`

---

### 8. Update Documentation

#### [MODIFY] [architecture.md](file:///c:/GIT/IntervalCardsTelegramBot/docs/architecture.md)

- Add `I18nService` to the services section
- Document translation file structure (`src/locales/`)
- Update data flow diagrams to include language handling

#### [MODIFY] [architecture-rules.md](file:///c:/GIT/IntervalCardsTelegramBot/docs/architecture-rules.md)

Add i18n-related rules:
- All user-facing text must use translation keys via `t()` function
- New UI text requires entries in both `en.json` and `uk.json`
- Keyboard functions must accept `language` parameter

#### [MODIFY] [requirements.md](file:///c:/GIT/IntervalCardsTelegramBot/docs/requirements.md)

- Add ICTB-10 feature requirements
- Document supported languages (en, uk)
- Document `/language` command behavior
- Document auto-detection behavior

#### [MODIFY] [tasksTrackingSystem.md](file:///c:/GIT/IntervalCardsTelegramBot/docs/tasksTrackingSystem.md)

- Update ICTB-10 task status to "Completed" after implementation

---

## Implementation Order

1. [ ] Install i18next
2. [ ] Create translation files (`src/locales/en.json`, `src/locales/uk.json`)
3. [ ] Create `I18nService`
4. [ ] Update `UserDataAWS` interface and `IDbService`
5. [ ] Implement `setUserLanguage()` / `getUserLanguage()` in `DbAwsService`
6. [ ] Add `UserStatus.SET_LANGUAGE`
7. [ ] Add `/language` command in `index.ts`
8. [ ] Create `LANGUAGE_KEYBOARD_OPTIONS`
9. [ ] Add `languageMessageHandler()` and `setLanguageHandler()`
10. [ ] Refactor `message-service.ts` to use translations
11. [ ] Refactor keyboards to be language-aware
12. [ ] Update `formatter-helper.ts`
13. [ ] Auto-detect language in `startMessageHandler()`
14. [ ] Update documentation (`architecture.md`, `architecture-rules.md`, `requirements.md`, `tasksTrackingSystem.md`)

---

## Verification Plan

### Manual Testing

1. **New User Auto-Detection**
   - Start a new chat with the bot using a Telegram account with Ukrainian language
   - Verify welcome message appears in Ukrainian
   - Check DynamoDB Users table to confirm `language: "uk"` is stored

2. **Language Switch via /language**
   - Run `/language` command
   - Select "English" from the keyboard
   - Verify confirmation message is in English
   - Run `/instruction` and verify it's in English
   - Check DynamoDB to confirm language changed to `"en"`

3. **Persistence Verification**
   - Change language to Ukrainian
   - Restart the bot or wait
   - Send any command (e.g., `/my_status`)
   - Verify response is in Ukrainian

4. **All Commands in Both Languages**
   - Test each command in both languages:
     - `/start`, `/instruction`, `/set_interval`, `/set_favorite_categories`, `/my_status`, `/language`
     - Add word flow, remove word flow
     - Start/stop learning mode

### Build Verification

```bash
npm run build
```

Ensure no TypeScript compilation errors after refactoring.