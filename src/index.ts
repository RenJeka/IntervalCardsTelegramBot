// CRITICAL: Load environment variables FIRST, before any other imports
// that might use process.env during class initialization
import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

import chalk from 'chalk';
import TelegramBot, {
    CallbackQuery,
    Message,
    Metadata,
} from 'node-telegram-bot-api';
import {
    AddingWordsReplyKeyboardData,
    MainReplyKeyboardData,
    RemovingWordsReplyKeyboardData,
    StartLearningReplyKeyboardData,
} from './common/enums/mainInlineKeyboard';
import { CommandHelper, UserAction } from './helpers/command-helper';
import { DbAwsService } from './services/db-aws-service';
import { MessageService } from './services/message-service';
import { ScheduleService } from './services/schedule-service';
import { LogService } from './services/log.service';
import { BotInitService } from './services/bot-init.service';

// LLM exports
export { LLMService } from './services/llm.service';
export { LLMHelper } from './helpers/llm-helper';
export * from './common/interfaces/llm';
const TB_TOKEN: string = process.env.TELEGRAM_BOT_TOKEN!;
const nodeEnv: string = process.env.NODE_ENV!;

LogService.info(`TB_TOKEN:  ${chalk.gray(TB_TOKEN)}`);
const bot = new TelegramBot(TB_TOKEN, {
    polling: {
        interval: 300,
        autoStart: true,
    },
});

const dbAwsService = new DbAwsService();
const scheduleService = new ScheduleService(dbAwsService);
const messageService = new MessageService(dbAwsService, scheduleService);

const botInitService = new BotInitService(scheduleService);
botInitService.initBot(bot);

bot.on('message', async (msg: Message, metadata: Metadata) => {
    const messageText = msg.text;

    const userAction = CommandHelper.getActionFromText(messageText || '');

    switch (messageText) {
        case '/start':
            await messageService.startMessageHandler(bot, msg);
            break;

        case '/instruction':
            await messageService.instructionMessageHandler(bot, msg);
            break;

        case '/set_interval':
            await messageService.setIntervalMessageHandler(bot, msg);
            break;

        case '/set_favorite_categories':
            await messageService.favoriteCategoriesMessageHandler(bot, msg);
            break;

        case '/my_status':
            await messageService.myStatusMessageHandler(bot, msg);
            break;

        case '/language':
            await messageService.languageMessageHandler(bot, msg);
            break;

        case '/learning_language':
            await messageService.learningLanguageMessageHandler(bot, msg);
            break;

        case '/add_words_set':
            await messageService.addWordsSetMessageHandler(bot, msg);
            break;

        default:
            switch (userAction) {
                case UserAction.SHOW_ALL:
                    await messageService.getAllMessagesHandler(bot, msg);
                    break;

                case UserAction.ADD_WORD:
                    await messageService.addWordMessageHandler(bot, msg);
                    break;

                case UserAction.REMOVE_WORD:
                    await messageService.removeWordMessageHandler(bot, msg);
                    break;

                case UserAction.START_LEARN:
                    await messageService.startLearn(bot, msg);
                    break;

                case UserAction.STOP_LEARN:
                    await messageService.stopLearn(bot, msg);
                    break;

                case UserAction.CANCEL:
                case UserAction.FINISH_ADDING:
                case UserAction.FINISH_REMOVING:
                    await messageService.goToMainPage(bot, msg);
                    break;

                default:
                    await messageService.generalMessageHandler(bot, msg);
            }
    }
});

bot.on('callback_query', async (query: CallbackQuery) => {
    await messageService.generalCallbackHandler(bot, query);
});

bot.on('polling_error', (err: any) =>
    LogService.error(chalk.red(`❌ ERROR:`), err)
);
