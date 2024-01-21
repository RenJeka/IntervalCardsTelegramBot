import { DbService } from "./db-service";
import schedule, { Job } from "node-schedule";
import TelegramBot from "node-telegram-bot-api";

export class ScheduleService {

    private userJobs: Map<number, Job> = new Map;


    constructor(dbService: DbService) { }

    startLearnByUserId(
        bot: TelegramBot,
        userDictionary: string[],
        userId: number,
        chatId?: number,
    ) {
        try {
            const currentUserJob: Job = schedule.scheduleJob('*/5 * * * * *', () => {
                const randomIndex = Math.floor(Math.random() * userDictionary.length);
                if (chatId) {
                    bot.sendMessage(chatId, userDictionary[randomIndex]);
                }
            });

            this.userJobs.set(userId, currentUserJob);
        } catch (err) {
            throw err;
        }
    }

    stopLearnByUserId(
        userId: number,
    ) {
        try {
            if (this.userJobs.has(userId)) {
                this.userJobs.get(userId)!.cancel();
            }
        } catch (err) {
            throw err;
        }
    }
}