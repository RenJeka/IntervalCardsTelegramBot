import { DbResponse } from "./dbResponse";
import { UserItemAWS } from "./common";
import { UserStatus } from "../enums/userStatus";
import { UserDataAWS } from "./common";

export interface IDbService {
    initUser(userId: number): Promise<void>;
    writeWordByUserId(userId: number, word: string): Promise<DbResponse>;
    removeWordById(userId: number, wordId: string): Promise<DbResponse>;
    setUserStatus(userId: number, userStatus: UserStatus): Promise<DbResponse>;
    getUserStatus(userId?: number): Promise<UserStatus | null>;
    setUserInterval(userId: number, interval: number): Promise<DbResponse>;
    getUserInterval(userId: number): Promise<number | null>;
    addUserFavoriteCategory(userId: number, category: string): Promise<DbResponse>;
    removeUserFavoriteCategory(userId: number, category: string): Promise<DbResponse>;
    getUserFavoriteCategories(userId: number): Promise<string[]>;
    getUserDictionary(userId: number): Promise<UserItemAWS[]>;
    getFlatUserDictionary(userId: number): Promise<string[]>;
    getAllUsersWithStatus(userStatus: UserStatus): Promise<UserDataAWS[]>;
    checkIsUserExist(userId: number): Promise<boolean>;
}
