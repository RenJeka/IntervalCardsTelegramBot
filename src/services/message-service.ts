import TelegramBot, { CallbackQuery, Message } from 'node-telegram-bot-api';
import { UserStatus } from '../common/enums/userStatus';
import {
    getAddWordKeyboardOptions,
    getRemoveWordKeyboardOptions,
    getFavoriteCategoriesKeyboard,
    getReplyKeyboardOptions,
    getSetIntervalKeyboardOptions,
    getStartLearnKeyboardOptions,
    getRemoveWordsKeyboard,
    getLearningLanguageKeyboard,
    LANGUAGE_KEYBOARD_OPTIONS,
    getConfirmActionKeyboard,
} from '../const/keyboards';
import { DbResponse, DbResponseStatus } from '../common/interfaces/dbResponse';
import { ScheduleService } from './schedule-service';
import { MainReplyKeyboardData } from '../common/enums/mainInlineKeyboard';
import { IDbService } from '../common/interfaces/iDbService';
import {
    UserItemAWS,
    UserStatusSnapshot,
    UserWord,
} from '../common/interfaces/common';
import { CommonHelper } from '../helpers/common-helper';
import { FormatterHelper } from '../helpers/formatter-helper';
import {
    DEFAULT_USER_INTERVAL,
    LANGUAGE_CALLBACK_PREFIX,
    LEARNING_LANGUAGE_CALLBACK_PREFIX,
    DEFAULT_LANGUAGE,
    FAVORITE_CATEGORY_CALLBACK_PREFIX,
    CONFIRM_ACTION_CALLBACK_PREFIX,
} from '../const/common';
import { FAVORITE_CATEGORIES } from '../const/favoriteCategories';
import { LogService } from './log.service';
import { CategoryHelper } from '../helpers/category-helper';
import { t, detectLanguage, getLanguageDisplayName } from './i18n.service';
import { LLMHelper } from '../helpers/llm-helper';
import {
    ADD_USER_ITEM_SEPARATOR,
    PRESET_WORDS_SET_COUNT,
} from '../const/common';
import { SupportedLanguage } from '../common/interfaces/common';

export class MessageService {
    constructor(
        private dbService: IDbService,
        private scheduleService: ScheduleService
    ) {}

    async startMessageHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message> {
        const { chatId, userId } = this.getIdsFromMessage(message);

        // Detect language from Telegram's language_code
        const telegramLangCode = message.from?.language_code;
        const detectedLanguage = detectLanguage(telegramLangCode);

        await this.dbService.initUser(userId, detectedLanguage);

        // Get user's language (might already exist or just created)
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        return bot.sendMessage(
            chatId,
            t('welcome', userLanguage),
            getReplyKeyboardOptions(userLanguage)
        );
    }

    async instructionMessageHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

        const instructionText = [
            t('instruction.title', userLanguage),
            t('instruction.step1', userLanguage, {
                addWordButton: t('buttons.addWord', userLanguage),
            }),
            t('instruction.step2', userLanguage, {
                startLearnButton: t('buttons.startLearn', userLanguage),
            }),
            '',
            t('instruction.info1', userLanguage),
            t('instruction.info2', userLanguage),
            t('instruction.info3', userLanguage, {
                stopLearnButton: t('buttons.stopLearn', userLanguage),
            }),
            t('instruction.info4', userLanguage, {
                stopLearnButton: t('buttons.stopLearn', userLanguage),
            }),
            t('instruction.info5', userLanguage, {
                showAllButton: t('buttons.showAll', userLanguage),
            }),
        ].join('\n');

