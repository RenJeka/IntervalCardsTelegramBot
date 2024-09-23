import { CronJob } from 'cron/dist';
import TelegramBot from "node-telegram-bot-api";
import {UserItemAWS} from "../common/interfaces/common";

export class ScheduleService {

    private userJobs: Map<number, CronJob> = new Map;
    private timeZone: string = 'Europe/Kyiv';

    constructor() { }

    startLearnByUserId(
        bot: TelegramBot,
        userItems: UserItemAWS[],
        userId: number,
        chatId?: number,
    ) {
        try {
            const cronJob: CronJob = new CronJob(
                // '0 9-22 * * *', // Run every hour at minute 0, from 9 to 21
                '*/5 * * * * *', // Develop mode. Run every 5 seconds
                () => {
                    const randomIndex = Math.floor(Math.random() * userItems.length);
                    const word = userItems[randomIndex]?.word?.replace(/\-/gm, '\\-')
                    const translation = userItems[randomIndex]?.translation ?
                                        ` \\-\\-\\- ||${userItems[randomIndex]?.translation?.replace(/\-/gm, '\\-')}||`
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
            }
        } catch (err) {
            throw err;
        }
    }
}
