import { UserItemAWS, UserRawItemAWS } from "../common/interfaces/common";
import { UserDataAWS } from "../common/interfaces/common";
import { UserStatus } from "../common/enums/userStatus";
import { DbResponse, DbResponseStatus } from "../common/interfaces/dbResponse";
import { IDbService } from "../common/interfaces/iDbService";
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
    UpdateItemCommandInput,
    UpdateItemCommand,
    UpdateItemCommandOutput
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { CommonHelper } from "../helpers/common-helper";
import chalk from 'chalk';
import { FormatterHelper } from "../helpers/formatter-helper";
import { DEFAULT_USER_INTERVAL } from "../const/common";
import { LogService } from "./log.service";

export class DbAwsService implements IDbService {

    private dynamoDbRegion: string = process.env.AWS_REGION!;
    private tableNames = {
        words: process.env.AWS_WORDS_TABLE_NAME!,
        users: process.env.AWS_USERS_TABLE_NAME!
    };

    private config: DynamoDBClientConfig = {
        region: this.dynamoDbRegion,
    };
    private client = new DynamoDBClient(this.config);

    constructor() {
        // this.listTables()
        if (!this.dynamoDbRegion || !this.tableNames.words) {
            throw new Error('AWS_REGION or AWS_WORDS_TABLE_NAME are not defined')
        }

        this.initDb();
    }

    async writeWordByUserId(userId: number, message: string): Promise<DbResponse> {
        try {
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
                TableName: this.tableNames.words,
                Item: marshall(currentUserWord),
                ReturnConsumedCapacity: 'INDEXES',
            };

            const command = new PutItemCommand(putItemParams)
            const response: PutItemCommandOutput = await this.client.send(command) as PutItemCommandOutput;
            if (response?.$metadata?.httpStatusCode !== 200) {
                throw new Error(`❌️Something went wrong while writing word to DB: ${LogService.safeStringify(response)}`)
            }

            return {
                success: true,
                status: DbResponseStatus.OK,
                message: `Word '${message}' has been written successfully`,
                consumedCapacity: LogService.safeStringify(response.ConsumedCapacity)
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
            TableName: this.tableNames.words,
            ReturnConsumedCapacity: "INDEXES",
            Key: { '_id': { N: wordId }, 'user_id': { S: userId.toString() } }
        }
        let deletingItem: UserItemAWS;

        try {
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

            deletingItem = unmarshall(getItemResponse.Item) as UserItemAWS

            //deleteItem
            const deleteItemCommand = new DeleteItemCommand(itemInput);
            const deleteItemResponse: DeleteItemCommandOutput = await this.client.send(deleteItemCommand) as DeleteItemCommandOutput;
            if (getItemResponse?.$metadata?.httpStatusCode !== 200) {
                throw new Error(`❌️Something went wrong while deleting word to DB: ${LogService.safeStringify(deleteItemResponse)}`)
            }

            return {
                success: true,
                status: DbResponseStatus.OK,
                message: `✔️ Word __*${FormatterHelper.escapeMarkdownV2(deletingItem.word)}*__ has been deleting successfully`
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
            TableName: this.tableNames.users,
            Key: { _id: { S: userId.toString() } },
            UpdateExpression: 'SET #status = :status',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':status': { S: userStatus } },
            ReturnConsumedCapacity: 'INDEXES',
        };

        const command = new UpdateItemCommand(updateItemParams)
        const response: UpdateItemCommandOutput = await this.client.send(command) as UpdateItemCommandOutput;

        if (response?.$metadata?.httpStatusCode !== 200) {
            throw new Error(`❌️Something went wrong while writing word to DB: ${LogService.safeStringify(response)}`)
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
            TableName: this.tableNames.users,
            ReturnConsumedCapacity: "INDEXES",
            FilterExpression: "#id = :uid",
            ExpressionAttributeNames: { '#id': '_id' },
            ExpressionAttributeValues: { ':uid': { S: userId.toString() } }
        }

        try {
            const command = new ScanCommand(scanInput);

            console.log(command)
            const response: ScanCommandOutput = await this.client.send(command) as ScanCommandOutput;

            if (!response || !response?.Items || response?.Items?.length === 0) {
                return null;
            }

            return unmarshall(response.Items[0])?.status ?? null;

        } catch (error) {
            throw new Error(`Something wrong while scanning DynamoDB: ${LogService.safeStringify(error)}`)
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
            TableName: this.tableNames.users,
            Key: { '_id': { S: userId.toString() } },
            UpdateExpression: 'SET #interval = :interval',
            ExpressionAttributeNames: { '#interval': 'interval' },
            ExpressionAttributeValues: { ':interval': { N: interval.toString() } },
            ReturnConsumedCapacity: 'INDEXES'
        };

        const command = new UpdateItemCommand(updateItemParams)
        const response: UpdateItemCommandOutput = await this.client.send(command) as UpdateItemCommandOutput;

        if (response?.$metadata?.httpStatusCode !== 200) {
            throw new Error(`❌️Something went wrong while writing word to DB: ${LogService.safeStringify(response)}`)
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
            TableName: this.tableNames.users,
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
            throw new Error(`Something wrong while scanning DynamoDB: ${LogService.safeStringify(error)}`)
        }
    }

