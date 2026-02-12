import TelegramBot, { BotCommand } from 'node-telegram-bot-api';
import chalk from 'chalk';
import { LogService } from './log.service';
import { ScheduleService } from './schedule-service';
import { t } from './i18n.service';
import { SUPPORTED_LANGUAGES } from '../const/common';

export class BotInitService {
    private readonly commandKeys = [
        'start',
        'instruction',
        'set_interval',
        'set_favorite_categories',
        'language',
        'learning_language',
        'my_status'
    ];

    constructor(private scheduleService: ScheduleService) { }

    async initBot(bot: TelegramBot): Promise<void> {
        const nodeEnv = process.env.NODE_ENV!;

        try {
            const me = await bot.getMe();
            LogService.info(`Bot info: ${JSON.stringify(me)}`);

            // Set commands for each supported language
            for (const lang of SUPPORTED_LANGUAGES) {
                const commands: BotCommand[] = this.commandKeys.map(key => ({
                    command: key,
                    description: t(`commands.${key}`, lang)
                }));
                await bot.setMyCommands(commands, { language_code: lang });
            }

            // Set default commands (English)
            const defaultCommands: BotCommand[] = this.commandKeys.map(key => ({
                command: key,
                description: t(`commands.${key}`, 'en')
            }));
            await bot.setMyCommands(defaultCommands);

            LogService.info(chalk.green.bold(`✔ Bot commands set successfully!`));
            if (nodeEnv === 'production') {
                LogService.info(chalk.red(`===[${nodeEnv.toUpperCase()} MODE]===`));
            } else {
                LogService.info(chalk.white.bgBlue.bold(`===[${nodeEnv.toUpperCase()} MODE]===`));
            }

            await this.scheduleService.resumeAllStartLearning(bot);
        } catch (error: any) {
            LogService.error('Error while setting bot commands: ', error);
        }
    }
}
