import TelegramBot, { Message } from "node-telegram-bot-api";
import { DbService } from "./db-service";
import { UserStatus } from "../common/enums/userStatus";
import {
    ADD_WORD_KEYBOARD_OPTIONS,
    REMOVE_WORD_KEYBOARD_OPTIONS,
    REPLY_KEYBOARD_OPTIONS,
    START_LEARN_KEYBOARD_OPTIONS
} from "../const/keyboards";
import { DbResponse, DbResponseStatus } from "../common/interfaces/dbResponse";
import { ScheduleService } from "./schedule-service";

export class MessageService {

    constructor(
        private dbService: DbService,
        private scheduleService: ScheduleService,
    ) { }

    async startMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message> {
        const {chatId, userId} = this.getIdsFromMessage(message);

        this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

        return bot.sendMessage(
            chatId,
            'Welcome to the IntervalCards Telegram Bot! Here you will can add the card and receive messages from your cards periodically',
            REPLY_KEYBOARD_OPTIONS
        );
    }

    async helpMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message> {
        return this.startMessageHandler(bot, message);
    }

    async generalMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message> {
        const {chatId, userId} = this.getIdsFromMessage(message);

        if (!message.text) {
            return bot.sendMessage(
                chatId,
                'I did not receive any message from You, Please, try again.',
            );
        }

        const currentUserStatus: UserStatus | null = this.dbService.getUserStatus(userId);

        if (!currentUserStatus) {
            this.dbService.setUserStatus(userId, UserStatus.DEFAULT);
        }

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
                return bot.sendMessage(
                    chatId,
                    `Now You are in learning mode. Please, use the keyboard menu to navigate or do action you want.`,
                );
                break;

            default:
                return await this.startMessageHandler(bot, message);
        }
    }

    async goToMainPage(bot: TelegramBot, message: Message): Promise<TelegramBot.Message | undefined> {

        const {chatId, userId} = this.getIdsFromMessage(message);
        this.dbService.setUserStatus(userId, UserStatus.DEFAULT)

        return bot.sendMessage(
            chatId,
            'You are on the \'Home page\'',
            REPLY_KEYBOARD_OPTIONS
        );
    }

    async addWordMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message | undefined> {

        const {chatId, userId} = this.getIdsFromMessage(message);
        this.dbService.setUserStatus(userId, UserStatus.ADD_WORD)

        if (!chatId) {
            return;
        }
        return bot.sendMessage(
            chatId,
            'Please, type your word and press \'Enter\' or send button',
            ADD_WORD_KEYBOARD_OPTIONS
        );
    }

    async removeWordMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message | undefined> {

        const {chatId, userId} = this.getIdsFromMessage(message);

        this.dbService.setUserStatus(userId, UserStatus.REMOVE_WORD)

        try {
            const userDictionary: string[] | null = this.dbService.getUserDictionary(userId);

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

    async getAllMessagesHandler(bot: TelegramBot,  message: Message): Promise<TelegramBot.Message | undefined> {
        const {chatId, userId} = this.getIdsFromMessage(message);

        const userDictionary: string[] | null = this.dbService.getUserDictionary(userId);

        console.log('getAllMessagesHandler');
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

    async startLearn(bot: TelegramBot,  message: Message): Promise<TelegramBot.Message | undefined> {
        const {chatId, userId} = this.getIdsFromMessage(message);
        try {

            const userDictionary = this.dbService.getUserDictionary(userId);
            if (!userDictionary || !userDictionary?.length) {
                return bot.sendMessage(
                    chatId,
                    `You are have no words. Please, add some`,
                    REPLY_KEYBOARD_OPTIONS
                );
            }
            this.dbService.setUserStatus(userId, UserStatus.START_LEARN);

            this.scheduleService.startLearnByUserId(bot, userDictionary, userId, chatId);
            return bot.sendMessage(
                chatId,
                `You are in learning. Every 5 seconds you will get 1 word`,
                START_LEARN_KEYBOARD_OPTIONS
            );
        } catch (error: any) {
            return bot.sendMessage(
                chatId,
                `Something went wrong: ${error?.message || ''}. Please, try again`,
                REPLY_KEYBOARD_OPTIONS
            );
        }
    }

    async stopLearn(bot: TelegramBot,  message: Message): Promise<TelegramBot.Message | undefined> {
        const {chatId, userId} = this.getIdsFromMessage(message);
        try {
            this.scheduleService.stopLearnByUserId(userId);

            this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

            return bot.sendMessage(
                chatId,
                `You have been exit from learn mode. Nice work!`,
                REPLY_KEYBOARD_OPTIONS
            );
        } catch (error: any) {
            return bot.sendMessage(
                chatId,
                `Something went wrong: ${error?.message || ''}. Please, try again`,
                REPLY_KEYBOARD_OPTIONS
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
        const dbResponse: DbResponse = this.dbService.writeWordByUserId(userId, message.text || '');
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

        const dbResponse: DbResponse = this.dbService.removeWordByIndexByUserId(userId, numberOfWord - 1);
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

    private getIdsFromMessage(message: Message): {chatId: number, userId: number} {
        if (!message) {
            throw new Error(`getIdsFromMessage: Can't extract ids from message. Message not found.`)
        }
        const chatId = message.chat.id;
        const userId = message.from?.id;

        if (!chatId) {
            throw new Error(`getIdsFromMessage: chatId not found.`)
        }
        if (!userId) {
            throw new Error(`getIdsFromMessage: userId not found.`)
        }

        return {chatId, userId}
    }
}
