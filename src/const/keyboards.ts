import { SendMessageOptions } from "node-telegram-bot-api";
import {
    AddingWordsReplyKeyboardData,
    MainReplyKeyboardData,
    RemovingWordsReplyKeyboardData, StartLearningReplyKeyboardData
} from "../common/enums/mainInlineKeyboard";

export const REPLY_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        keyboard: [
            [{text: MainReplyKeyboardData.SHOW_ALL}],
            [{text: MainReplyKeyboardData.ADD_WORD}, {text: MainReplyKeyboardData.REMOVE_WORD}],
            [{text: MainReplyKeyboardData.START_LEARN}, {text: MainReplyKeyboardData.STOP_LEARN}],
        ]
    }
}

export const ADD_WORD_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        keyboard: [
            [{text: AddingWordsReplyKeyboardData.SHOW_ALL}],
            [{text: AddingWordsReplyKeyboardData.FINISH}, {text: AddingWordsReplyKeyboardData.CANCEL}],
        ],
        resize_keyboard: true
    }
}

export const REMOVE_WORD_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        keyboard: [
            [{text: RemovingWordsReplyKeyboardData.SHOW_ALL}],
            [{text: RemovingWordsReplyKeyboardData.FINISH}, {text: RemovingWordsReplyKeyboardData.CANCEL}],
        ],
        resize_keyboard: true
    }
}

export const REMOVE_WORD_WORDS_KEYBOARD: SendMessageOptions = {
    reply_markup: {
        inline_keyboard: [
            [{text: 'test message', callback_data: '/test'}]
        ],
        resize_keyboard: true
    }
}

export const START_LEARN_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        keyboard: [
            [{text: StartLearningReplyKeyboardData.STOP_LEARN}],
        ],
        resize_keyboard: true
    }
}