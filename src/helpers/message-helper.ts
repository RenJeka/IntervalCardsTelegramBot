import TelegramBot, { CallbackQuery, Message, SendMessageOptions } from "node-telegram-bot-api";
import { DbHelper } from "./db-helper";
import { UserStatus } from "../common/enums/userStatus";
import { ADD_WORD_KEYBOARD_OPTIONS, BASE_INLINE_KEYBOARD_OPTIONS } from "../const/keyboards";

export class MessageHelper {
    constructor(private dbHelper: DbHelper) { }

    async startMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message> {
        const chatId = message.chat.id;
        const userId = message.from?.id;

        if (userId) {
            this.dbHelper.changeUserStatus(userId, UserStatus.DEFAULT);
        }

        return bot.sendMessage(
            chatId,
            'Welcome to the IntervalCards Telegram Bot! Here you will can add the card and receive messages from your cards periodically',
            BASE_INLINE_KEYBOARD_OPTIONS
        );
    }

    async helpMessageHandler(bot: TelegramBot, message: Message, options: SendMessageOptions): Promise<TelegramBot.Message> {
        return this.startMessageHandler(bot, message);
    }

    async generalMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message> {
        const chatId = message.chat.id;
        const userId = message.from?.id;
        if (!userId) {
            return bot.sendMessage(
                chatId,
                'To use the application I should define You as a user. But I can\'t',
            );
        }

        if (!message.text) {
            return bot.sendMessage(
                chatId,
                'I did not receive any message from You, Please, try again.',
            );
        }

        const currentUserStatus: UserStatus | null = this.dbHelper.getUserStatus(userId);

        switch (currentUserStatus) {
            case UserStatus.ADD_WORD:
                this.dbHelper.writeWordByUserId(userId, message.text);
                return bot.sendMessage(
                    chatId,
                    `The word '${message.text}' has been added. You can add more!`,
                );

            case UserStatus.REMOVE_WORD:
                // TODO: Remove word logic here
                return bot.sendMessage(
                    chatId,
                    `'${ UserStatus.REMOVE_WORD}' functionality in development `,
                );

            case UserStatus.START_LEARN:
                // TODO: Remove word logic here
                return bot.sendMessage(
                    chatId,
                    `'${ UserStatus.START_LEARN}' functionality in development `,
                );

            case UserStatus.STOP_LEARN:
                // TODO: Remove word logic here
                return bot.sendMessage(
                    chatId,
                    `'${ UserStatus.STOP_LEARN}' functionality in development `,
                );

            default:
                return await this.startMessageHandler(bot, message);
        }
    }

    async goToMainPage(bot: TelegramBot, query: CallbackQuery): Promise<TelegramBot.Message | undefined> {

        const chatId = query.message?.chat.id;
        const userId = query.from.id;
        this.dbHelper.changeUserStatus(userId, UserStatus.DEFAULT)

        console.log('***************** GO_TO_MAIN_PAGE *********************');

        if (!chatId) {
            return;
        }
        return bot.sendMessage(
            chatId,
            '',
            BASE_INLINE_KEYBOARD_OPTIONS
        );
    }

    async addWordMessageHandler(bot: TelegramBot, query: CallbackQuery): Promise<TelegramBot.Message | undefined> {

        const chatId = query.message?.chat.id;
        const userId = query.from.id;
        this.dbHelper.changeUserStatus(userId, UserStatus.ADD_WORD)


        if (!chatId) {
            return;
        }
        return bot.sendMessage(
            chatId,
            'Please, send me 1 word ...',
            ADD_WORD_KEYBOARD_OPTIONS
        );
    }

    async getAllMessagesHandler(bot: TelegramBot, query: CallbackQuery): Promise<TelegramBot.Message | undefined> {
        const chatId = query.message?.chat.id;
        const userId = query.from.id;
        if (!userId || !chatId) {
            return
            // return bot.sendMessage(
            //     chatId,
            //     'To use the application I should define You as a user. But I can\'t',
            // );
        }

        const userDictionary: string[] | null = this.dbHelper.getUserDictionary(userId);


        if (!userDictionary || !userDictionary.length) {
            return bot.sendMessage(
                chatId,
                'You have no words yet. Try to add some.',
            );
        }
        return bot.sendMessage(
            chatId,
            `Your words:\n ${userDictionary.join(', \n')}`,
        );
    }
}
