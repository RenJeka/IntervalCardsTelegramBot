import { config as dotEnvConfig } from 'dotenv'
import chalk from 'chalk';
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

dotEnvConfig({path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'});
const TB_TOKEN: string = process.env.TELEGRAM_BOT_TOKEN!;
const nodeEnv: string = process.env.NODE_ENV!;

console.log(`TB_TOKEN:  ${chalk.gray(TB_TOKEN)}`);
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
        console.log(chalk.green.bold(`✔ Bot commands set successfully!`));
        if (nodeEnv === 'production') {
            console.log(chalk.red(`===[${nodeEnv.toUpperCase()} MODE]===`));
        } else {
            console.log(chalk.white.bgBlue.bold(`===[${nodeEnv.toUpperCase()} MODE]===`));
        }
    })
    .catch((error: { message: any; }) => {
        console.error('Error while setting bot commands: ', error.message);
    });

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

bot.on("polling_error", (err: any) => console.log(chalk.red(`❌ ERROR: ${JSON.stringify(err)}`)));
