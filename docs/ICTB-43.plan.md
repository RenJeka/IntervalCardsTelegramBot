# ICTB-11: Learning Language Settings Implementation Plan

## Overview

Implement a feature allowing users to select the language they are learning. This setting will be stored in DynamoDB and managed via a new `/learning_language` command. Defaults to English.

## User Requirements

- ✅ `/learning_language` command accessible from menu
- ✅ Supported languages: 15 major languages (excluding Russian)
- ✅ Default learning language: English (`en`)
- ✅ Setting stored in DynamoDB Users table
- ✅ UI using inline keyboard for selection

---

## Proposed Changes

### 1. Database Layer

#### [MODIFY] [iDbService.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/common/interfaces/iDbService.ts)

Add methods:
- `setLearningLanguage(userId: number, language: string): Promise<DbResponse>`
- `getLearningLanguage(userId: number): Promise<string>`

#### [MODIFY] [common.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/common/interfaces/common.ts)

Add `learningLanguage?: string` field to `UserDataAWS` interface.

#### [MODIFY] [db-aws-service.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/services/db-aws-service.ts)

Implement:
- `setLearningLanguage()` - UPDATE command
- `getLearningLanguage()` - SCAN command, default to 'en'

---

### 2. Constants & Enums

#### [MODIFY] [common.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/const/common.ts)

- Define `SUPPORTED_LEARNING_LANGUAGES` array.
- Define `LEARNING_LANGUAGE_CALLBACK_PREFIX`.

#### [MODIFY] [userStatus.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/common/enums/userStatus.ts)

- Add `SET_LEARNING_LANGUAGE` status.

---

### 3. UI & Keyboards

#### [MODIFY] [keyboards.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/const/keyboards.ts)

- Create `getLearningLanguageKeyboard(lang)` function generating buttons for all supported languages.

---

### 4. Localization

#### [MODIFY] [en.json](file:///c:/GIT/IntervalCardsTelegramBot/src/locales/en.json) & [uk.json](file:///c:/GIT/IntervalCardsTelegramBot/src/locales/uk.json)

- Add `learningLanguage` section with prompts and language names.

---

### 5. Message Handling

#### [MODIFY] [message-service.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/services/message-service.ts)

- Implement `learningLanguageMessageHandler`
- Implement `setLearningLanguageHandler`
- Update `generalCallbackHandler` to route callbacks
- Update `myStatusMessageHandler` to display learning language

#### [MODIFY] [index.ts](file:///c:/GIT/IntervalCardsTelegramBot/src/index.ts)

- Register `/learning_language` command.
- Add handler for the command.

---

## Implementation Order

1. [x] Update Interfaces & Constants
2. [x] Update DB Service
3. [x] Update Keyboards & Enums
4. [x] Update Localization
5. [x] Update Message Service Logic
6. [x] Update Index & Commands
7. [x] Update Documentation

## Verification

- Manual testing of `/learning_language` flow.
- Verification of DB updates.
- Check persistence and default value.
