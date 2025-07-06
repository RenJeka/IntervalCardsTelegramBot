import {DbResponse} from "./dbResponse";
import {UserItemAWS} from "./common";
import {UserStatus} from "../enums/userStatus";

export interface IDbService {
    writeWordByUserId(userId: number, word: string): Promise<DbResponse>;
    removeWordById(userId: number, wordId: string): Promise<DbResponse>;
    setUserStatus(userId: number, userStatus: UserStatus): Promise<DbResponse>;
    getUserStatus(userId?: number): Promise<UserStatus | null>;
    setUserInterval(userId: number, interval: number): Promise<DbResponse>;
    getUserInterval(userId: number): Promise<number | null>;
    getUserDictionary(userId: number): Promise<UserItemAWS[]>;
    getFlatUserDictionary(userId: number): Promise<string[]>;
    checkIsUserExist(userId: number): boolean;
}
