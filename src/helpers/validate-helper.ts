export class ValidateHelper {

    /**
     *
     * @param userDictionary all user's words ()
     * @param currentWord
     * @private
     * @return true, if it is duplicate, otherwise — false
     */
    static checkDuplicate(userDictionary: string[], currentWord: string): boolean {
        if (!userDictionary.length || !currentWord) {
            return false;
        }

        const isDuplicates = userDictionary.some(word => word.toLowerCase() === currentWord.toLowerCase());

        console.log('isDuplicates: ', isDuplicates);
        return isDuplicates
    }
}