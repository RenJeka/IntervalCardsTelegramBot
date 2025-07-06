import { CronJob } from 'cron/dist';
import TelegramBot from "node-telegram-bot-api";
import { UserItemAWS } from "../common/interfaces/common";
import { FormatterHelper } from "../helpers/formatter-helper";
import { DEFAULT_USER_INTERVAL, DEVELOPER_MODE_BOT_SENDS_MESSAGE_SEC } from "../const/common";
import { IDbService } from '../common/interfaces/iDbService';

export class ScheduleService {

    private userJobs: Map<number, CronJob> = new Map;
    private timeZone: string = 'Europe/Kyiv';
    private nodeEnv: string = process.env.NODE_ENV!;

    constructor(
        private dbService: IDbService
    ) { }

    async startLearnByUserId(
        bot: TelegramBot,
        userItems: UserItemAWS[],
        userId: number,
        interval: number = DEFAULT_USER_INTERVAL,
        chatId?: number,
    ) {

        if (this.userJobs.has(userId)){
            this.stopLearnByUserId(userId)
        }

        try {
            /**
             * production:  Run every 'interval' hours
             *
             * development: Run every DEVELOPER_MODE_BOT_SENDS_MESSAGE_SEC seconds
             * */
            const cronTime = this.nodeEnv === 'production' ? `0 */${interval} * * *` : `*/${DEVELOPER_MODE_BOT_SENDS_MESSAGE_SEC} * * * * *`


            const cronJob: CronJob = new CronJob(
                cronTime,
                () => {
                    const randomIndex = Math.floor(Math.random() * userItems.length);
                    const word = FormatterHelper.escapeMarkdownV2(userItems[randomIndex]?.word!);
                    const translation = userItems[randomIndex]?.translation ?
                                        ` \\-\\-\\- ||${FormatterHelper.escapeMarkdownV2(userItems[randomIndex]?.translation || '') }||`
                                        : null;
                    const fullMessage = word + (translation || '');

                    if (chatId) {
                        bot.sendMessage(chatId, fullMessage, { parse_mode: 'MarkdownV2' });
                    }
                },
                null,
                true,
                this.timeZone
            );

            this.userJobs.set(userId, cronJob);

        } catch (err) {
            throw err;
        }
    }

    stopLearnByUserId(
        userId: number,
    ) {
        try {
            if (this.userJobs.has(userId)) {
                this.userJobs.get(userId)!.stop();
                this.userJobs.delete(userId);
            }
        } catch (err) {
            throw err;
        }
    }
}
