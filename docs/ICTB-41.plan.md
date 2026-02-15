# ICTB-41: Preset Words Set via LLM (`/add_words_set`)

## Status

`TODO`

## Goal

Implement a new menu command `/add_words_set` that adds a preset set of words to the user dictionary with LLM help.

Core behavior:
- Generate and add `50` words per run.
- Ask for confirmation before generation (`YES` / `NO (Cancel)` inline buttons).
- Reuse confirmation logic as a generic module for other future actions.
- If user runs command again, add another set (not replace old words).
- Word language = user learning language.
- Translation language = user interface language.

## Context Used from ICTB-39

- Use existing LLM integration (`LLMService`, `LLMHelper`, prompts, error handling).
- Keep architecture split:
  - low-level API calls in `src/services/llm.service.ts`
  - high-level generation/business logic in `src/helpers/llm-helper.ts`
- Keep JSON-only response contract and strict parsing/validation.

## Functional Requirements

1. Command `/add_words_set` is available in bot menu and command routing.
2. Bot asks for confirmation before generation:
   - `YES` starts generation and adding words.
   - `NO (Cancel)` aborts and returns to default flow.
3. Preset set size is controlled by constant in `src/const/common.ts`:
   - `PRESET_WORDS_SET_COUNT = 50`
4. Words are generated with LLM considering:
   - user favorite categories
   - learning language (word)
   - UI language (translation)
5. If favorite categories are empty:
   - use random categories from available category list.
6. Add only unique words to dictionary.
7. LLM should be called repeatedly to fill missing count:
   - target remaining count: `50 - addedUniqueCount`
8. Re-running `/add_words_set` adds additional words.

## Non-Functional Requirements

- Reusable confirmation module (not tied to words only).
- Safe termination logic for repeated LLM calls (max attempts) to avoid infinite loop / excessive API usage.
- Clear user-facing success and partial-result messaging.
- Keep localization support (`en`, `uk`).

## Planned Changes

### 1) Constants and Callback Prefixes

**Files**:
- `src/const/common.ts`

**Changes**:
- Add `PRESET_WORDS_SET_COUNT = 50`.
- Add callback prefix(es) for generic confirmation module, e.g.:
  - `CONFIRM_ACTION_CALLBACK_PREFIX`
  - or split into `CONFIRM_YES_CALLBACK_PREFIX` / `CONFIRM_NO_CALLBACK_PREFIX`
- Add generation guard constants:
  - `PRESET_WORDS_MAX_GENERATION_ATTEMPTS` (example: `5`)
  - `PRESET_WORDS_LLM_BATCH_SIZE` (optional, if needed for chunking).

### 2) Generic Confirmation Module (Reusable)

**Files**:
- `src/const/keyboards.ts`
- `src/common/enums/userStatus.ts`
- `src/services/message-service.ts`
- (optional) `src/common/interfaces/common.ts` for confirm payload typing

**Changes**:
- Add a reusable inline keyboard builder for confirmations:
  - `getConfirmActionKeyboard(actionKey: string, lang: SupportedLanguage)`
- Add neutral callback payload contract that carries an action key.
- Add/extend status for waiting confirmation (e.g. `CONFIRM_ACTION`) or implement status-agnostic callback handling by prefix.
- Add generic handler(s):
  - `requestActionConfirmation(...)`
  - `handleConfirmActionCallback(...)`
- Ensure this logic is not coupled to `/add_words_set` only.

### 3) `/add_words_set` Command Wiring

**Files**:
- `src/services/bot-init.service.ts`
- `src/index.ts`
- `src/services/message-service.ts`

**Changes**:
- Add `add_words_set` into command keys for menu registration.
- Route `/add_words_set` in `index.ts` command switch.
- Add `addWordsSetMessageHandler(...)` in `MessageService`:
  - sets required status/context
  - sends confirmation message with generic module.

### 4) LLM Generation Logic for Unique Additions

**Files**:
- `src/helpers/llm-helper.ts`
- `src/const/prompts.ts`
- `src/common/interfaces/llm.ts` (if new params are introduced)

**Changes**:
- Extend generation API to support excluded words and iterative fill:
  - input: `excludedWords`, `count`, categories, learning/native language
  - output: validated unique pairs
- Update prompt generation:
  - include instruction to avoid words already in dictionary
  - include strict JSON output format
- Add helper flow:
  - normalize/dedupe candidates (`trim`, lower-case key for uniqueness check)
  - call LLM again for remaining count (`remaining = 50 - addedUnique`)
  - stop on success or max attempts.

### 5) Add-Words-Set Business Flow

**Files**:
- `src/services/message-service.ts`
- `src/services/db-aws-service.ts` (only if batch insert helper is added)
- `src/common/interfaces/iDbService.ts` (only if new DB method is added)

**Changes**:
- On confirmation `YES`:
  - load user dictionary (for exclusions)
  - load user favorite categories
  - if favorites empty: select random categories
  - load learning language and UI language
  - generate words via updated `LLMHelper`
  - write only unique words (current dictionary + newly added in same run)
- On confirmation `NO`:
  - cancel action, reset to default status, send cancel message
- Send final summary:
  - requested count (50)
  - actually added count
  - optional note if less than target due to retries/duplicates.

### 6) Localization Updates

**Files**:
- `src/locales/en.json`
- `src/locales/uk.json`

**Changes**:
- Add command description:
  - `commands.add_words_set`
- Add new text keys for:
  - confirmation title/description
  - YES/NO labels (or reuse common button keys where possible)
  - generation started/progress/complete
  - cancellation
  - partial result / error.

### 7) Manual Verification Plan

1. `/add_words_set` appears in bot command menu (both languages).
2. Command sends confirmation with inline `YES` and `NO`.
3. `NO` cancels and does not add words.
4. `YES` adds up to `50` words with:
   - word in learning language
   - translation in UI language.
5. Re-run command adds additional words (dictionary grows).
6. For user with existing words:
   - duplicates are not inserted.
7. For user with no favorite categories:
   - random categories fallback works.
8. LLM failure/timeout path returns localized error and does not break bot state.

## Risks and Mitigations

- **Risk**: LLM returns duplicates or invalid JSON.  
  **Mitigation**: strict parser + validation + retry for remaining count.

- **Risk**: Repeated retries increase API usage.  
  **Mitigation**: hard cap with `PRESET_WORDS_MAX_GENERATION_ATTEMPTS`.

- **Risk**: Confirmation flow becomes tightly coupled to one feature.  
  **Mitigation**: action-key based generic callback contract.

## Execution Checklist

- [ ] Add constants and callback prefixes.
- [ ] Implement reusable confirmation module.
- [ ] Wire `/add_words_set` into bot commands and routing.
- [ ] Extend LLM helper for exclusions + refill-by-remaining.
- [ ] Implement preset words add flow in message service.
- [ ] Add localization keys (`en`, `uk`).
- [ ] Perform manual verification scenarios.

