import { InlineKeyboardButton, SendMessageOptions } from "node-telegram-bot-api";
import {
    AddingWordsReplyKeyboardData,
    MainReplyKeyboardData,
    RemovingWordsReplyKeyboardData, StartLearningReplyKeyboardData
} from "../common/enums/mainInlineKeyboard";
import {UserWord, UserItemAWS} from "../common/interfaces/common";

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

export const START_LEARN_KEYBOARD_OPTIONS: SendMessageOptions = {
    reply_markup: {
        keyboard: [
            [{text: StartLearningReplyKeyboardData.STOP_LEARN}],
        ],
        resize_keyboard: true
    }
}


export function getRemoveWordsKeyboard(userDictionary: UserItemAWS[]): SendMessageOptions {
    const keyboard: InlineKeyboardButton[][] = userDictionary.map((userWord: UserItemAWS) => {
        return [{text: userWord.word, callback_data: userWord._id.toString()}]
    })

   return {
       reply_markup: {
           inline_keyboard: keyboard,
           resize_keyboard: true
       }
   }
}