        return bot.sendMessage(
            chatId,
            instructionText,
            getReplyKeyboardOptions(userLanguage)
        );
    }

    async setIntervalMessageHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        await this.dbService.setUserStatus(userId, UserStatus.SET_INTERVAL);

        const currentUserInterval: number | null =
            await this.dbService.getUserInterval(userId);

        const messageText =
            t('interval.current', userLanguage, {
                interval: currentUserInterval ?? DEFAULT_USER_INTERVAL,
            }) +
            '\n\n' +
            t('interval.prompt', userLanguage);

        return bot.sendMessage(
            chatId,
            messageText,
            getSetIntervalKeyboardOptions(userLanguage)
        );
    }

    async favoriteCategoriesMessageHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);
        await this.dbService.setUserStatus(
            userId,
            UserStatus.FAVORITE_CATEGORIES
        );
        const selectedCategories =
            await this.dbService.getUserFavoriteCategories(userId);
        const selectedCategoriesText = selectedCategories.length
            ? CategoryHelper.getSortedTranslatedCategoriesString(
                  selectedCategories,
                  userLanguage
              )
            : t('favoriteCategories.noCategories', userLanguage);

        return bot.sendMessage(
            chatId,
            t('favoriteCategories.prompt', userLanguage, {
                categories: selectedCategoriesText,
            }),
            getFavoriteCategoriesKeyboard(selectedCategories, userLanguage)
        );
    }

    async myStatusMessageHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message> {
        const { chatId, userId } = this.getIdsFromMessage(message);

        const userLanguage = await this.getUserLanguageOrDefault(userId);

        try {
            const [
                userDictionary,
                currentUserStatus,
                userInterval,
                userFavoriteCategories,
                learningLanguage,
            ] = await Promise.all([
                this.dbService.getUserDictionary(userId),
                this.dbService.getUserStatus(userId),
                this.dbService.getUserInterval(userId),
                this.dbService.getUserFavoriteCategories(userId),
                this.dbService.getLearningLanguage(userId),
            ]);

            const snapshot: UserStatusSnapshot = {
                status: currentUserStatus,
                wordsCount: userDictionary?.length ?? 0,
                intervalHours: userInterval ?? null,
                learningLanguage: learningLanguage ?? null,
                favoriteCategories: userFavoriteCategories ?? null,
            };

            const messageText = FormatterHelper.formatUserStatusSnapshot(
                snapshot,
                userLanguage
            );

            return bot.sendMessage(chatId, messageText, {
                parse_mode: 'MarkdownV2',
            });
        } catch (error: any) {
            return bot.sendMessage(
                chatId,
                t('errors.generic', userLanguage, {
                    error: error?.message || '',
                }),
                getReplyKeyboardOptions(userLanguage)
            );
        }
    }

    async languageMessageHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        await this.dbService.setUserStatus(userId, UserStatus.SET_LANGUAGE);

        const currentLanguageDisplay = getLanguageDisplayName(userLanguage);

        return bot.sendMessage(
            chatId,
            t('language.current', userLanguage, {
                language: currentLanguageDisplay,
            }) +
                '\n\n' +
                t('language.prompt', userLanguage),
            LANGUAGE_KEYBOARD_OPTIONS
        );
    }

    async learningLanguageMessageHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);
        const currentLearningLanguage =
            await this.dbService.getLearningLanguage(userId);

        await this.dbService.setUserStatus(
            userId,
            UserStatus.SET_LEARNING_LANGUAGE
        );

        return bot.sendMessage(
            chatId,
            t('learningLanguage.current', userLanguage, {
                language: t(
                    `learningLanguage.${currentLearningLanguage}`,
                    userLanguage
                ),
            }) +
                '\n\n' +
                t('learningLanguage.prompt', userLanguage),
            getLearningLanguageKeyboard(userLanguage)
        );
    }

    async generalMessageHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message> {
        const { chatId, userId } = this.getIdsFromMessage(message);

        if (!message.text?.trim()) {
            return bot.sendMessage(
                chatId,
                'I did not receive any message from You, Please, try again.'
            );
        }

        const currentUserStatus: UserStatus | null =
            await this.dbService.getUserStatus(userId);

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
                    `Now You are in learning mode. Please, use the keyboard menu to navigate or do action you want.`
                );

            default:
                return await this.startMessageHandler(bot, message);
        }
    }

    async generalCallbackHandler(
        bot: TelegramBot,
        query: CallbackQuery
    ): Promise<TelegramBot.Message> {
        const { chatId, userId } = this.getIdsFromCallbackQuery(query);

        if (!query.data) {
            return bot.sendMessage(
                chatId,
                'I did not receive any data from You, Please, try again.'
            );
        }

        const currentUserStatus: UserStatus | null =
            await this.dbService.getUserStatus(userId);

        if (!currentUserStatus) {
            await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);
        }

        if (query.data.startsWith(LANGUAGE_CALLBACK_PREFIX)) {
            return this.setLanguageHandler(bot, userId, chatId, query.data);
        }

        if (query.data.startsWith(LEARNING_LANGUAGE_CALLBACK_PREFIX)) {
            return this.setLearningLanguageHandler(
                bot,
                userId,
                chatId,
                query.data
            );
        }

        if (query.data.startsWith(FAVORITE_CATEGORY_CALLBACK_PREFIX)) {
            return this.toggleFavoriteCategoryHandler(
                bot,
                userId,
                chatId,
                query.data
            );
        }

        if (query.data.startsWith(CONFIRM_ACTION_CALLBACK_PREFIX)) {
            return this.handleConfirmActionCallback(
                bot,
                userId,
                chatId,
                query.data,
                query.message?.message_id
            );
        }

        switch (currentUserStatus) {
            case UserStatus.REMOVE_WORD:
                return await this.removeParticularWordHandler(
                    bot,
                    userId,
                    chatId,
                    query.data
                );

            case UserStatus.SET_INTERVAL:
                return await this.setParticularIntervalHandler(
                    bot,
                    userId,
                    chatId,
                    query.data
                );

            case UserStatus.SET_LANGUAGE:
                return await this.setLanguageHandler(
                    bot,
                    userId,
                    chatId,
                    query.data
                );

            case UserStatus.SET_LEARNING_LANGUAGE:
                return await this.setLearningLanguageHandler(
                    bot,
                    userId,
                    chatId,
                    query.data
                );

            case UserStatus.FAVORITE_CATEGORIES:
                return await this.toggleFavoriteCategoryHandler(
                    bot,
                    userId,
                    chatId,
                    query.data
                );

            default:
                return await this.startMessageHandler(bot, query.message!);
        }
    }

    async goToMainPage(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message | undefined> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);
        await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

        return bot.sendMessage(
            chatId,
            t('navigation.home', userLanguage),
            getReplyKeyboardOptions(userLanguage)
        );
    }

    async addWordMessageHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message | undefined> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);
        await this.dbService.setUserStatus(userId, UserStatus.ADD_WORD);

        if (!chatId) {
            return;
        }
        return bot.sendMessage(
            chatId,
            t('addWord.prompt', userLanguage),
            getAddWordKeyboardOptions(userLanguage)
        );
    }

    async removeWordMessageHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message | undefined> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        await this.dbService.setUserStatus(userId, UserStatus.REMOVE_WORD);

        try {
            await bot.sendMessage(
                chatId,
                t('removeWord.prompt', userLanguage),
                getRemoveWordsKeyboard(
                    (await this.dbService.getUserDictionary(
                        userId
                    )) as unknown as UserItemAWS[]
                )
            );

            // We can't pass empty message in 'bot.sendMessage' method
            return bot.sendMessage(
                chatId,
                t('removeWord.promptBottom', userLanguage),
                getRemoveWordKeyboardOptions(userLanguage)
            );
        } catch (error: any) {
            return bot.sendMessage(
                chatId,
                t('errors.generic', userLanguage, {
                    error: error?.message || '',
                }),
                getRemoveWordKeyboardOptions(userLanguage)
            );
        }
    }

    async getAllMessagesHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message | undefined> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);
        const userDictionary: UserItemAWS[] =
            await this.dbService.getUserDictionary(userId);
        const userWordsWithTranslations: string[] = userDictionary.map(
            (userItem: UserItemAWS) => {
                return userItem.translation
                    ? `${FormatterHelper.escapeMarkdownV2(userItem.word)} \\-\\-\\- ||${FormatterHelper.escapeMarkdownV2(userItem.translation)}||`
                    : `${FormatterHelper.escapeMarkdownV2(userItem.word)}`;
            }
        );

        if (!userDictionary || !userDictionary.length) {
            return bot.sendMessage(chatId, t('showAll.noWords', userLanguage));
        }

        const titleText = t('showAll.title', userLanguage);
        const escapedTitle = FormatterHelper.escapeMarkdownV2(titleText);

        return bot.sendMessage(
            chatId,
            escapedTitle + '\n ' + userWordsWithTranslations.join(', \n'),
            { parse_mode: 'MarkdownV2' }
        );
    }

    async startLearn(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message | undefined> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);
        try {
            const userItems: UserItemAWS[] =
                await this.dbService.getUserDictionary(userId);
            if (!userItems || !userItems?.length) {
                return bot.sendMessage(
                    chatId,
                    t('learn.noWords', userLanguage),
                    getReplyKeyboardOptions(userLanguage)
                );
            }
            await this.dbService.setUserStatus(userId, UserStatus.START_LEARN);

            const userInterval: number | null =
                (await this.dbService.getUserInterval(userId)) ??
                DEFAULT_USER_INTERVAL;

            await this.scheduleService.startLearnByUserId(
                bot,
                userItems,
                userId,
                userInterval,
                chatId
            );
            return bot.sendMessage(
                chatId,
                t('learn.started', userLanguage, { interval: userInterval }),
                getStartLearnKeyboardOptions(userLanguage)
            );
        } catch (error: any) {
            return bot.sendMessage(
                chatId,
                t('errors.generic', userLanguage, {
                    error: error?.message || '',
                }),
                getReplyKeyboardOptions(userLanguage)
            );
        }
    }

    async stopLearn(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message | undefined> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);
        try {
            this.scheduleService.stopLearnByUserId(userId);

            await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

            return bot.sendMessage(
                chatId,
                t('learn.stopped', userLanguage),
                getReplyKeyboardOptions(userLanguage)
            );
        } catch (error: any) {
            return bot.sendMessage(
                chatId,
                t('errors.generic', userLanguage, {
                    error: error?.message || '',
                }),
                getReplyKeyboardOptions(userLanguage)
            );
        }
    }

    async addWordsSetMessageHandler(
        bot: TelegramBot,
        message: Message
    ): Promise<TelegramBot.Message> {
        const { chatId, userId } = this.getIdsFromMessage(message);
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        return this.requestActionConfirmation(
            bot,
            chatId,
            userId,
            'add_words_set',
            t('addWordsSet.confirm', userLanguage)
        );
    }

    private async addParticularWordHandler(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        message: string = ''
    ): Promise<TelegramBot.Message> {
        const userLanguage = await this.getUserLanguageOrDefault(userId);
        const dbResponse: DbResponse = await this.dbService.writeWordByUserId(
            userId,
            message || ''
        );
        const parsedRawItem = CommonHelper.parseUserRawItem(message);
        let responseMessageText = t('addWord.success', userLanguage, {
            word: FormatterHelper.escapeMarkdownV2(parsedRawItem.word),
        });

        if (parsedRawItem.translation) {
            responseMessageText = t(
                'addWord.successWithTranslation',
                userLanguage,
                {
                    word: parsedRawItem.word,
                    translation: parsedRawItem.translation,
                }
            );
        }

        if (!dbResponse.success) {
            if (dbResponse.status === DbResponseStatus.DUPLICATE_WORD) {
                responseMessageText = t('addWord.duplicate', userLanguage, {
                    word: parsedRawItem.word,
                });
            } else {
                responseMessageText =
                    dbResponse.message || t('addWord.error', userLanguage);
            }
        }
        return bot.sendMessage(
            chatId,
            responseMessageText,
            getAddWordKeyboardOptions(userLanguage)
        );
    }

    private async setParticularIntervalHandler(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        message: string = ''
    ): Promise<TelegramBot.Message> {
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        if (!message) {
            return bot.sendMessage(chatId, t('errors.noMessage', userLanguage));
        }

        const parsedRawItem = parseInt(message);

        if (isNaN(parsedRawItem)) {
            return bot.sendMessage(
                chatId,
                t('errors.noInterval', userLanguage)
            );
        }

        if (parsedRawItem < 1 || parsedRawItem > 12) {
            return bot.sendMessage(
                chatId,
                t('errors.intervalRange', userLanguage)
            );
        }

        try {
            const dbResponse: DbResponse = await this.dbService.setUserInterval(
                userId,
                parsedRawItem
            );

            if (!dbResponse.success) {
                return bot.sendMessage(
                    chatId,
                    dbResponse.message ||
                        '🚫 Something went wrong! Please, try again.'
                );
            }

            await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

            return bot.sendMessage(
                chatId,
                t('interval.set', userLanguage, { interval: parsedRawItem }),
                getReplyKeyboardOptions(userLanguage)
            );
        } catch (error: any) {
            return bot.sendMessage(chatId, t('errors.generic', userLanguage));
        }
    }

    private async removeParticularWordHandler(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        wordId: string
    ): Promise<TelegramBot.Message> {
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        if (!wordId) {
            return bot.sendMessage(
                chatId,
                t('removeWord.noWordId', userLanguage)
            );
        }

        const dbResponse: DbResponse = await this.dbService.removeWordById(
            userId,
            wordId
        );
        let responseMessageText = t('removeWord.success', userLanguage);

        if (!dbResponse.success) {
            if (dbResponse.status === DbResponseStatus.WRONG_INPUT) {
                responseMessageText = t('removeWord.notFound', userLanguage);
            } else {
                responseMessageText =
                    dbResponse.message || t('errors.generic', userLanguage);
            }
        }
        return bot.sendMessage(
            chatId,
            dbResponse.message || responseMessageText,
            {
                parse_mode: 'MarkdownV2',
            }
        );
    }

    private async toggleFavoriteCategoryHandler(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        callbackData: string
    ): Promise<TelegramBot.Message> {
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        if (!callbackData.startsWith(FAVORITE_CATEGORY_CALLBACK_PREFIX)) {
            return bot.sendMessage(
                chatId,
                t('favoriteCategories.unknownCategory', userLanguage)
            );
        }
        const categoryIndex = parseInt(
            callbackData.replace(FAVORITE_CATEGORY_CALLBACK_PREFIX, ''),
            10
        );
        const category = FAVORITE_CATEGORIES[categoryIndex];
        if (!category) {
            return bot.sendMessage(
                chatId,
                t('favoriteCategories.unknownCategory', userLanguage)
            );
        }

        try {
            const currentFavorites =
                await this.dbService.getUserFavoriteCategories(userId);

            if (currentFavorites.includes(category)) {
                await this.dbService.removeUserFavoriteCategory(
                    userId,
                    category
                );
            } else {
                await this.dbService.addUserFavoriteCategory(userId, category);
            }

            const updatedFavorites =
                await this.dbService.getUserFavoriteCategories(userId);
            const selectedCategoriesText = updatedFavorites.length
                ? CategoryHelper.getSortedTranslatedCategoriesString(
                      updatedFavorites,
                      userLanguage
                  )
                : t('favoriteCategories.noCategories', userLanguage);

            return bot.sendMessage(
                chatId,
                t('favoriteCategories.updated', userLanguage, {
                    categories: selectedCategoriesText,
                }),
                getFavoriteCategoriesKeyboard(updatedFavorites, userLanguage)
            );
        } catch (error: any) {
            LogService.error(
                `Error toggling favorite category for user ${userId}:`,
                error
            );
            return bot.sendMessage(
                chatId,
                t('favoriteCategories.error', userLanguage)
            );
        }
    }

    private getIdsFromMessage(message: Message): {
        chatId: number;
        userId: number;
    } {
        if (!message) {
            throw new Error(
                `getIdsFromMessage: Can't extract ids from message. Message not found.`
            );
        }
        const chatId = message.chat.id;
        const userId = message.from?.id;

        if (!chatId) {
            throw new Error(`getIdsFromMessage: chatId not found.`);
        }
        if (!userId) {
            throw new Error(`getIdsFromMessage: userId not found.`);
        }

        return { chatId, userId };
    }

    private getIdsFromCallbackQuery(query: CallbackQuery): {
        chatId: number;
        userId: number;
    } {
        if (!query) {
            throw new Error(
                `getIdsFromMessage: Can't extract ids from query. Query not found.`
            );
        }
        const chatId = query.message?.chat?.id;
        const userId = query.from?.id;

        if (!chatId) {
            throw new Error(`getIdsFromMessage: chatId not found.`);
        }
        if (!userId) {
            throw new Error(`getIdsFromMessage: userId not found.`);
        }

        return { chatId, userId };
    }

    private async getUserLanguageOrDefault(
        userId: number
    ): Promise<SupportedLanguage> {
        const userLanguage = await this.dbService.getUserLanguage(userId);
        return (userLanguage as SupportedLanguage) || DEFAULT_LANGUAGE;
    }

    private async setLanguageHandler(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        callbackData: string
    ): Promise<TelegramBot.Message> {
        if (!callbackData.startsWith(LANGUAGE_CALLBACK_PREFIX)) {
            const userLanguage = await this.getUserLanguageOrDefault(userId);
            return bot.sendMessage(chatId, t('errors.noData', userLanguage));
        }

        const selectedLanguage = callbackData.replace(
            LANGUAGE_CALLBACK_PREFIX,
            ''
        ) as SupportedLanguage;

        try {
            await this.dbService.setUserLanguage(userId, selectedLanguage);
            await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

            return bot.sendMessage(
                chatId,
                t('language.changed', selectedLanguage),
                getReplyKeyboardOptions(selectedLanguage)
            );
        } catch (error: any) {
            LogService.error(
                `Error setting language for user ${userId}:`,
                error
            );
            const userLanguage = await this.getUserLanguageOrDefault(userId);
            return bot.sendMessage(
                chatId,
                t('errors.generic', userLanguage, {
                    error: error?.message || '',
                })
            );
        }
    }

    private async setLearningLanguageHandler(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        callbackData: string
    ): Promise<TelegramBot.Message> {
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        if (!callbackData.startsWith(LEARNING_LANGUAGE_CALLBACK_PREFIX)) {
            return bot.sendMessage(chatId, t('errors.noData', userLanguage));
        }

        const selectedLanguage = callbackData.replace(
            LEARNING_LANGUAGE_CALLBACK_PREFIX,
            ''
        );

        try {
            await this.dbService.setLearningLanguage(userId, selectedLanguage);
            await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

            return bot.sendMessage(
                chatId,
                t('learningLanguage.set', userLanguage, {
                    language: t(
                        `learningLanguage.${selectedLanguage}`,
                        userLanguage
                    ),
                }),
                getReplyKeyboardOptions(userLanguage)
            );
        } catch (error: any) {
            LogService.error(
                `Error setting learning language for user ${userId}:`,
                error
            );
            return bot.sendMessage(
                chatId,
                t('errors.generic', userLanguage, {
                    error: error?.message || '',
                })
            );
        }
    }

    /**
     * Generic confirmation request
     */
    async requestActionConfirmation(
        bot: TelegramBot,
        chatId: number,
        userId: number,
        actionKey: string,
        text: string
    ): Promise<TelegramBot.Message> {
        const userLanguage = await this.getUserLanguageOrDefault(userId);
        await this.dbService.setUserStatus(userId, UserStatus.CONFIRM_ACTION);
        return bot.sendMessage(
            chatId,
            text,
            getConfirmActionKeyboard(actionKey, userLanguage)
        );
    }

    /**
     * Handle confirmation callback (YES/NO)
     */
    private async handleConfirmActionCallback(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        callbackData: string,
        messageId?: number
    ): Promise<TelegramBot.Message> {
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        if (!callbackData.startsWith(CONFIRM_ACTION_CALLBACK_PREFIX)) {
            return bot.sendMessage(chatId, t('errors.noData', userLanguage));
        }

        // Parse: "confirm_action:yes:actionKey" or "confirm_action:no:actionKey"
        const withoutPrefix = callbackData.replace(
            CONFIRM_ACTION_CALLBACK_PREFIX,
            ''
        );
        const [yesOrNo, actionKey] = withoutPrefix.split(':');

        if (yesOrNo === 'no') {
            // Cancel action
            await this.dbService.setUserStatus(userId, UserStatus.DEFAULT);

            if (messageId) {
                try {
                    await bot.editMessageText(
                        t('confirmation.cancelled', userLanguage),
                        {
                            chat_id: chatId,
                            message_id: messageId,
                        }
                    );
                } catch (error: any) {
                    LogService.error('Error editing message on cancel:', error);
                }
            }

            return bot.sendMessage(
                chatId,
                t('navigation.home', userLanguage),
                getReplyKeyboardOptions(userLanguage)
            );
        }

        if (yesOrNo === 'yes') {
            return this.dispatchConfirmedAction(
                bot,
                userId,
                chatId,
                actionKey,
                messageId
            );
        }

        return bot.sendMessage(chatId, t('errors.noData', userLanguage));
    }

    /**
     * Dispatch confirmed action by actionKey
     */
    private async dispatchConfirmedAction(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        actionKey: string,
        messageId?: number
    ): Promise<TelegramBot.Message> {
        const userLanguage = await this.getUserLanguageOrDefault(userId);

        switch (actionKey) {
            case 'add_words_set':
                return this.generateAndAddWordsSet(
                    bot,
                    userId,
                    chatId,
                    messageId
                );
            default:
                LogService.error(`Unknown action key: ${actionKey}`);
                return bot.sendMessage(
                    chatId,
                    t('errors.generic', userLanguage, {
                        error: 'Unknown action',
                    }),
                    getReplyKeyboardOptions(userLanguage)
                );
        }
    }

    private async generateAndAddWordsSet(
        bot: TelegramBot,
        userId: number,
        chatId: number,
        messageId?: number
    ): Promise<TelegramBot.Message> {
        const userLanguage = await this.getUserLanguageOrDefault(userId);
        try {
            // Inform user about start
            await bot.sendMessage(
                chatId,
                t('addWordsSet.generating', userLanguage)
            );

            const learningLanguage =
                await this.dbService.getLearningLanguage(userId);

            const favoriteCategories =
                await this.dbService.getUserFavoriteCategories(userId);

            // Determine categories to use
            let categoriesToUse = favoriteCategories;
            if (!categoriesToUse || categoriesToUse.length === 0) {
                // If no favorites, pick random ones from available
                categoriesToUse = [...FAVORITE_CATEGORIES]
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);
            }

            // Get existing words for exclusion
            const existingWords =
                await this.dbService.getFlatUserDictionary(userId);

            // Generate words
            const result = await LLMHelper.generateWordSet({
                categories: categoriesToUse,
                learningLanguage,
                nativeLanguage: userLanguage,
                count: PRESET_WORDS_SET_COUNT,
                excludedWords: existingWords,
            });

            // Add words to DB
            let addedCount = 0;
            for (const item of result.words) {
                const wordWithTranslation = `${item.word} ${ADD_USER_ITEM_SEPARATOR} ${item.translation}`;
                const response = await this.dbService.writeWordByUserId(
                    userId,
                    wordWithTranslation
                );
                if (response.success) {
                    addedCount++;
                }
            }

            // Send success message
            if (addedCount >= PRESET_WORDS_SET_COUNT) {
                // Allow >= just in case
                return bot.sendMessage(
                    chatId,
                    t('addWordsSet.success', userLanguage, {
                        count: addedCount,
                    }),
                    getReplyKeyboardOptions(userLanguage)
                );
            } else {
                return bot.sendMessage(
                    chatId,
                    t('addWordsSet.partial', userLanguage, {
                        count: addedCount,
                        total: PRESET_WORDS_SET_COUNT,
                    }),
                    getReplyKeyboardOptions(userLanguage)
                );
            }

            LogService.info(
                `Generated and added ${addedCount} words for user ${userId}`
            );
        } catch (error) {
            LogService.error('Error in generateAndAddWordsSet', error);
            return bot.sendMessage(
                chatId,
                t('addWordsSet.error', userLanguage),
                getReplyKeyboardOptions(userLanguage)
            );
        }
    }
}
