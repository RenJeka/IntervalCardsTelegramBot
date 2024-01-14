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
            await messageHelper.helpMessageHandler(bot, msg, BASE_INLINE_KEYBOARD_OPTIONS);
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

// TODO: redo all read / write file to read/writeFileSync
// TODO: move findUserMethod to separate method
// TODO: redo inline keyboard to reply keyboard
// TODO: make 3 methods: remove word / start learning, stop learning
// TODO: delete duplicates of words
// TODO: set-up node-typescript to make possible to debug

// TODO: investigate usage info: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md
// TODO: investigate API: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/api.md
// TODO:investigate help from repository's package: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/help.md
// TODO: redo bot for webhooks: https://github.com/yagop/node-telegram-bot-api/tree/master/examples/webhook

//TODO: implement the 'scheduleJob'
// schedule.scheduleJob('13 * * * *', () => {
//     bot.sendMessage(chatId, 'Hello! This is a scheduled message.');
// });