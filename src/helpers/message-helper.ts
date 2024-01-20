import TelegramBot, { CallbackQuery, Message } from "node-telegram-bot-api";
import { DbHelper } from "./db-helper";
import { UserStatus } from "../common/enums/userStatus";
import {
    ADD_WORD_KEYBOARD_OPTIONS,
    BASE_INLINE_KEYBOARD_OPTIONS,
    REMOVE_WORD_KEYBOARD_OPTIONS, START_LEARN_KEYBOARD_OPTIONS
} from "../const/keyboards";
import { DbResponse, DbResponseStatus } from "../common/interfaces/dbResponse";
import schedule, { Job } from "node-schedule";

export class MessageHelper {

    private userJobs: { userId: number, job: Job; }[] = [];

    private currentJob: Job = {} as Job;

    constructor(private dbHelper: DbHelper) { }

    async startMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message> {
        const chatId = message.chat.id;
        const userId = message.from?.id;

        if (userId) {
            this.dbHelper.editUserStatus(userId, UserStatus.DEFAULT);
        }

        return bot.sendMessage(
            chatId,
            'Welcome to the IntervalCards Telegram Bot! Here you will can add the card and receive messages from your cards periodically',
            BASE_INLINE_KEYBOARD_OPTIONS
        );
    }

    async helpMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message> {
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

                return this.addParticularWordHandler(
                  bot,
                  userId,
                  chatId,
                  message
                );

            case UserStatus.REMOVE_WORD:

                return this.removeParticularWordHandler(
                    bot,
                    userId,
                    chatId,
                    message
                );

                break;

            case UserStatus.START_LEARN:
                // TODO: Remove word logic here
                return bot.sendMessage(
                    chatId,
                    `'${ UserStatus.START_LEARN}' functionality in development `,
                );
                break;

            case UserStatus.STOP_LEARN:
                // TODO: Remove word logic here
                return bot.sendMessage(
                    chatId,
                    `'${ UserStatus.STOP_LEARN}' functionality in development `,
                );
                break;

            default:
                return await this.startMessageHandler(bot, message);
        }
    }

    async goToMainPage(bot: TelegramBot, query: CallbackQuery): Promise<TelegramBot.Message | undefined> {

        const chatId = query.message?.chat.id;
        const userId = query.from.id;
        this.dbHelper.editUserStatus(userId, UserStatus.DEFAULT)

        if (!chatId) {
            return;
        }
        return bot.sendMessage(
            chatId,
            'You are on the \'Home page\'',
            BASE_INLINE_KEYBOARD_OPTIONS
        );
    }

    async addWordMessageHandler(bot: TelegramBot, query: CallbackQuery): Promise<TelegramBot.Message | undefined> {

        const chatId = query.message?.chat.id;
        const userId = query.from.id;
        this.dbHelper.editUserStatus(userId, UserStatus.ADD_WORD)


        if (!chatId) {
            return;
        }
        return bot.sendMessage(
            chatId,
            'Please, type your word and press \'Enter\' or send button',
            ADD_WORD_KEYBOARD_OPTIONS
        );
    }

    async removeWordMessageHandler(bot: TelegramBot, query: CallbackQuery): Promise<TelegramBot.Message | undefined> {

        const chatId = query.message?.chat.id;
        const userId = query.from.id;
        if (!chatId) {
            return;
        }

        this.dbHelper.editUserStatus(userId, UserStatus.REMOVE_WORD)

        try {
            const userDictionary: string[] | null = this.dbHelper.getUserDictionary(userId);

            const userDictionaryWithNumbers: string = this.userDictionaryWithNumbers(userDictionary || []);
            return bot.sendMessage(
                chatId,
                `Please, type number of word and press 'Enter' or send button \n` + userDictionaryWithNumbers,
                REMOVE_WORD_KEYBOARD_OPTIONS
            );
        } catch (error: any) {
            return bot.sendMessage(
                chatId,
                `Something went wrong: ${error?.message || ''}. Please, try again`,
                REMOVE_WORD_KEYBOARD_OPTIONS
            );
        }
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

    async startLearn(bot: TelegramBot, query: CallbackQuery): Promise<TelegramBot.Message | undefined> {
        const chatId = query.message?.chat.id;
        const userId = query.from.id;
        if (!chatId) {
            return;
        }

        try {
            // TODO: check for empty user dictionary
            this.dbHelper.editUserStatus(userId, UserStatus.START_LEARN)
            // TODO: Logic to start learning here
            // TODO: move logic for job --> to jobHelper

            this.currentJob = schedule.scheduleJob('*/5 * * * * *', () => {
                bot.sendMessage(chatId, 'Hello! This is a scheduled message.');
            });
            return bot.sendMessage(
                chatId,
                `You are in learning. Every 3 hour you will get 1 word`,
                START_LEARN_KEYBOARD_OPTIONS
            );
        } catch (error: any) {
            return bot.sendMessage(
                chatId,
                `Something went wrong: ${error?.message || ''}. Please, try again`,
                BASE_INLINE_KEYBOARD_OPTIONS
            );
        }
    }

    async stopLearn(bot: TelegramBot, query: CallbackQuery): Promise<TelegramBot.Message | undefined> {
        const chatId = query.message?.chat.id;
        const userId = query.from.id;
        if (!chatId) {
            return;
        }

        try {
            this.dbHelper.editUserStatus(userId, UserStatus.DEFAULT)
            // TODO: Logic to stop learning here
            this.currentJob.cancel();
            return bot.sendMessage(
                chatId,
                `You have been exit from learn mode. Nice work!`,
                BASE_INLINE_KEYBOARD_OPTIONS
            );
        } catch (error: any) {
            return bot.sendMessage(
                chatId,
                `Something went wrong: ${error?.message || ''}. Please, try again`,
                BASE_INLINE_KEYBOARD_OPTIONS
            );
        }
    }


    private userDictionaryWithNumbers(userDictionary: string[]): string {
        if (!userDictionary || !userDictionary.length) {
            return '';
        }

        let result = '';

        userDictionary.forEach((usersWord: string, index: number) => {
            result += `${index + 1}. ${usersWord}; \n`
        });

        return result;
    }

    private addParticularWordHandler(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        message:Message
    ):  Promise<TelegramBot.Message> {
        const dbResponse: DbResponse = this.dbHelper.writeWordByUserId(userId, message.text || '');
        let responseMessageText = `The word '${message.text}' has been added. You can add more!`;

        if (!dbResponse.success) {
            if (dbResponse.status === DbResponseStatus.DUPLICATE_WORD) {
                responseMessageText = `The word '${message.text}' already exist in your dictionary. Please, send other word.`;
            }
            responseMessageText = dbResponse.message || 'Something went wrong! Please, try again.'
        }
        return bot.sendMessage(
            chatId,
            responseMessageText,
        );
    }


    private removeParticularWordHandler(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        message:Message
    ):  Promise<TelegramBot.Message> {
        const numberOfWord: number = parseInt(message.text || '')
        if (Number.isNaN(numberOfWord) || numberOfWord === 0) {
            return bot.sendMessage(
                chatId,
                'Please, provide valid word number.',
            );
        }

        const dbResponse: DbResponse = this.dbHelper.removeWordByIndexByUserId(userId, numberOfWord - 1);
        let responseMessageText = `The word has been deleted successfully. You can delete more!`;

        if (!dbResponse.success) {
            if (dbResponse.status === DbResponseStatus.WRONG_INPUT) {
                responseMessageText = `The word with number '${message.text}' hasn't been find. Please, try again`;
            }
            responseMessageText = dbResponse.message || 'Something went wrong! Please, try again.'
        }
        return bot.sendMessage(
            chatId,
            dbResponse.message || responseMessageText,
        );
    }
}
