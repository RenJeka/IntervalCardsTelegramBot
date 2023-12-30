import dotenv from 'dotenv'
import TelegramBot, { Message, SendMessageOptions } from 'node-telegram-bot-api'
import schedule from "node-schedule";
import { UserDB } from "./interfaces/common";

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

const userDB: UserDB[] = [];

bot.on('message', (msg: Message) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    console.log('msg: ', msg);

    const options: SendMessageOptions = {
        reply_markup: {
            keyboard: [
                [{text: '⭐️ Show all words'}],
                [{text: '⭐️ Add word'}, {text: '⭐️ Remove word'}],
                [{text: '⭐️ Start learning'}, {text: '⭐️ Stop learning'}],
            ],
            resize_keyboard: true
        }
    }

    if (messageText === '/start') {
        bot.sendMessage(
            chatId,
            'Welcome to the IntervalCards Telegram Bot! Here you will can add the card and receive messages from your cards periodically',
            options
        );

        schedule.scheduleJob('13 * * * *', () => {
            bot.sendMessage(chatId, 'Hello! This is a scheduled message.');
        });
    }

    // TODO: investigate usage info: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md
    // TODO: investigate API: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/api.md
    // TODO:investigate help from repository's package: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/help.md
    // TODO: redo bot for webhooks: https://github.com/yagop/node-telegram-bot-api/tree/master/examples/webhook
    // TODO: send message by time

});

bot.on("polling_error", err => console.log('ERROR: ', JSON.stringify(err)));