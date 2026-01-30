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
    _id: string;
    status: UserStatus;
    interval?: number;
    favoriteCategories?: string[];
}

export interface UserStatusSnapshot {
    status: UserStatus | null;
    wordsCount: number;
    intervalHours: number | null;
    learningLanguage?: string | null;
    favoriteCategories?: string[] | null;
}

export interface UserRawItemAWS {
    word: string;
    translation?: string;
    example?: string;
    comment?: string;
}

export interface UserItemAWS extends UserRawItemAWS {
    _id: number;
    user_id: string;
}
