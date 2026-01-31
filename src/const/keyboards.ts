import { InlineKeyboardButton, SendMessageOptions } from "node-telegram-bot-api";
import {
    AddingWordsReplyKeyboardData,
    MainReplyKeyboardData,
    RemovingWordsReplyKeyboardData, StartLearningReplyKeyboardData
} from "../common/enums/mainInlineKeyboard";
import { UserItemAWS } from "../common/interfaces/common";
import { FAVORITE_CATEGORIES, FAVORITE_CATEGORY_CALLBACK_PREFIX } from "./favoriteCategories";

export const REPLY_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        keyboard: [
            [{ text: MainReplyKeyboardData.SHOW_ALL }],
            [{ text: MainReplyKeyboardData.ADD_WORD }, { text: MainReplyKeyboardData.REMOVE_WORD }],
            [{ text: MainReplyKeyboardData.START_LEARN }, { text: MainReplyKeyboardData.STOP_LEARN }],
        ]
    }
}

export const SET_INTERVAL_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        inline_keyboard: [
            [{ text: 'Every hour', callback_data: '1' }],
            [{ text: 'Every 2 hours', callback_data: '2' }],
            [{ text: 'Every 3 hours', callback_data: '3' }],
            [{ text: 'Every 4 hours', callback_data: '4' }],
            [{ text: 'Every 5 hours', callback_data: '5' }],
            [{ text: 'Every 6 hours', callback_data: '6' }],
            [{ text: 'Every 7 hours', callback_data: '7' }],
            [{ text: 'Every 8 hours', callback_data: '8' }],
            [{ text: 'Every 9 hours', callback_data: '9' }],
            [{ text: 'Every 10 hours', callback_data: '10' }],
            [{ text: 'Every 11 hours', callback_data: '11' }],
            [{ text: 'Every 12 hours', callback_data: '12' }]
        ],
        resize_keyboard: true
    }
}

export const ADD_WORD_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        keyboard: [
            [{ text: AddingWordsReplyKeyboardData.SHOW_ALL }],
            [{ text: AddingWordsReplyKeyboardData.FINISH }, { text: AddingWordsReplyKeyboardData.CANCEL }],
        ],
        resize_keyboard: true
    },
    parse_mode: 'HTML'
}

export const REMOVE_WORD_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        keyboard: [
            [{ text: RemovingWordsReplyKeyboardData.SHOW_ALL }],
            [{ text: RemovingWordsReplyKeyboardData.FINISH }, { text: RemovingWordsReplyKeyboardData.CANCEL }],
        ],
        resize_keyboard: true
    }
}

export const START_LEARN_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        keyboard: [
            [{ text: StartLearningReplyKeyboardData.STOP_LEARN }],
        ],
        resize_keyboard: true
    }
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

export function getFavoriteCategoriesKeyboard(selectedCategories: string[]): SendMessageOptions {
    const keyboard: InlineKeyboardButton[][] = [];

    for (let index = 0; index < FAVORITE_CATEGORIES.length; index += 2) {
        const firstCategory = FAVORITE_CATEGORIES[index];
        const secondCategory = FAVORITE_CATEGORIES[index + 1];
        const row: InlineKeyboardButton[] = [];

        if (firstCategory) {
            row.push({
                text: selectedCategories.includes(firstCategory) ? `✅ ${firstCategory}` : firstCategory,
                callback_data: `${FAVORITE_CATEGORY_CALLBACK_PREFIX}${index}`
            });
        }

        if (secondCategory) {
            row.push({
                text: selectedCategories.includes(secondCategory) ? `✅ ${secondCategory}` : secondCategory,
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

// Language callback prefix
export const LANGUAGE_CALLBACK_PREFIX = 'lang_';

export const LANGUAGE_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '🇬🇧 English', callback_data: `${LANGUAGE_CALLBACK_PREFIX}en` }],
            [{ text: '🇺🇦 Українська', callback_data: `${LANGUAGE_CALLBACK_PREFIX}uk` }]
        ],
        resize_keyboard: true
    }
};
