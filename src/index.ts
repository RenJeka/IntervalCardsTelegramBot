import dotenv from 'dotenv'
import TelegramBot, { CallbackQuery, Message, Metadata } from 'node-telegram-bot-api'
import {
    AddingWordsReplyKeyboardData,
    MainReplyKeyboardData,
    RemovingWordsReplyKeyboardData,
    StartLearningReplyKeyboardData
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

        case StartLearningReplyKeyboardData.STOP_LEARN:
            await messageService.stopLearn(bot, msg);
            break;

        case AddingWordsReplyKeyboardData.CANCEL:
            await messageService.goToMainPage(bot, msg);
            break;

        case AddingWordsReplyKeyboardData.FINISH:
            await messageService.goToMainPage(bot, msg);
            break;

        case RemovingWordsReplyKeyboardData.FINISH:
            await messageService.goToMainPage(bot, msg);
            break;

        default :
            await messageService.generalMessageHandler(bot, msg);
    }
});

bot.on('callback_query', async (query: CallbackQuery) => {
    await messageService.generalCallbackHandler(bot, query);
});

bot.on("polling_error", err => console.log('ERROR: ', JSON.stringify(err)));

// TODO: ICTB-4 make schedule from 9:00 till 21:00
// TODO: ICTB-5 cut-off version v1.0.0
// TODO: ICTB-10 Implement translation
// TODO: ICTB-11 add left bottom menu
// TODO: ICTB-12 add instruction '/instruction'
// TODO: ICTB-13 add button to check user status (user mode)
// TODO: ICTB-17 add logging


