export interface DbResponse {
    success: boolean;
    status: DbResponseStatus;
    message?: string;
}

export enum DbResponseStatus {
    OK,
    DB_ERROR,
    NO_DB,
    DUPLICATE_WORD,
    WRONG_INPUT
}