require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');


const TB_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const myBot = new TelegramBot(TB_TOKEN, { polling: true });

console.log('TB_TOKEN:', TB_TOKEN)

myBot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    console.log('msg: ', msg);

    if (messageText === '/start') {
        myBot.sendMessage(chatId, 'Welcome to the IntervalCards Telegram Bot! Here you will can add the card and receive messages from your cards periodically');
    }

    // TODO: redo for TS
    // TODO: investigate usage info: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md
    // TODO: investigate API: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/api.md
    // TODO:investigate help from repository's package: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/help.md
    // TODO: redo bot for webhooks: https://github.com/yagop/node-telegram-bot-api/tree/master/examples/webhook
    // TODO: send message by time

});