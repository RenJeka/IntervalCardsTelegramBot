import { InlineKeyboardButton, SendMessageOptions } from "node-telegram-bot-api";
import { UserItemAWS } from "../common/interfaces/common";
import { FAVORITE_CATEGORIES, FAVORITE_CATEGORY_CALLBACK_PREFIX } from "./favoriteCategories";
import { t } from "../services/i18n.service";
import { LANGUAGE_CALLBACK_PREFIX } from "../const/common";
import { SupportedLanguage } from "../common/interfaces/common";

export function getReplyKeyboardOptions(lang: SupportedLanguage): SendMessageOptions {
    return {
        reply_markup: {
            keyboard: [
                [{ text: t('buttons.showAll', lang) }],
                [{ text: t('buttons.addWord', lang) }, { text: t('buttons.removeWord', lang) }],
                [{ text: t('buttons.startLearn', lang) }, { text: t('buttons.stopLearn', lang) }],
            ],
            resize_keyboard: true
        }
    };
}

export function getSetIntervalKeyboardOptions(lang: SupportedLanguage): SendMessageOptions {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: t('interval.everyHour', lang), callback_data: '1' }],
                [{ text: t('interval.everyPHours', lang, { n: 2 }), callback_data: '2' }],
                [{ text: t('interval.everyPHours', lang, { n: 3 }), callback_data: '3' }],
                [{ text: t('interval.everyPHours', lang, { n: 4 }), callback_data: '4' }],
                [{ text: t('interval.everyNHours', lang, { n: 5 }), callback_data: '5' }],
                [{ text: t('interval.everyNHours', lang, { n: 6 }), callback_data: '6' }],
                [{ text: t('interval.everyNHours', lang, { n: 7 }), callback_data: '7' }],
                [{ text: t('interval.everyNHours', lang, { n: 8 }), callback_data: '8' }],
                [{ text: t('interval.everyNHours', lang, { n: 9 }), callback_data: '9' }],
                [{ text: t('interval.everyNHours', lang, { n: 10 }), callback_data: '10' }],
                [{ text: t('interval.everyNHours', lang, { n: 11 }), callback_data: '11' }],
                [{ text: t('interval.everyNHours', lang, { n: 12 }), callback_data: '12' }]
            ],
            resize_keyboard: true
        }
    };
}

export function getAddWordKeyboardOptions(lang: SupportedLanguage): SendMessageOptions {
    return {
        reply_markup: {
            keyboard: [
                [{ text: t('buttons.showAll', lang) }],
                [{ text: t('buttons.finishAdding', lang) }, { text: t('buttons.cancel', lang) }],
            ],
            resize_keyboard: true
        },
        parse_mode: 'HTML'
    };
}

export function getRemoveWordKeyboardOptions(lang: SupportedLanguage): SendMessageOptions {
    return {
        reply_markup: {
            keyboard: [
                [{ text: t('buttons.showAll', lang) }],
                [{ text: t('buttons.finishRemoving', lang) }, { text: t('buttons.cancel', lang) }],
            ],
            resize_keyboard: true
        }
    };
}

export function getStartLearnKeyboardOptions(lang: SupportedLanguage): SendMessageOptions {
    return {
        reply_markup: {
            keyboard: [
                [{ text: t('buttons.stopLearn', lang) }],
            ],
            resize_keyboard: true
        }
    };
}


export function getRemoveWordsKeyboard(userDictionary: UserItemAWS[]): SendMessageOptions {
    const keyboard: InlineKeyboardButton[][] = userDictionary.map((userWord: UserItemAWS) => {
        return [{ text: userWord.word, callback_data: userWord._id.toString() }]
    })

    return {
        reply_markup: {
            inline_keyboard: keyboard,
            resize_keyboard: true
        }
    }
}

export function getFavoriteCategoriesKeyboard(selectedCategories: string[], lang: SupportedLanguage): SendMessageOptions {
    const keyboard: InlineKeyboardButton[][] = [];

    // TODO: refactor (extract to separate helper or FavoriteCategoriesService)
    for (let index = 0; index < FAVORITE_CATEGORIES.length; index += 2) {
        const firstCategory = FAVORITE_CATEGORIES[index];
        const secondCategory = FAVORITE_CATEGORIES[index + 1];
        const row: InlineKeyboardButton[] = [];

        if (firstCategory) {
            row.push({
                text: selectedCategories.includes(firstCategory)
                    ? `✅ ${t(`categories.${firstCategory}`, lang)}`
                    : t(`categories.${firstCategory}`, lang),
                callback_data: `${FAVORITE_CATEGORY_CALLBACK_PREFIX}${index}`
            });
        }

        if (secondCategory) {
            row.push({
                text: selectedCategories.includes(secondCategory)
                    ? `✅ ${t(`categories.${secondCategory}`, lang)}`
                    : t(`categories.${secondCategory}`, lang),
                callback_data: `${FAVORITE_CATEGORY_CALLBACK_PREFIX}${index + 1}`
            });
        }

        keyboard.push(row);
    }

    return {
        reply_markup: {
            inline_keyboard: keyboard,
            resize_keyboard: true
        }
    };
}

export const LANGUAGE_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        inline_keyboard: [
            [{ text: t('language.english', 'en'), callback_data: `${LANGUAGE_CALLBACK_PREFIX}en` }],
            [{ text: t('language.ukrainian', 'uk'), callback_data: `${LANGUAGE_CALLBACK_PREFIX}uk` }]
        ],
        resize_keyboard: true
    }
};
