import * as fs from "fs";
import * as util from "node:util";
import {UserData, UserDb, UserItemAWS, UserRawItemAWS} from "../common/interfaces/common";
import {UserStatus} from "../common/enums/userStatus";
import {DbResponse, DbResponseStatus} from "../common/interfaces/dbResponse";
import {writeFileSync} from "fs";
import {IDbService} from "../common/interfaces/iDbService";
import path from "path";
import {
    DynamoDBClient,
    ListTablesCommand,
    GetItemCommand,
    PutItemCommand,
    ScanCommand,
    DeleteItemCommand,
    DynamoDBClientConfig,
    ScanCommandInput,
    GetItemInput,
    PutItemCommandInput,
    DeleteItemCommandInput,
    ScanCommandOutput,
    GetItemCommandOutput,
    PutItemCommandOutput,
    DeleteItemCommandOutput,
    GetItemCommandInput,
    UpdateItemCommandInput,
    UpdateItemCommand,
    UpdateItemCommandOutput
} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import {CommonHelper} from "../helpers/common-helper";
import chalk from 'chalk';

export class DbAwsService implements IDbService {

    private DB_DIRECTORY_NAME = 'db';
    private DB_NAME = 'userDb.json';
    private DB_PATH = path.join('./', this.DB_DIRECTORY_NAME, this.DB_NAME);
    private dynamoDbRegion: string = process.env.AWS_REGION!;
    private dynamoDbWordsTableName: string = process.env.AWS_WORDS_TABLE_NAME!;
    private dynamoDbUsersTableName: string = process.env.AWS_USERS_TABLE_NAME!; 

    private config: DynamoDBClientConfig = {
        region: this.dynamoDbRegion,
    };
    private client = new DynamoDBClient(this.config);

    constructor() {
        // this.listTables()
        if (!this.dynamoDbRegion || !this.dynamoDbWordsTableName) {
            throw new Error('AWS_REGION or AWS_WORDS_TABLE_NAME are not defined')
        }

        this.initDb();
    }

    async writeWordByUserId(userId: number, message: string): Promise<DbResponse> {
        try {
            const currentUser: UserData | null = this.getUserById(userId);
            if (!currentUser) {
                throw new Error(`❌️Can't find user by id: ${userId}`)
            }

            const parsedRawItem: UserRawItemAWS = CommonHelper.parseUserRawItem(message);

            if (await this.checkDuplicate(userId, parsedRawItem.word)) {
                return {
                    success: false,
                    status: DbResponseStatus.DUPLICATE_WORD,
                    message: `Duplicate word: '${message}'`
                }
            }

            const currentUserWord: UserItemAWS = {
                _id: new Date().getTime(),
                user_id: userId.toString(),
                ...parsedRawItem
            };

            const putItemParams: PutItemCommandInput = {
                TableName: this.dynamoDbWordsTableName,
                Item: marshall(currentUserWord),
                ReturnConsumedCapacity: 'INDEXES',
            };

            const command = new PutItemCommand(putItemParams)
            const response: PutItemCommandOutput = await this.client.send(command) as PutItemCommandOutput;
            if (response?.$metadata?.httpStatusCode !== 200) {
                throw new Error(`❌️Something went wrong while writing word to DB: ${JSON.stringify(response)}`)
            }

            return {
                success: true,
                status: DbResponseStatus.OK,
                message: `Word '${message}' has been written successfully`,
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
        let deletingItem: UserItemAWS;

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

            console.log(`${chalk.blue.bold.underline('getItemResponse:')} ${JSON.stringify(getItemResponse, null, 2)}`);
            console.log('unmarshall(getItemResponse.Item):', unmarshall(getItemResponse.Item));

            deletingItem = unmarshall(getItemResponse.Item) as UserItemAWS

            //deleteItem
            const deleteItemCommand = new DeleteItemCommand(itemInput);
            const deleteItemResponse: DeleteItemCommandOutput = await this.client.send(deleteItemCommand) as DeleteItemCommandOutput;
            if (getItemResponse?.$metadata?.httpStatusCode !== 200) {
                throw new Error(`❌️Something went wrong while deleting word to DB: ${JSON.stringify(deleteItemResponse)}`)
            }

            return {
                success: true,
                status: DbResponseStatus.OK,
                message: `✔️ Word __*${deletingItem.word}*__ has been deleting successfully`
            }

        } catch (error: any) {
            return {
                success: false,
                status: DbResponseStatus.DB_ERROR,
                message: error.message ? error.message : '❌️Something wrong while deleting word from DB'
            }
        }
    }

    async setUserStatus(userId: number, userStatus: UserStatus = UserStatus.DEFAULT): Promise<DbResponse> {
        
        const updateItemParams: UpdateItemCommandInput = {
            TableName: this.dynamoDbUsersTableName,
            Key: {_id: {S: userId.toString()}},
            UpdateExpression: 'SET #status = :status',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':status': { S: userStatus } },
            ReturnConsumedCapacity: 'INDEXES',
        };

        const command = new UpdateItemCommand(updateItemParams)
        const response: UpdateItemCommandOutput = await this.client.send(command) as UpdateItemCommandOutput;

        if (response?.$metadata?.httpStatusCode !== 200) {
            throw new Error(`❌️Something went wrong while writing word to DB: ${JSON.stringify(response)}`)
        }

        return {
            success: true,
            status: DbResponseStatus.OK,
            message: `✔️ User status has been written successfully`
        }
    }

