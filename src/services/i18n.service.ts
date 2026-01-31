import i18next, { TFunction } from 'i18next';
import en from '../locales/en.json';
import uk from '../locales/uk.json';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../const/common';

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];


/**
 * Initialize i18next with English and Ukrainian translations
 */
i18next.init({
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    debug: false,
    resources: {
        en: { translation: en },
        uk: { translation: uk }
    },
    interpolation: {
        escapeValue: false // Telegram handles escaping
    }
});

/**
 * Get translation for a key in the specified language
 * @param key Translation key (e.g., 'welcome', 'buttons.addWord')
 * @param lng Language code ('en' or 'uk')
 * @param options Interpolation options (e.g., { word: 'hello' })
 */
export function t(key: string, lng: SupportedLanguage = DEFAULT_LANGUAGE, options?: Record<string, unknown>): string {
    return i18next.t(key, { lng, ...options });
}

/**
 * Detect supported language from Telegram's language_code
 * Maps 'uk' to 'uk', everything else defaults to 'en'
 * @param telegramLangCode Telegram user's language_code (e.g., 'en', 'uk', 'ru')
 */
export function detectLanguage(telegramLangCode?: string): SupportedLanguage {
    if (!telegramLangCode) {
        return DEFAULT_LANGUAGE;
    }

    // Normalize and check if it's a supported language
    const normalizedCode = telegramLangCode.toLowerCase().split('-')[0]; // Handle 'en-US' -> 'en'

    if (SUPPORTED_LANGUAGES.includes(normalizedCode as SupportedLanguage)) {
        return normalizedCode as SupportedLanguage;
    }

    return DEFAULT_LANGUAGE;
}

/**
 * Get display name for a language code
 */
export function getLanguageDisplayName(lng: SupportedLanguage): string {
    switch (lng) {
        case 'uk':
            return 'Українська';
        case 'en':
        default:
            return 'English';
    }
}

export { i18next };
