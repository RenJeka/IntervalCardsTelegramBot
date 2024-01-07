import TelegramBot, { CallbackQuery, Message, SendMessageOptions } from "node-telegram-bot-api";
import { DbHelper } from "./db-helper";
import { UserStatus } from "../common/enums/userStatus";

export class MessageHelper {
    constructor(private dbHelper: DbHelper) { }

    startBotMessageHandler(bot: TelegramBot, message: Message, options: SendMessageOptions): Promise<TelegramBot.Message> {
        const chatId = message.chat.id;
        const userId = message.from?.id;

        if (userId) {
            this.dbHelper.changeUserStatus(userId, UserStatus.DEFAULT);
        }

        return bot.sendMessage(
            chatId,
            'Welcome to the IntervalCards Telegram Bot! Here you will can add the card and receive messages from your cards periodically',
            options
        );
    }

    async addWordMessageHandler(bot: TelegramBot, query: CallbackQuery, options: SendMessageOptions): Promise<TelegramBot.Message | undefined> {

        const chatId = query.message?.chat.id;
        const userId = query.from.id;
        this.dbHelper.changeUserStatus(userId, UserStatus.ADD_WORD)


        console.log('query: ', query);
        if (!chatId) {
            return;
        }
        return bot.sendMessage(
            chatId,
            'Please, type 1 word ...',
            options
        );
    }
}
