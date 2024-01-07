import { SendMessageOptions } from "node-telegram-bot-api";
import { AddingWordsInlineKeyboardData, MainInlineKeyboardData } from "../common/enums/mainInlineKeyboard";

export const BASE_INLINE_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        inline_keyboard: [
            [{text: '⭐️ Show all words', callback_data: MainInlineKeyboardData.SHOW_ALL}],
            [{text: '⭐️ Add word', callback_data: MainInlineKeyboardData.ADD_WORD}, {text: '⭐️ Remove word', callback_data: MainInlineKeyboardData.REMOVE_WORD}],
            [{text: '⭐️ Start learning', callback_data: MainInlineKeyboardData.START_LEARN}, {text: '⭐️ Stop learning', callback_data: MainInlineKeyboardData.STOP_LEARN}],
        ],
        resize_keyboard: true
    }
}

export const ADD_WORD_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        inline_keyboard: [
            [{text: '⭐️ Show all words', callback_data: AddingWordsInlineKeyboardData.SHOW_ALL}],
            [{text: '⭐️ Finish adding words', callback_data: AddingWordsInlineKeyboardData.FINISH}, {text: '⭐️ Cancel', callback_data: AddingWordsInlineKeyboardData.CANCEL}],
        ],
        resize_keyboard: true
    }
}

export const REPLY_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        keyboard: [
            [{text: '⭐️ Show all words'}],
            [{text: '⭐️ Add word'}, {text: '⭐️ Remove word'}],
            [{text: '⭐️ Start learning'}, {text: '⭐️ Stop learning'}],
        ],
        resize_keyboard: true
    }
}