    async getUserStatus(userId?: number): Promise<UserStatus | null> {
        if (!userId) {
            return null;
        }

        const scanInput: ScanCommandInput = {
            TableName: this.dynamoDbUsersTableName,
            ReturnConsumedCapacity: "INDEXES",
            FilterExpression: "#id = :uid",
            ExpressionAttributeNames: { '#id': '_id' },
            ExpressionAttributeValues: { ':uid': { S: userId.toString() } }
        }

        try {
            const command = new ScanCommand(scanInput);
            const response: ScanCommandOutput = await this.client.send(command) as ScanCommandOutput;

            if (!response || !response?.Items || response?.Items?.length === 0) {
                return null;
            }

            return unmarshall(response.Items[0])?.status ?? null;
            
        } catch (error) {
            throw new Error(`Something wrong while scanning DynamoDB: ${JSON.stringify(error, null, 2)}`)
        }
            
    }

    /**
     * Set user interval
     * @param userId
     * @param interval  integer from 1 to 12
     * @returns
     */
    async setUserInterval(userId: number, interval: number): Promise<DbResponse> {

        const updateItemParams: UpdateItemCommandInput = {
            TableName: this.dynamoDbUsersTableName,
            Key: { '_id': { S: userId.toString() } },
            UpdateExpression: 'SET #interval = :interval',
            ExpressionAttributeNames: { '#interval': 'interval' },
            ExpressionAttributeValues: { ':interval': { N: interval.toString() } },
            ReturnConsumedCapacity: 'INDEXES'
        };

        const command = new UpdateItemCommand(updateItemParams)
        const response: UpdateItemCommandOutput = await this.client.send(command) as UpdateItemCommandOutput;

        if (response?.$metadata?.httpStatusCode !== 200) {
            throw new Error(`❌️Something went wrong while writing word to DB: ${JSON.stringify(response)}`)
        }

        return {
            success: true,
            status: DbResponseStatus.OK,
            message: `✔️ User interval has been written successfully`
        }
    }

    async getUserInterval(userId: number): Promise<number | null> {

        if (!userId) {
            return null;
        }

        const scanInput: ScanCommandInput = {
            TableName: this.dynamoDbUsersTableName,
            ReturnConsumedCapacity: "INDEXES",
            FilterExpression: "#id = :uid",
            ExpressionAttributeNames: { '#id': '_id' },
            ExpressionAttributeValues: { ':uid': { S: userId.toString() } }
        }

        try {
            const command = new ScanCommand(scanInput);
            const response: ScanCommandOutput = await this.client.send(command) as ScanCommandOutput;

            if (!response || !response?.Items || response?.Items?.length === 0) {
                return null;
            }

            return unmarshall(response.Items[0])?.interval ?? null;
            
        } catch (error) {
            throw new Error(`Something wrong while scanning DynamoDB: ${JSON.stringify(error, null, 2)}`)
        }
    }

    async getUserDictionary(userId: number): Promise<UserItemAWS[]> {
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
            const items: UserItemAWS[] = response.Items?.map(item => unmarshall(item)) as UserItemAWS[];

            items.sort((prev: UserItemAWS, next: UserItemAWS) => prev.word.localeCompare(next.word));
            return items
        } catch (error) {
            throw new Error(`Something wrong while scanning DynamoDB: ${JSON.stringify(error, null, 2)}`)
        }
    }

    async getFlatUserDictionary(userId: number): Promise<string[]> {
        if (!userId) {
            return [];
        }
        return (await this.getUserDictionary(userId)).map((word: UserItemAWS) => word.word);
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
            console.log(chalk.red`Error while list tables: ${JSON.stringify(error)}`)
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
            FilterExpression: "word = :w AND user_id = :uid",
            ExpressionAttributeValues: {
                ':w': {S: String(word)},
                ':uid': { S: String(userId) }
            }
        };

        try {
            const command = new ScanCommand(scanInput);
            const response: ScanCommandOutput = await this.client.send(command) as ScanCommandOutput;

            return response?.Count!! > 0
        } catch (error) {
            throw new Error(`Something wrong while scanning DynamoDB: ${JSON.stringify(error, null, 2)}`)
        }
    }
}
