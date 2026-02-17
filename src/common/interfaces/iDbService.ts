import { DbResponse } from './dbResponse';
import { UserItemAWS } from './common';
import { UserStatus } from '../enums/userStatus';
import { UserDataAWS } from './common';

export interface IDbService {
    initUser(userId: number, languageCode?: string): Promise<void>;
    writeWordByUserId(
        userId: number,
        word: string,
        checkDuplicates?: boolean
    ): Promise<DbResponse>;
    removeWordById(userId: number, wordId: string): Promise<DbResponse>;
    setUserStatus(userId: number, userStatus: UserStatus): Promise<DbResponse>;
    getUserStatus(userId?: number): Promise<UserStatus | null>;
    setUserInterval(userId: number, interval: number): Promise<DbResponse>;
    getUserInterval(userId: number): Promise<number | null>;
    setUserLanguage(userId: number, language: string): Promise<DbResponse>;
    getUserLanguage(userId: number): Promise<string | null>;
    setLearningLanguage(userId: number, language: string): Promise<DbResponse>;
    getLearningLanguage(userId: number): Promise<string>;
    addUserFavoriteCategory(
        userId: number,
        category: string
    ): Promise<DbResponse>;
    removeUserFavoriteCategory(
        userId: number,
        category: string
    ): Promise<DbResponse>;
    getUserFavoriteCategories(userId: number): Promise<string[]>;
    getUserDictionary(userId: number): Promise<UserItemAWS[]>;
    getFlatUserDictionary(userId: number): Promise<string[]>;
    getAllUsersWithStatus(userStatus: UserStatus): Promise<UserDataAWS[]>;
    checkIsUserExist(userId: number): Promise<boolean>;
}
