import dotenv from 'dotenv'
import TelegramBot, { CallbackQuery, Message, Metadata, SendMessageOptions } from 'node-telegram-bot-api'
import schedule from "node-schedule";
import { AddingWordsInlineKeyboardData, MainInlineKeyboardData } from "./common/enums/mainInlineKeyboard";
import { DbHelper } from "./helpers/db-helper";
import { ADD_WORD_KEYBOARD_OPTIONS, BASE_INLINE_KEYBOARD_OPTIONS } from "./const/keyboards";
import { MessageHelper } from "./helpers/message-helper";

dotenv.config();
const TB_TOKEN: string = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(TB_TOKEN,
    {
        polling: {
            interval: 300,
            autoStart: true
        }
    });

const messageHelper = new MessageHelper(new DbHelper());

bot.on('message', async (msg: Message, metadata: Metadata) => {
    const messageText = msg.text;

    switch (messageText) {
        case '/start':
            await messageHelper.startMessageHandler(bot, msg);
            break;

        case '/help':
            await messageHelper.helpMessageHandler(bot, msg);
            break;
        default :
            await messageHelper.generalMessageHandler(bot, msg);
    }
});

bot.on('callback_query', async (query: CallbackQuery) => {
    switch (query.data) {
        case MainInlineKeyboardData.SHOW_ALL:
            await messageHelper.getAllMessagesHandler(bot, query);
            break;

        case MainInlineKeyboardData.ADD_WORD:
            await messageHelper.addWordMessageHandler(bot, query);
            break;

        case MainInlineKeyboardData.REMOVE_WORD:
            await messageHelper.removeWordMessageHandler(bot, query);
            break;

        case MainInlineKeyboardData.START_LEARN:
            await messageHelper.startLearn(bot, query);
            break;

        case MainInlineKeyboardData.STOP_LEARN:
            await messageHelper.stopLearn(bot, query);
            break;

        case AddingWordsInlineKeyboardData.CANCEL:
            await messageHelper.goToMainPage(bot, query);
            break;

        case AddingWordsInlineKeyboardData.FINISH:
            await messageHelper.goToMainPage(bot, query);
            break;

        default :
            // await messageHelper.startBotMessageHandler(bot, query.from.id, BASE_INLINE_KEYBOARD_OPTIONS);
    }
});

bot.on("polling_error", err => console.log('ERROR: ', JSON.stringify(err)));

// TODO: make 2 methods: start learning, stop learning
// use the 'scheduleJob': 
// schedule.scheduleJob('13 * * * *', () => {
//     bot.sendMessage(chatId, 'Hello! This is a scheduled message.');
// });

// TODO: redo inline keyboard to reply keyboard
// TODO: redo all read / write file to read/writeFileSync

