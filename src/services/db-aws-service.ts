import * as fs from "fs";
import * as util from "node:util";
import {UserData, UserDb, UserWord, UserWordAWS} from "../common/interfaces/common";
import {UserStatus} from "../common/enums/userStatus";
import {DbResponse, DbResponseStatus} from "../common/interfaces/dbResponse";
import {writeFileSync} from "fs";
import {IDbService} from "../common/interfaces/iDbService";
import path from "path";
import {
    DynamoDBClient,
    ListTablesCommand,
    PutItemCommand,
    ScanCommand,
    DynamoDBClientConfig,
    PutItemCommandInput,
    ScanCommandInput,
    ScanCommandOutput,
    DeleteItemCommand,
    DeleteItemCommandInput,
    GetItemInput,
    GetItemCommand,
    GetItemCommandOutput
} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";


//TODO: implement checkIsUserExist
//TODO: implement getUserStatus
//TODO: implement setUserStatus
//TODO: implement getFlatUserDictionary
//TODO: implement removeWordById

export class DbAwsService implements IDbService {

    private DB_DIRECTORY_NAME = 'db';
    private DB_NAME = 'userDb.json';
    private DB_PATH = path.join('./', this.DB_DIRECTORY_NAME, this.DB_NAME);

    private dynamoDbRegion: string = process.env.AWS_REGION!;
    private dynamoDbWordsTableName: string = process.env.AWS_WORDS_TABLE_NAME!;

    private config: DynamoDBClientConfig = {
        region: this.dynamoDbRegion,
    };
    private client = new DynamoDBClient(this.config);

    constructor() {
        this.listTables()
        if (!this.dynamoDbRegion || !this.dynamoDbWordsTableName) {
            throw new Error('AWS_REGION or AWS_WORDS_TABLE_NAME are not defined')
        }
    }

    async writeWordByUserId(userId: number, word: string): Promise<DbResponse> {
        try {
            const currentUser: UserData | null = this.getUserById(userId);

            if (!currentUser) {
                throw new Error(`❌️Can't find user by id: ${userId}`)
            }

            if (await this.checkDuplicate(userId, word)) {
                return {
                    success: false,
                    status: DbResponseStatus.DUPLICATE_WORD,
                    message: `Duplicate word:  '${word}'`
                }
            }

            const currentUserWord: UserWordAWS = {
                _id: new Date().getTime(),
                user_id: userId.toString(),
                word: word.trim().toLowerCase()
            }

            const putItemParams: PutItemCommandInput = {
                TableName: this.dynamoDbWordsTableName,
                Item: marshall(currentUserWord),
                ReturnConsumedCapacity: 'INDEXES',
            };

            const command = new PutItemCommand(putItemParams)
            const response = await this.client.send(command);
            // console.log('response: ', JSON.stringify(response));

            if (response?.$metadata?.httpStatusCode !== 200) {
                throw new Error(`❌️Something went wrong while writing word to DB: ${JSON.stringify(response)}`)
            }

            return {
                success: true,
                status: DbResponseStatus.OK,
                message: `Word '${word}' has been written successfully`,
                consumedCapacity: JSON.stringify(response.ConsumedCapacity)
            }

        } catch (error: any) {
            return {
                success: false,
                status: DbResponseStatus.DB_ERROR,
                message: error.message ? error.message : 'Something wrong while writing word to DB'
            }
        }
    }

