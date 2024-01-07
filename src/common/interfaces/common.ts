import { UserStatus } from "../enums/userStatus";

export interface UserDb {
    userData: UserData[]
}

export interface UserData {
    id: number;
    status: UserStatus;
    dictionary: string[];
}