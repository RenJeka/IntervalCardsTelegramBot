import dotenv from 'dotenv'
import TelegramBot, { CallbackQuery, Message, Metadata, SendMessageOptions } from 'node-telegram-bot-api'
import schedule from "node-schedule";
import { UserData } from "./common/interfaces/common";
import { MainInlineKeyboardData } from "./common/enums/mainInlineKeyboard";
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

console.log('Bot is working!');
console.log('TB_TOKEN: ', TB_TOKEN);

const userDB: UserData[] = [];

const messageHelper = new MessageHelper(new DbHelper());

bot.on('message', async (msg: Message, metadata: Metadata) => {
    const messageText = msg.text;


    switch (messageText) {
        case '/start':
            await messageHelper.startBotMessageHandler(bot, msg, BASE_INLINE_KEYBOARD_OPTIONS);
            break;

        case '/help':
            await messageHelper.startBotMessageHandler(bot, msg, BASE_INLINE_KEYBOARD_OPTIONS);
            break;
        default :
            await messageHelper.startBotMessageHandler(bot, msg, BASE_INLINE_KEYBOARD_OPTIONS);
    }
});

bot.on('callback_query', async (query: CallbackQuery) => {

    console.log('query: ', query);

    switch (query.data) {
        case MainInlineKeyboardData.SHOW_ALL:
            // await messageHelper.startBotMessageHandler(bot, query.from.id, BASE_INLINE_KEYBOARD_OPTIONS);
            break;

        case MainInlineKeyboardData.ADD_WORD:
            await messageHelper.addWordMessageHandler(bot, query, ADD_WORD_KEYBOARD_OPTIONS);
            break;
        default :
            // await messageHelper.startBotMessageHandler(bot, query.from.id, BASE_INLINE_KEYBOARD_OPTIONS);
    }
});

bot.on("polling_error", err => console.log('ERROR: ', JSON.stringify(err)));


// TODO: investigate usage info: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md
// TODO: investigate API: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/api.md
// TODO:investigate help from repository's package: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/help.md
// TODO: redo bot for webhooks: https://github.com/yagop/node-telegram-bot-api/tree/master/examples/webhook


//TODO: implement the 'scheduleJob'
// schedule.scheduleJob('13 * * * *', () => {
//     bot.sendMessage(chatId, 'Hello! This is a scheduled message.');
// });