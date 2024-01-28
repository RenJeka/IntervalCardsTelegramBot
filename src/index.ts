import dotenv from 'dotenv'
import TelegramBot, { Message, Metadata } from 'node-telegram-bot-api'
import {
    AddingWordsReplyKeyboardData,
    MainReplyKeyboardData
} from "./common/enums/mainInlineKeyboard";
import { DbService } from "./services/db-service";
import { MessageService } from "./services/message-service";
import { ScheduleService } from "./services/schedule-service";

dotenv.config();
const TB_TOKEN: string = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(TB_TOKEN,
    {
        polling: {
            interval: 300,
            autoStart: true
        }
    });

const dbService = new DbService();
const scheduleService = new ScheduleService(dbService);
const messageService = new MessageService(
    dbService,
    scheduleService
);

bot.on('message', async (msg: Message, metadata: Metadata) => {
    const messageText = msg.text;

    switch (messageText) {
        case '/start':
            await messageService.startMessageHandler(bot, msg);
            break;

        case '/help':
            await messageService.helpMessageHandler(bot, msg);
            break;

        case MainReplyKeyboardData.SHOW_ALL:
            await messageService.getAllMessagesHandler(bot, msg);
            break;

        case MainReplyKeyboardData.ADD_WORD:
            await messageService.addWordMessageHandler(bot, msg);
            break;

        case MainReplyKeyboardData.REMOVE_WORD:
            await messageService.removeWordMessageHandler(bot, msg);
            break;

        case MainReplyKeyboardData.START_LEARN:
            await messageService.startLearn(bot, msg);
            break;

        case MainReplyKeyboardData.STOP_LEARN:
            await messageService.stopLearn(bot, msg);
            break;

        case AddingWordsReplyKeyboardData.CANCEL:
            await messageService.goToMainPage(bot, msg);
            break;

        case AddingWordsReplyKeyboardData.FINISH:
            await messageService.goToMainPage(bot, msg);
            break;
        default :
            await messageService.generalMessageHandler(bot, msg);
    }
});

bot.on("polling_error", err => console.log('ERROR: ', JSON.stringify(err)));

// TODO: check working of MessageService
// TODO: delete unused keyboard options... And other that can be
// TODO: on pressing 'Cancel' or other word — bot add word 'Cancel'
// TODO: test the bot
// TODO: redo inline keyboard to reply keyboard

