import { UserStatus } from "../enums/userStatus";

export interface UserDb {
    userData: UserData[]
}

export interface UserData {
    id: number;
    status: UserStatus;
    dictionary: UserWord[];
}

export interface UserWord {
    id: string;
    text: string;
}

export interface UserDataAWS {
    _id: number;
    status: UserStatus;
}

export interface UserWordAWS {
    _id: string;
    user_id: string;
    word: string;
    translation: string;
    example: string;
    comment: string;
}