    async addUserFavoriteCategory(userId: number, category: string): Promise<DbResponse> {
        const updateItemParams: UpdateItemCommandInput = {
            TableName: this.tableNames.users,
            Key: { '_id': { S: userId.toString() } },
            UpdateExpression: 'ADD #favoriteCategories :favoriteCategory',
            ExpressionAttributeNames: { '#favoriteCategories': 'favoriteCategories' },
            ExpressionAttributeValues: { ':favoriteCategory': { SS: [category] } },
            ReturnConsumedCapacity: 'INDEXES'
        };
        const command = new UpdateItemCommand(updateItemParams);
        const response: UpdateItemCommandOutput = await this.client.send(command) as UpdateItemCommandOutput;
        if (response?.$metadata?.httpStatusCode !== 200) {
            throw new Error(`❌️Something went wrong while writing favorite category to DB: ${LogService.safeStringify(response)}`)
        }
        return {
            success: true,
            status: DbResponseStatus.OK,
            message: '✔️ Favorite categories have been updated successfully'
        }
    }

    async removeUserFavoriteCategory(userId: number, category: string): Promise<DbResponse> {
        const updateItemParams: UpdateItemCommandInput = {
            TableName: this.tableNames.users,
            Key: { '_id': { S: userId.toString() } },
            UpdateExpression: 'DELETE #favoriteCategories :favoriteCategory',
            ExpressionAttributeNames: { '#favoriteCategories': 'favoriteCategories' },
            ExpressionAttributeValues: { ':favoriteCategory': { SS: [category] } },
            ReturnConsumedCapacity: 'INDEXES'
        };
        const command = new UpdateItemCommand(updateItemParams);
        const response: UpdateItemCommandOutput = await this.client.send(command) as UpdateItemCommandOutput;
        if (response?.$metadata?.httpStatusCode !== 200) {
            throw new Error(`❌️Something went wrong while removing favorite category to DB: ${LogService.safeStringify(response)}`)
        }
        return {
            success: true,
            status: DbResponseStatus.OK,
            message: '✔️ Favorite category has been removed successfully'
        }
    }

    async getUserFavoriteCategories(userId: number): Promise<string[]> {
        if (!userId) {
            return [];
        }
        const scanInput: ScanCommandInput = {
            TableName: this.tableNames.users,
            ReturnConsumedCapacity: "INDEXES",
            FilterExpression: "#id = :uid",
            ExpressionAttributeNames: { '#id': '_id' },
            ExpressionAttributeValues: { ':uid': { S: userId.toString() } }
        }
        try {
            const command = new ScanCommand(scanInput);
            const response: ScanCommandOutput = await this.client.send(command) as ScanCommandOutput;
            if (!response || !response?.Items || response?.Items?.length === 0) {
                return [];
            }

            return Array.from(unmarshall(response.Items[0])?.favoriteCategories) ?? [];
        } catch (error) {
            throw new Error(`Something wrong while scanning DynamoDB: ${LogService.safeStringify(error)}`)
        }
    }

