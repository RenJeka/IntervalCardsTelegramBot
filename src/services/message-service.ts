import TelegramBot, { CallbackQuery, Message } from "node-telegram-bot-api";
import { DbService } from "./db-service";
import { UserStatus } from "../common/enums/userStatus";
import {
    ADD_WORD_KEYBOARD_OPTIONS,
    REMOVE_WORD_KEYBOARD_OPTIONS,
    REPLY_KEYBOARD_OPTIONS,
    START_LEARN_KEYBOARD_OPTIONS,
    getRemoveWordsKeyboard,
} from "../const/keyboards";
import { DbResponse, DbResponseStatus } from "../common/interfaces/dbResponse";
import { ScheduleService } from "./schedule-service";
import { MainReplyKeyboardData } from "../common/enums/mainInlineKeyboard";

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
            `Welcome to the IntervalCards Telegram Bot! \n  Here you will can add words and receive messages with random word from your words periodically.\n  Please, use '☰ Menu' ➼ '/instruction' for more information`,
            REPLY_KEYBOARD_OPTIONS
        );
    }

    async instructionMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message> {
        const {chatId, userId} = this.getIdsFromMessage(message);

        this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

        return bot.sendMessage(
            chatId,
            `
            This bot helps you to learn words:
            1. Firstly, add several words You wand to learn (use the '${MainReplyKeyboardData.ADD_WORD}' button).
            2. Press '${MainReplyKeyboardData.START_LEARN}' button to start learning process.
            
            ⦿ Every 1 hour You will get 1 word from your words while you in the learning process.
            ⦿ This will continue from 9:00 (9:00 a.m.) to 22:00 (10:00 p.m.).
            ⦿ If you want to stop learn — just press '${MainReplyKeyboardData.STOP_LEARN}' button.
            ⦿ If you wan to remove word — go out from learning mode, press '${MainReplyKeyboardData.STOP_LEARN}' button, remove unnecessary words and start learning mode again.
            ⦿ You can get all of your word by pressing '${MainReplyKeyboardData.SHOW_ALL}' button.
            `,
            REPLY_KEYBOARD_OPTIONS
        );
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

            case UserStatus.START_LEARN:
                return bot.sendMessage(
                    chatId,
                    `Now You are in learning mode. Please, use the keyboard menu to navigate or do action you want.`,
                );

            default:
                return await this.startMessageHandler(bot, message);
        }
    }

    async generalCallbackHandler(bot: TelegramBot, query: CallbackQuery): Promise<TelegramBot.Message> {
        const {chatId, userId} = this.getIdsFromCallbackQuery(query);

        if (!query.data) {
            return bot.sendMessage(
                chatId,
                'I did not receive any data from You, Please, try again.',
            );
        }

        const currentUserStatus: UserStatus | null = this.dbService.getUserStatus(userId);

        if (!currentUserStatus) {
            this.dbService.setUserStatus(userId, UserStatus.DEFAULT);
        }

        switch (currentUserStatus) {
            case UserStatus.REMOVE_WORD:

                return this.removeParticularWordHandler(
                    bot,
                    userId,
                    chatId,
                    query.data
                );

            default:
                return await this.startMessageHandler(bot, query.message!);
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

            await bot.sendMessage(
                chatId,
                `Please, chose the word You want to delete \n ⬇️⬇️⬇️`,
                getRemoveWordsKeyboard(this.dbService.getUserDictionary(userId))
            );

            // We can't pass empty message in  'bot.sendMessage' method
            return bot.sendMessage(
                chatId,
                '⬆️⬆️⬆️\n Chose word to delete and press it!',
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

        const userDictionary: string[] = this.dbService.getFlatUserDictionary(userId);

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

            const userDictionary = this.dbService.getFlatUserDictionary(userId);
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
                `You are in learning. Every hour You will get 1 word. This will continue from 9:00 (9:00 a.m.) to 22:00 (10:00 p.m.)`,
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
        wordId: string
    ):  Promise<TelegramBot.Message> {

        console.log('removeParticularWordHandler. wordId: ', wordId);
        if (!wordId) {
            return bot.sendMessage(
                chatId,
                `Word didn't find`,
            );
        }

        const dbResponse: DbResponse = this.dbService.removeWordById(userId, wordId);
        let responseMessageText = `The word has been deleted successfully. You can delete more!`;

        if (!dbResponse.success) {
            if (dbResponse.status === DbResponseStatus.WRONG_INPUT) {
                responseMessageText = `The word with number hasn't been find. Please, try again`;
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

    private getIdsFromCallbackQuery(query: CallbackQuery): {chatId: number, userId: number} {
        if (!query) {
            throw new Error(`getIdsFromMessage: Can't extract ids from query. Query not found.`)
        }
        const chatId = query.message?.chat?.id;
        const userId = query.from?.id;

        if (!chatId) {
            throw new Error(`getIdsFromMessage: chatId not found.`)
        }
        if (!userId) {
            throw new Error(`getIdsFromMessage: userId not found.`)
        }

        return {chatId, userId}
    }
}
