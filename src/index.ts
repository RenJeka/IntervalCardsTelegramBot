import dotenv from 'dotenv'
import TelegramBot, { CallbackQuery, Message, Metadata, SendMessageOptions } from 'node-telegram-bot-api'
import { AddingWordsInlineKeyboardData, MainInlineKeyboardData } from "./common/enums/mainInlineKeyboard";
import { DbService } from "./services/db-service";
import { ADD_WORD_KEYBOARD_OPTIONS, BASE_INLINE_KEYBOARD_OPTIONS } from "./const/keyboards";
import { MessageService } from "./services/message-service";

dotenv.config();
const TB_TOKEN: string = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(TB_TOKEN,
    {
        polling: {
            interval: 300,
            autoStart: true
        }
    });

const messageService = new MessageService(new DbService());

bot.on('message', async (msg: Message, metadata: Metadata) => {
    const messageText = msg.text;

    switch (messageText) {
        case '/start':
            await messageService.startMessageHandler(bot, msg);
            break;

        case '/help':
            await messageService.helpMessageHandler(bot, msg);
            break;
        default :
            await messageService.generalMessageHandler(bot, msg);
    }
});

bot.on('callback_query', async (query: CallbackQuery) => {
    switch (query.data) {
        case MainInlineKeyboardData.SHOW_ALL:
            await messageService.getAllMessagesHandler(bot, query);
            break;

        case MainInlineKeyboardData.ADD_WORD:
            await messageService.addWordMessageHandler(bot, query);
            break;

        case MainInlineKeyboardData.REMOVE_WORD:
            await messageService.removeWordMessageHandler(bot, query);
            break;

        case MainInlineKeyboardData.START_LEARN:
            await messageService.startLearn(bot, query);
            break;

        case MainInlineKeyboardData.STOP_LEARN:
            await messageService.stopLearn(bot, query);
            break;

        case AddingWordsInlineKeyboardData.CANCEL:
            await messageService.goToMainPage(bot, query);
            break;

        case AddingWordsInlineKeyboardData.FINISH:
            await messageService.goToMainPage(bot, query);
            break;

        default :
            await messageService.startMessageHandler(bot, query.message!);
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

