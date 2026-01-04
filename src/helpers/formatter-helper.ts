import { UserStatusSnapshot } from "../common/interfaces/common";

export class FormatterHelper {

    static escapeMarkdownV2(text: string): string {
        if (!text) {
            return ''
        }
        return text.replace(/[_*[\]()~`>#\+\-=|{}.!]/g, '\\$&');
    }


    static formatUserStatusSnapshot(snapshot: UserStatusSnapshot): string {
        const entries: Array<{ label: string; value: string }> = [
            { label: '📝 Words count', value: snapshot.wordsCount.toString() },
            { label: '🔄Current mode', value: snapshot.status ?? '–' },
            // TODO:  Convert interval from (hours) --> (minutes)  after ICTB-44 will be done
            {
                label: '⏱️Interval (hours)',
                value: snapshot.intervalHours !== null ? snapshot.intervalHours.toString() : '–'
            },
            { label: '🇬🇧Learning language', value: snapshot.learningLanguage ?? '–' },
            {
                label: '⭐Favorite categories',
                value: snapshot.favoriteCategories?.length ? snapshot.favoriteCategories.join(', ') : '–'
            },
        ];

        const lines = [
            `__*${FormatterHelper.escapeMarkdownV2(`Your status`)}*__`,
            ...entries.map((entry) => {
                const safeLabel = FormatterHelper.escapeMarkdownV2(entry.label);
                const safeValue = FormatterHelper.escapeMarkdownV2(entry.value);
                return `*${safeLabel}:* ${safeValue}`;
            })
        ];

        return lines.join('\n');
    }
}
