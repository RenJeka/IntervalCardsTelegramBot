import {DbResponse} from "./dbResponse";
import {UserWord} from "./common";
import {UserStatus} from "../enums/userStatus";

// export interface IDbService {
//     writeWordByUserId(userId: number, word: string): DbResponse | Promise<DbResponse>;
//     removeWordById(userId: number, wordId: string): DbResponse | Promise<DbResponse>;
//     setUserStatus(userId: number, userStatus: UserStatus): void | Promise<void>;
//     getUserStatus(userId?: number): UserStatus | null | Promise<UserStatus | null>;
//     getUserDictionary(userId: number): UserWord[] | Promise<UserWord[]>;
//     getFlatUserDictionary(userId: number): string[] | Promise<string[]>;
//     checkIsUserExist(userId: number): boolean | Promise<boolean>;
// }

export interface IDbService {
    writeWordByUserId(userId: number, word: string): DbResponse;
    removeWordById(userId: number, wordId: string): DbResponse ;
    setUserStatus(userId: number, userStatus: UserStatus): void ;
    getUserStatus(userId?: number): UserStatus | null;
    getUserDictionary(userId: number): UserWord[];
    getFlatUserDictionary(userId: number): string[] | Promise<string[]>;
    checkIsUserExist(userId: number): boolean;
}
