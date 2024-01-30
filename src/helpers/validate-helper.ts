import { UserWord } from "../common/interfaces/common";

export class ValidateHelper {

    /**
     *
     * @param userDictionary all user's words ()
     * @param currentWord
     * @private
     * @return true, if it is duplicate, otherwise — false
     */
    static checkDuplicate(userDictionary: UserWord[], currentWord: string): boolean {
        if (!userDictionary.length || !currentWord) {
            return false;
        }

        const userWords = userDictionary.map(word => word.text)

        const isDuplicates = userWords.some(word => word.toLowerCase() === currentWord.toLowerCase());

        console.log('isDuplicates: ', isDuplicates);
        return isDuplicates
    }
}