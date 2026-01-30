import * as fs from "fs";
import * as util from "node:util";
import { UserData, UserDb, UserWord } from "../common/interfaces/common";
import { UserStatus } from "../common/enums/userStatus";
import path from "path";
import { DbResponse, DbResponseStatus } from "../common/interfaces/dbResponse";
import { ValidateHelper } from "../helpers/validate-helper";
import { writeFileSync } from "fs";
import { randomUUID } from "crypto";
import { IDbService } from "../common/interfaces/iDbService";
import { LogService } from "./log.service";

/**
 * @deprecated
 */
export class DbLocalService {

    constructor() {
        this.initDb();
    }

    private DB_DIRECTORY_NAME = 'db';
    private DB_NAME = 'userDb.json';
    private DB_PATH = path.join('./', this.DB_DIRECTORY_NAME, this.DB_NAME);

    writeWordByUserId(userId: number, word: string): DbResponse {
        try {
            const currentUser: UserData | null = this.getUserById(userId);

            if (!currentUser) {
                throw new Error(`Can't find user by id: ${userId}`)
            }

            if (ValidateHelper.checkDuplicate(currentUser.dictionary, word)) {
                return {
                    success: false,
                    status: DbResponseStatus.DUPLICATE_WORD,
                    message: `Duplicate word:  '${word}'`
                }
            }

            const currentUserWord: UserWord = {
                id: randomUUID() as string,
                text: word
            }
            currentUser.dictionary.push(currentUserWord);
            this.addUserDataToDb(currentUser);

            return {
                success: true,
                status: DbResponseStatus.OK,
                message: `Word '${word}' has been written successfully`
            }

        } catch (error: any) {
            return {
                success: false,
                status: DbResponseStatus.DB_ERROR,
                message: error.message ? error.message : 'Something wrong while writing word to DB'
            }
        }
    }

    removeWordById(userId: number, wordId: string): DbResponse {
        try {
            const currentUser: UserData | null = this.getUserById(userId);

            if (!currentUser) {
                throw new Error(`❌️Can't find user by id: ${userId}`)
            }

            const wordIndex = currentUser.dictionary.findIndex(userWord => userWord.id === wordId);

            if (wordIndex !== -1) {
                const deletingWord = currentUser.dictionary[wordIndex].text;
                // TODO: implements deleting via DBService
                currentUser.dictionary.splice(wordIndex, 1);
                this.addUserDataToDb(currentUser);
                return {
                    success: true,
                    status: DbResponseStatus.OK,
                    message: `✔️ Word '${deletingWord}' has been deleting successfully`
                }
            }

            return {
                success: false,
                status: DbResponseStatus.WRONG_INPUT,
                message: `❌️Incorrect word's index`
            }

        } catch (error: any) {
            return {
                success: false,
                status: DbResponseStatus.DB_ERROR,
                message: error.message ? error.message : '❌️Something wrong while deleting word from DB'
            }
        }
    }

    setUserStatus(userId: number, userStatus: UserStatus = UserStatus.DEFAULT) {
        if (!this.checkIsUserExist(userId)) {
            this.initUser(userId);
        }

        const userDb: UserDb = this.getUserDb();
        const currentUser = userDb.userData.find((userData: UserData) => {
            return userData.id === userId;
        });

        if (currentUser) {
            currentUser.status = userStatus;
            this.addUserDataToDb(currentUser);
        } else {
            LogService.error(`setUserStatus: no user with id '${userId}' found`)
        }
    }

    getUserStatus(userId?: number): UserStatus | null {
        if (!userId) {
            return null;
        }
        const userDb: UserDb = this.getUserDb();
        const currentUserData = userDb.userData.find((userData: UserData) => userData.id === userId)
        if (!currentUserData) {
            return null;
        }
        return currentUserData.status
    }

    getUserDictionary(userId: number): UserWord[] {
        if (!userId) {
            return [];
        }

        const userDb = this.getUserDb();
        const currentUser: UserData | undefined = userDb.userData.find((userData: UserData) => userData.id === userId);

        if (!currentUser) {
            return [];
        }

        return [...currentUser.dictionary];
    }

    getFlatUserDictionary(userId: number): string[] {
        return this.getUserDictionary(userId).map(word => word.text);
    }

    checkIsUserExist(userId: number): boolean {
        if (typeof userId !== 'number') {
            return false;
        }
        const currentUser = this.getUserById(userId);
        return !!currentUser;
    }

    private initDb() {
        fs.exists(this.DB_PATH, (isDbExist: boolean) => {
            if (!isDbExist) {
                if (!fs.existsSync(this.DB_DIRECTORY_NAME)) {
                    fs.mkdirSync(this.DB_DIRECTORY_NAME);
                }

                const userDB: UserDb = {
                    userData: []
                }
                this.writeJSON(userDB);
            }
        })
    }

    private initUser(userId: number) {
        if (this.checkIsUserExist(userId)) {
            return
        }
        this.addUserDataToDb({
            id: userId,
            status: UserStatus.DEFAULT,
            dictionary: []
        })
    }

    private writeJSON(userDb: UserDb) {
        try {
            writeFileSync(this.DB_PATH, util.format('%j', userDb), { flag: 'w+' })
        } catch (err) {
            throw err
        }
    }

    private getUserDb(): UserDb {
        try {
            const data = fs.readFileSync(this.DB_PATH, { encoding: 'utf-8' });
            return JSON.parse(data) as UserDb
        } catch (error) {
            throw new Error(`Something wrong while reading file. Error: ${LogService.safeStringify(error)}`)
        }
    }

    private getUserById(userId: number): UserData | null {
        try {
            const db: UserDb = this.getUserDb();
            return db.userData.find(user => user.id === userId) || null
        } catch (error) {
            throw error;
        }
    }

    private addUserDataToDb(currentUser: UserData) {
        const db: UserDb = this.getUserDb();
        const currentUserCopy: UserData = JSON.parse(JSON.stringify(currentUser));
        const currentUserIndex = db.userData.findIndex(user => user.id === currentUser.id);

        if (currentUserIndex < 0) {
            db.userData.push(currentUserCopy);
        } else {
            db.userData[currentUserIndex] = currentUserCopy;
        }

        this.writeJSON(db);
    }
}
