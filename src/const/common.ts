import { SupportedLanguage } from "../services/i18n.service";

/**
 * @description separator, when user add item and separate word and translation e.t.c.
 * @example  'word1<separator>translation1'
 */
export const ADD_USER_ITEM_SEPARATOR = '/';

/**
 * How frequency bot should sends a message in development mode
 */
export const DEVELOPER_MODE_BOT_SENDS_MESSAGE_SEC = 5;

export const DEFAULT_USER_INTERVAL = 1;

export const LOG_MAX_DEPTH = 3;

export const SUPPORTED_LANGUAGES = ['en', 'uk'] as const;

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Callback prefixes for inline keyboard
export const LANGUAGE_CALLBACK_PREFIX = 'lang_';
export const LEARNING_LANGUAGE_CALLBACK_PREFIX = 'le_lang_';
export const FAVORITE_CATEGORY_CALLBACK_PREFIX = 'favorite_category:';

export const SUPPORTED_LEARNING_LANGUAGES = [
    'en', // English
    'uk', // Ukrainian
    'pl', // Polish
    'de', // German
    'fr', // French
    'es', // Spanish
    'it', // Italian
    'pt', // Portuguese
    'nl', // Dutch
    'tr', // Turkish
    'zh', // Chinese
    'ja', // Japanese
    'ko', // Korean
    'ar', // Arabic
    'hi'  // Hindi
] as const;

// LLM Configuration
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_LLM_MODEL = 'openai/gpt-5-nano';
export const DEFAULT_LLM_TEMPERATURE = 0.7;
export const DEFAULT_LLM_MAX_TOKENS = 500;
export const DEFAULT_WORDS_PER_SET = 10;

// Cache configuration
export const LLM_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours