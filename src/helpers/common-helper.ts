import {UserRawItemAWS} from "../common/interfaces/common";
import {ADD_USER_ITEM_SEPARATOR} from "../const/common";

export class CommonHelper {
    static parseUserRawItem(userMessage: string): UserRawItemAWS {
        if (!userMessage) {
            return {word: ''}
        }
        const parsedItem: string[] = userMessage.split(ADD_USER_ITEM_SEPARATOR).map(item => item.trim().toLowerCase());

        const userRawItem: UserRawItemAWS = {word: parsedItem[0]};

        if (parsedItem[1]) {
            userRawItem.translation = parsedItem[1]
        }

        if (parsedItem[2]) {
            userRawItem.comment = parsedItem[2]
        }

        if (parsedItem[3]) {
            userRawItem.example = parsedItem[3]
        }

        return userRawItem;
    }
}
