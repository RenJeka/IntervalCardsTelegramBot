import { CronJob } from 'cron/dist';
import TelegramBot from "node-telegram-bot-api";

export class ScheduleService {

    private userJobs: Map<number, CronJob> = new Map;
    private timeZone: string = 'Europe/Kyiv';

    constructor() { }

    startLearnByUserId(
        bot: TelegramBot,
        userDictionary: string[],
        userId: number,
        chatId?: number,
    ) {
        try {
            const cronJob: CronJob = new CronJob(
                '0 9-22 * * *', // Run every hour at minute 0, from 9 to 21
                // '*/5 * * * * *', // Develop mode. Run every 5 seconds
                () => {
                    const randomIndex = Math.floor(Math.random() * userDictionary.length);
                    if (chatId) {
                        bot.sendMessage(chatId, userDictionary[randomIndex]);
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
