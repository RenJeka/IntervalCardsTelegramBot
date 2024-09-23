import { config as dotEnvConfig } from 'dotenv'
import TelegramBot, { BotCommand, CallbackQuery, Message, Metadata } from 'node-telegram-bot-api'
import {
    AddingWordsReplyKeyboardData,
    MainReplyKeyboardData,
    RemovingWordsReplyKeyboardData,
    StartLearningReplyKeyboardData
} from "./common/enums/mainInlineKeyboard";
import { DbAwsService } from "./services/db-aws-service";
import { MessageService } from "./services/message-service";
import { ScheduleService } from "./services/schedule-service";


dotEnvConfig();
const TB_TOKEN: string = process.env.TELEGRAM_BOT_TOKEN!;

console.log('TB_TOKEN: ', TB_TOKEN);
const bot = new TelegramBot(TB_TOKEN,
    {
        polling: {
            interval: 300,
            autoStart: true
        }
    });

const dbAwsService = new DbAwsService();
const scheduleService = new ScheduleService();
const messageService = new MessageService(
    dbAwsService,
    scheduleService
);
const commands: BotCommand[] = [
    { command: 'start', description: 'Start the bot'},
    { command: 'instruction', description: 'Additional information about the bot' }
];

bot.setMyCommands(commands)
    .then(() => {
        console.log('Bot commands set successfully!');
    })
    .catch((error: { message: any; }) => {
        console.error('Error while setting bot commands: ', error.message);
    })

bot.on('message', async (msg: Message, metadata: Metadata) => {
    const messageText = msg.text;

    switch (messageText) {
        case '/start':
            await messageService.startMessageHandler(bot, msg);
            break;

        case '/instruction':
            await messageService.instructionMessageHandler(bot, msg);
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

bot.on("polling_error", (err: any) => console.log('ERROR: ', JSON.stringify(err)));
