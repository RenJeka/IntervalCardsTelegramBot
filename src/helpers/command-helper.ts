import { t } from "../services/i18n.service";
import { SUPPORTED_LANGUAGES } from "../const/common";

export enum UserAction {
    SHOW_ALL = 'SHOW_ALL',
    ADD_WORD = 'ADD_WORD',
    REMOVE_WORD = 'REMOVE_WORD',
    START_LEARN = 'START_LEARN',
    STOP_LEARN = 'STOP_LEARN',
    FINISH_ADDING = 'FINISH_ADDING',
    FINISH_REMOVING = 'FINISH_REMOVING',
    CANCEL = 'CANCEL',
    UNKNOWN = 'UNKNOWN'
}

export class CommandHelper {

    /**
     * Tries to find which action corresponds to the given localized text.
     * Iterates over all supported languages to find a match.
     */
    static getActionFromText(text: string): UserAction {
        if (!text) return UserAction.UNKNOWN;

        // Map translation keys to UserActions
        const actionMap: Record<string, UserAction> = {
            'buttons.showAll': UserAction.SHOW_ALL,
            'buttons.addWord': UserAction.ADD_WORD,
            'buttons.removeWord': UserAction.REMOVE_WORD,
            'buttons.startLearn': UserAction.START_LEARN,
            'buttons.stopLearn': UserAction.STOP_LEARN,
            'buttons.finishAdding': UserAction.FINISH_ADDING,
            'buttons.finishRemoving': UserAction.FINISH_REMOVING,
            'buttons.cancel': UserAction.CANCEL
        };

        for (const lang of SUPPORTED_LANGUAGES) {
            for (const [key, action] of Object.entries(actionMap)) {
                const translatedText = t(key, lang);
                if (text === translatedText) {
                    return action;
                }
            }
        }

        return UserAction.UNKNOWN;
    }
}
