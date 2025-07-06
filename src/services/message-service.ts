import TelegramBot, {CallbackQuery, Message} from "node-telegram-bot-api";
import {UserStatus} from "../common/enums/userStatus";
import {
    ADD_WORD_KEYBOARD_OPTIONS,
    REMOVE_WORD_KEYBOARD_OPTIONS,
    REPLY_KEYBOARD_OPTIONS,
    START_LEARN_KEYBOARD_OPTIONS,
    getRemoveWordsKeyboard,
} from "../const/keyboards";
import {DbResponse, DbResponseStatus} from "../common/interfaces/dbResponse";
import {ScheduleService} from "./schedule-service";
import {MainReplyKeyboardData} from "../common/enums/mainInlineKeyboard";
import {IDbService} from "../common/interfaces/iDbService";
import {UserWord, UserItemAWS} from "../common/interfaces/common";
import {CommonHelper} from "../helpers/common-helper";
import {FormatterHelper} from "../helpers/formatter-helper";

export class MessageService {

    constructor(
        private dbService: IDbService,
        private scheduleService: ScheduleService,
    ) {
    }

    async startMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message> {
        const {chatId, userId} = this.getIdsFromMessage(message);

        this.dbService.setUserInterval(userId, 1);

        const userInterval: number | null = await this.dbService.getUserInterval(userId);

        // console.log('userInterval', userInterval);

        await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);
        await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

