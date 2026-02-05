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
export const FAVORITE_CATEGORY_CALLBACK_PREFIX = 'favorite_category:';