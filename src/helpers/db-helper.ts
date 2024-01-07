import * as fs from "fs";
import * as util from "node:util";
import { UserData, UserDb } from "../common/interfaces/common";
import { UserStatus } from "../common/enums/userStatus";
import path from "path";

export class DbHelper {

    constructor() {
        this.initDb();
    }

    readonly DB_DIRECTORY_NAME = 'db';
    readonly DB_NAME = 'userDb.json';
    readonly DB_PATH = path.join('./', this.DB_DIRECTORY_NAME, this.DB_NAME);

    writeWordByUserId( userId: number, word: string) {

        fs.exists (this.DB_PATH, (isFileExist: boolean) => {

            if (!isFileExist) {
                this.initDb();
            }

            fs.readFile(this.DB_PATH, {encoding: 'utf-8'}, (err, data) => {
                if (err) {
                    console.error('File can\'t be opened!: ', err);
                    return;

                }

                const newUserDb = this.addUserWordToUserDb(userId, word, JSON.parse(data))
                this.writeJSON(newUserDb);
            });
        })
    }

    changeUserStatus(userId: number, userStatus: UserStatus = UserStatus.DEFAULT) {
        fs.exists (this.DB_PATH, (isFileExist: boolean) => {

            if (!isFileExist) {
                this.initDb();
            }

            fs.readFile(this.DB_PATH, {encoding: 'utf-8'}, (err, data) => {
                if (err) {
                    console.error('File can\'t be opened!: ', err);
                    return;
                }

                const newUserDb = this.addUserStatusToUserDb(userId, userStatus, JSON.parse(data))
                this.writeJSON(newUserDb);
            })
        })
    }

    private addUserWordToUserDb(userId: number, word: string, userDb?: UserDb): UserDb {

        if (!userDb || !userDb.userData?.length) {
            return {
                userData: [
                    {id: userId, status: UserStatus.DEFAULT, dictionary: [word]}
                ]
            }
        }

        const userDbClone = JSON.parse(JSON.stringify(userDb));
        const currentUserIndex = userDbClone.userData.findIndex((userData: UserData) => {
            return userData.id === userId;
        });

        userDbClone.userData[currentUserIndex].dictionary.push(word);

        return userDbClone;
    }

    private addUserStatusToUserDb(userId: number, status: UserStatus = UserStatus.DEFAULT, userDb?: UserDb): UserDb {

        if (!userDb || !userDb.userData?.length) {
            return {
                userData: [
                    {id: userId, status: UserStatus.DEFAULT, dictionary: []}
                ]
            }
        }

        const userDbClone = JSON.parse(JSON.stringify(userDb));
        const currentUserIndex = userDbClone.userData.findIndex((userData: UserData) => {
            return userData.id === userId;
        });


        console.log('currentUserIndex: ', currentUserIndex);
        console.log('currentUserIndex: ', currentUserIndex);
        userDbClone.userData[currentUserIndex].status = status;
        return userDbClone;
    }

    private writeJSON(userDb: UserDb) {
        fs.writeFile(this.DB_PATH, util.format('%j', userDb), {flag: 'w+'}, (err) => {
            if (err) {
                console.error(`Something wrong while writing file. The file ${this.DB_PATH} wouldn't be written. Error: `, err);
                return;
            }

            console.log(`The file ${this.DB_PATH} successfully has been written!`);
        })
    }

    private initDb(userData?: UserData) {
        fs.exists (this.DB_PATH, (isDbExist: boolean) => {
            if (!isDbExist) {
                if (!fs.existsSync(this.DB_DIRECTORY_NAME)) {
                    fs.mkdirSync(this.DB_DIRECTORY_NAME);
                }

                const userDB: UserDb = {
                    userData: userData ? [userData] : []
                }
                this.writeJSON(userDB);
            }
        })
    }
}