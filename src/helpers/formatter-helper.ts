export class FormatterHelper {

    static escapeMarkdownV2(text: string): string {
        if (!text) {
            return ''
        }
        return text.replace(/[_*[\]()~`>#\+\-=|{}.!]/g, '\\$&');
    }
}
