import { UserStatusSnapshot } from "../common/interfaces/common";
import { SupportedLanguage, t, getLanguageDisplayName } from "../services/i18n.service";

export class FormatterHelper {

    static escapeMarkdownV2(text: string): string {
        if (!text) {
            return ''
        }
        return text.replace(/[_*[\]()~`>#\+\-=|{}.!]/g, '\\$&');
    }


    static formatUserStatusSnapshot(snapshot: UserStatusSnapshot, language: SupportedLanguage = 'en'): string {
        const entries: Array<{ label: string; value: string }> = [
            { label: t('status.wordsCount', language), value: snapshot.wordsCount.toString() },
            { label: t('status.currentMode', language), value: snapshot.status ?? '–' },
            // TODO:  Convert interval from (hours) --> (minutes)  after ICTB-44 will be done
            {
                label: t('status.intervalHours', language),
                value: snapshot.intervalHours !== null ? snapshot.intervalHours.toString() : '–'
            },
            { label: t('status.learningLanguage', language), value: snapshot.learningLanguage ?? 'English' },
            {
                label: t('status.favoriteCategories', language),
                value: snapshot.favoriteCategories?.length ? snapshot.favoriteCategories.join(', ') : '–'
            },
            { label: t('status.interfaceLanguage', language), value: getLanguageDisplayName(language) }
        ];

        const lines = [
            `__*${FormatterHelper.escapeMarkdownV2(t('status.title', language))}*__`,
            ...entries.map((entry) => {
                const safeLabel = FormatterHelper.escapeMarkdownV2(entry.label);
                const safeValue = "`" + FormatterHelper.escapeMarkdownV2(entry.value) + "`";
                return `*${safeLabel}:* ${safeValue}`;
            })
        ];

        return lines.join('\n');
    }
}