    async getUserDictionary(userId: number): Promise<UserItemAWS[]> {
        const scanInput: ScanCommandInput = {
            TableName: this.tableNames.words,
            ReturnConsumedCapacity: "INDEXES",
            FilterExpression: "user_id = :uid",
            ExpressionAttributeValues: {
                ':uid': { S: userId.toString() }
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
            throw new Error(`Something wrong while scanning DynamoDB: ${LogService.safeStringify(error)}`)
        }
    }

    async getFlatUserDictionary(userId: number): Promise<string[]> {
        if (!userId) {
            return [];
        }
        return (await this.getUserDictionary(userId)).map((word: UserItemAWS) => word.word);
    }

    /**
     * Returns all users with the specified status
     */
    async getAllUsersWithStatus(userStatus: UserStatus = UserStatus.START_LEARN): Promise<UserDataAWS[]> {
        const scanInput: ScanCommandInput = {
            TableName: this.tableNames.users,
            ReturnConsumedCapacity: "INDEXES",
            FilterExpression: "#status = :st",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: { ":st": { S: userStatus } }
        };

        try {
            const command = new ScanCommand(scanInput);
            const response: ScanCommandOutput = await this.client.send(command) as ScanCommandOutput;

            if (!response?.Items || !response.Items.length) {
                return [];
            }

            return response.Items.map(item => unmarshall(item) as UserDataAWS);

        } catch (error) {
            LogService.error('❌️ Error while scanning active learners:', error);
            throw new Error(`Something wrong while scanning DynamoDB: ${LogService.safeStringify(error)}`);
        }
    }

    async checkIsUserExist(userId: number): Promise<boolean> {
        if (typeof userId !== 'number') {
            return false;
        }
        const scanInput: ScanCommandInput = {
            TableName: this.tableNames.users,
            ReturnConsumedCapacity: "INDEXES",
            FilterExpression: "#id = :uid",
            ExpressionAttributeNames: { '#id': '_id' },
            ExpressionAttributeValues: { ':uid': { S: userId.toString() } }
        };
        try {
            const command = new ScanCommand(scanInput);
            const response: ScanCommandOutput = await this.client.send(command) as ScanCommandOutput;
            return !!(response?.Items && response.Items.length > 0);
        } catch (error) {
            throw new Error(`Something wrong while scanning DynamoDB: ${LogService.safeStringify(error)}`)
        }
    }

    private async initDb(): Promise<void> {
        try {
            const command = new ListTablesCommand({});
            const response = await this.client.send(command);
            const tables = response.TableNames || [];
            for (const tableKey in this.tableNames) {
                const tableName = this.tableNames[tableKey as keyof typeof this.tableNames];
                if (!tables.includes(tableName)) {
                    throw new Error(`Table ${tableName} not found in DynamoDB`);
                }
            }
            LogService.info(chalk.green.bold(`✔ connecting to DynamoDB is successfully!`));

        } catch (error) {
            throw new Error(`Failed to connect to DynamoDB or find required tables: ${error}`);
        }
    }

    async initUser(userId: number): Promise<void> {
        if (await this.checkIsUserExist(userId)) {
            return;
        }
        const newUser: UserDataAWS = {
            _id: userId.toString(),
            status: UserStatus.DEFAULT,
            interval: DEFAULT_USER_INTERVAL
        };
        const putItemParams: PutItemCommandInput = {
            TableName: this.tableNames.users,
            Item: marshall(newUser),
            ReturnConsumedCapacity: 'INDEXES',
        };
        const command = new PutItemCommand(putItemParams);
        await this.client.send(command);
    }

    /**
     * For development. To make sure that DynamoDB connected successfully
     */
    private async listTables() {
        const input = {
            ExclusiveStartTableName: this.tableNames.words,
            Limit: Number("int"),
        };
        const listCommandCommand = new ListTablesCommand(input)

        try {
            const response = await this.client.send(listCommandCommand);
            LogService.info('ListTablesCommand:', response);

        } catch (error) {
            LogService.error(chalk.red`Error while list tables: ${LogService.safeStringify(error)}`)
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
            TableName: this.tableNames.words,
            ReturnConsumedCapacity: "INDEXES",
            FilterExpression: "word = :w AND user_id = :uid",
            ExpressionAttributeValues: {
                ':w': { S: String(word) },
                ':uid': { S: String(userId) }
            }
        };

        try {
            const command = new ScanCommand(scanInput);
            const response: ScanCommandOutput = await this.client.send(command) as ScanCommandOutput;

            return response?.Count!! > 0
        } catch (error) {
            throw new Error(`Something wrong while scanning DynamoDB: ${LogService.safeStringify(error)}`)
        }
    }
}
