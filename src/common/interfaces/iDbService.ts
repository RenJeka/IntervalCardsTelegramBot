import {DbResponse} from "./dbResponse";
import {UserWordAWS} from "./common";
import {UserStatus} from "../enums/userStatus";

export interface IDbService {
    writeWordByUserId(userId: number, word: string): Promise<DbResponse>;
    removeWordById(userId: number, wordId: string): Promise<DbResponse>;
    setUserStatus(userId: number, userStatus: UserStatus): void ;
    getUserStatus(userId?: number): UserStatus | null;
    getUserDictionary(userId: number): Promise<UserWordAWS[]>;
    getFlatUserDictionary(userId: number): Promise<string[]>;
    checkIsUserExist(userId: number): boolean;
}