    async removeWordById(userId: number, wordId: string): Promise<DbResponse> {
        const itemInput: GetItemInput | DeleteItemCommandInput = {
            TableName: this.dynamoDbWordsTableName,
            ReturnConsumedCapacity: "INDEXES",
            Key: {'_id': {N: wordId}, 'user_id': {S: userId.toString()}}
        }
        try {
            // Check if current User exist
            const currentUser: UserData | null = this.getUserById(userId);
            if (!currentUser) {
                throw new Error(`❌️Can't find user by id: ${userId}`)
            }

            // Check if word exist for user
            const getItemCommand = new GetItemCommand(itemInput);
            const getItemResponse: GetItemCommandOutput = await this.client.send(getItemCommand) as GetItemCommandOutput;
            if (!getItemResponse?.Item) {
                return {
                    success: false,
                    status: DbResponseStatus.WRONG_INPUT,
                    message: `❌️Incorrect word's index`
                }
            }

            //deleteItem
            const deleteItemCommand = new DeleteItemCommand(itemInput);
            const deleteItemResponse = await this.client.send(deleteItemCommand);
            if (getItemResponse?.$metadata?.httpStatusCode !== 200) {
                throw new Error(`❌️Something went wrong while deleting word to DB: ${JSON.stringify(deleteItemResponse)}`)
            }

            return {
                success: true,
                status: DbResponseStatus.OK,
                message: `✔️ Word '' has been deleting successfully`
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
            console.error(`setUserStatus: no user with id '${userId}' found`)
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

    async getUserDictionary(userId: number): Promise<UserWordAWS[]> {
        const scanInput: ScanCommandInput = {
            TableName: this.dynamoDbWordsTableName,
            ReturnConsumedCapacity: "INDEXES",
            FilterExpression: "user_id = :uid",
            ExpressionAttributeValues: {
                ':uid': {S: userId.toString()}
                // ':uid': { S: '0' } // for general words
            }
        }

        try {
            const command = new ScanCommand(scanInput);
            const response: ScanCommandOutput = await this.client.send(command) as ScanCommandOutput;
            const items: UserWordAWS[] = response.Items?.map(item => unmarshall(item)) as UserWordAWS[];
            // console.log('ConsumedCapacity:', JSON.stringify(response.ConsumedCapacity, null, 2));
            // console.log('Unmarshalled items:', items);

            return items
        } catch (error) {
            throw new Error(`Something wrong while scanning DynamoDB: ${JSON.stringify(error, null, 2)}`)
        }
    }

    async getFlatUserDictionary(userId: number): Promise<string[]> {
        if (!userId) {
            return [];
        }
        return (await this.getUserDictionary(userId)).map((word: UserWordAWS) => word.word);
    }

    checkIsUserExist(userId: number): boolean {
        if (typeof userId !== 'number') {
            return false;
        }
        const currentUser = this.getUserById(userId);
        return !!currentUser;
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
            writeFileSync(this.DB_PATH, util.format('%j', userDb), {flag: 'w+'})
        } catch (err) {
            throw err
        }
    }

    private getUserDb(): UserDb {
        try {
            const data = fs.readFileSync(this.DB_PATH, {encoding: 'utf-8'});
            return JSON.parse(data) as UserDb
        } catch (error) {
            throw new Error(`Something wrong while reading file. Error: ${JSON.stringify(error)}`)
        }
    }

    private async getUserDbAWS(): Promise<UserDb> {
        try {

            const scanInput: ScanCommandInput = {
                TableName: this.dynamoDbWordsTableName,
                ReturnConsumedCapacity: "TOTAL"
            }

            const command = new ScanCommand(scanInput);
            const response: ScanCommandOutput = await this.client.send(command);

            console.log('Scan succeeded:', JSON.stringify(response, null, 2));
            return {userData: []}
        } catch (error) {
            throw new Error(`Something wrong while reading file. Error: ${JSON.stringify(error, null, 2)}`)
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

    /**
     * For development. To make sure that DynamoDB connected successfully
     */
    private async listTables() {
        const input = {
            ExclusiveStartTableName: this.dynamoDbWordsTableName,
            Limit: Number("int"),
        };
        const listCommandCommand = new ListTablesCommand(input)

        try {
            const response = await this.client.send(listCommandCommand);
            console.log('ListTablesCommand:', response);

        } catch (error) {
            console.log('Error while list tables: ', JSON.stringify(error))
        }
    }

    /**
     *
     * @param userId
     * @param word
     * @returns
     */
    private async checkDuplicate(userId: number, word: string): Promise<boolean> {
        const scanInput: ScanCommandInput = {
            TableName: this.dynamoDbWordsTableName,
            ReturnConsumedCapacity: "INDEXES",
            FilterExpression: "word = :w",
            ExpressionAttributeValues: {
                ':w': {S: word}
            }
        }

        try {
            const command = new ScanCommand(scanInput);
            const response: ScanCommandOutput = await this.client.send(command);


            return response?.Count!! > 0
        } catch (error) {
            throw new Error(`Something wrong while scanning DynamoDB: ${JSON.stringify(error, null, 2)}`)
        }
    }
}