        return bot.sendMessage(
            chatId,
            `Welcome to the IntervalCards Telegram Bot! \n  Here you will can add words and receive messages with random word from your words periodically.\n  Please, use '☰ Menu' ➼ '/instruction' for more information \n  If you wish to add word — please go to 'Add word' menu.`,
            REPLY_KEYBOARD_OPTIONS
        );
    }

    async instructionMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message> {
        const {chatId, userId} = this.getIdsFromMessage(message);

        await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

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

        if (!message.text?.trim()) {
            return bot.sendMessage(
                chatId,
                'I did not receive any message from You, Please, try again.',
            );
        }

        const currentUserStatus: UserStatus | null = await this.dbService.getUserStatus(userId);

        if (!currentUserStatus) {
            await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);
        }

        switch (currentUserStatus) {
            case UserStatus.ADD_WORD:
                return await this.addParticularWordHandler(
                    bot,
                    userId,
                    chatId,
                    message.text
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

        const currentUserStatus: UserStatus | null = await this.dbService.getUserStatus(userId);

        if (!currentUserStatus) {
            await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);
        }

        switch (currentUserStatus) {
            case UserStatus.REMOVE_WORD:
                return await this.removeParticularWordHandler(
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
        await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

        return bot.sendMessage(
            chatId,
            'You are on the \'Home page\'',
            REPLY_KEYBOARD_OPTIONS
        );
    }

    async addWordMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message | undefined> {

        const {chatId, userId} = this.getIdsFromMessage(message);
        await this.dbService.setUserStatus(userId, UserStatus.ADD_WORD);

        if (!chatId) {
            return;
        }
        return bot.sendMessage(
            chatId,
            `
Please, type your word and press 'Enter' or send button.
You can add translation via  <code>/</code>  separator`,
            ADD_WORD_KEYBOARD_OPTIONS
        );
    }

    async removeWordMessageHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message | undefined> {

        const {chatId, userId} = this.getIdsFromMessage(message);

        await this.dbService.setUserStatus(userId, UserStatus.REMOVE_WORD)

        try {

            await bot.sendMessage(
                chatId,
                `Please, chose the word You want to delete \n ⬇️⬇️⬇️`,
                getRemoveWordsKeyboard((await this.dbService.getUserDictionary(userId)) as unknown as UserItemAWS[])
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

    async getAllMessagesHandler(bot: TelegramBot, message: Message): Promise<TelegramBot.Message | undefined> {
        const {chatId, userId} = this.getIdsFromMessage(message);
        const userDictionary: UserItemAWS[] = await this.dbService.getUserDictionary(userId);
        const userWordsWithTranslations: string[] = userDictionary.map((userItem: UserItemAWS) => {
            return userItem.translation
                ? `${FormatterHelper.escapeMarkdownV2(userItem.word)} \\-\\-\\- ||${FormatterHelper.escapeMarkdownV2(userItem.translation)}||`
                : `${FormatterHelper.escapeMarkdownV2(userItem.word)}`
        });

        if (!userDictionary || !userDictionary.length) {
            return bot.sendMessage(
                chatId,
                'You have no words yet. Try to add some.',
            );
        }
        return bot.sendMessage(
            chatId,
            `Your words:\n ${userWordsWithTranslations.join(', \n')}`,
            {parse_mode: 'MarkdownV2'}
        );
    }

    async startLearn(bot: TelegramBot, message: Message): Promise<TelegramBot.Message | undefined> {
        const {chatId, userId} = this.getIdsFromMessage(message);
        try {

            const userItems: UserItemAWS[] = await this.dbService.getUserDictionary(userId);
            if (!userItems || !userItems?.length) {
                return bot.sendMessage(
                    chatId,
                    `You are have no words. Please, add some`,
                    REPLY_KEYBOARD_OPTIONS
                );
            }
            await this.dbService.setUserStatus(userId, UserStatus.START_LEARN);

            this.scheduleService.startLearnByUserId(bot, userItems, userId, chatId);
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

    async stopLearn(bot: TelegramBot, message: Message): Promise<TelegramBot.Message | undefined> {
        const {chatId, userId} = this.getIdsFromMessage(message);
        try {
            this.scheduleService.stopLearnByUserId(userId);

            await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

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

    private async addParticularWordHandler(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        message: string = ''
    ): Promise<TelegramBot.Message> {
        const dbResponse: DbResponse = await this.dbService.writeWordByUserId(userId, message || '');
        const parsedRawItem = CommonHelper.parseUserRawItem(message);
        let responseMessageText = `✅ The word <b> <u>${parsedRawItem.word}</u></b> has been added. You can add more!`;

        if (parsedRawItem.translation) {
            responseMessageText = `✅ The word <b> <u>${parsedRawItem.word}</u></b> with translation <b> <u>${parsedRawItem.translation}</u></b> has been added. You can add more!`;
        }

        if (!dbResponse.success) {
            if (dbResponse.status === DbResponseStatus.DUPLICATE_WORD) {
                responseMessageText = `🚫 The word <b> <u>${parsedRawItem.word}</u></b> already exist. Please, send other word.`;
            } else {
                responseMessageText = dbResponse.message || '🚫 Something went wrong! Please, try again.'
            }
        }
        return bot.sendMessage(
            chatId,
            responseMessageText,
            ADD_WORD_KEYBOARD_OPTIONS
        );
    }


    private async removeParticularWordHandler(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        wordId: string
    ): Promise<TelegramBot.Message> {

        if (!wordId) {
            return bot.sendMessage(
                chatId,
                `Word didn't find`,
            );
        }

        const dbResponse: DbResponse = await this.dbService.removeWordById(userId, wordId);
        let responseMessageText = `✅ The word has been deleted successfully. You can delete more!`;

        if (!dbResponse.success) {
            if (dbResponse.status === DbResponseStatus.WRONG_INPUT) {
                responseMessageText = `🚫 The word with number hasn't been find. Please, try again`;
            }
            responseMessageText = dbResponse.message || '🚫 Something went wrong! Please, try again.'
        }
        return bot.sendMessage(
            chatId,
            dbResponse.message || responseMessageText,
            {parse_mode: 'MarkdownV2'}
        );
    }

    private getIdsFromMessage(message: Message): { chatId: number, userId: number } {
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

    private getIdsFromCallbackQuery(query: CallbackQuery): { chatId: number, userId: number } {
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
