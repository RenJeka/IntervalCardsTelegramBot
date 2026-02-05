import { FAVORITE_CATEGORIES } from "../const/favoriteCategories";
import { t, SupportedLanguage } from "../services/i18n.service";
import { FAVORITE_CATEGORY_CALLBACK_PREFIX } from "../const/common";
import { InlineKeyboardButton } from "node-telegram-bot-api";

export class CategoryHelper {
    /**
     * Returns a string of translated categories, sorted alphabetically by translation
     * @example
     * getSortedTranslatedCategoriesString(['Animals', 'Art'], 'en') // returns 'Animals, Art'
     * getSortedTranslatedCategoriesString(['Animals', 'Art'], 'uk') // returns 'Тварини, Мистецтво'
     */
    static getSortedTranslatedCategoriesString(categories: string[], lang: SupportedLanguage): string {
        return categories
            .map(category => t(`categories.${category}`, lang))
            .sort((a, b) => a.localeCompare(b, lang))
            .join(', ');
    }

    /**
     * Generates sorted keyboard buttons for favorite categories
     */
    static getSortedCategoriesKeyboard(selectedCategories: string[], lang: SupportedLanguage): InlineKeyboardButton[][] {
        const keyboard: InlineKeyboardButton[][] = [];

        // Map all categories to a structure that includes original index, key, and translation
        const categoryItems = FAVORITE_CATEGORIES.map((category, index) => ({
            category,
            index,
            translation: t(`categories.${category}`, lang)
        }));

        // Sort by translation
        categoryItems.sort((a, b) => a.translation.localeCompare(b.translation, lang));

        // Create rows of 2 buttons
        for (let i = 0; i < categoryItems.length; i += 2) {
            const firstItem = categoryItems[i];
            const secondItem = categoryItems[i + 1];
            const row: InlineKeyboardButton[] = [];

            if (firstItem) {
                row.push({
                    text: selectedCategories.includes(firstItem.category)
                        ? `✅ ${firstItem.translation}`
                        : firstItem.translation,
                    callback_data: `${FAVORITE_CATEGORY_CALLBACK_PREFIX}${firstItem.index}`
                });
            }

            if (secondItem) {
                row.push({
                    text: selectedCategories.includes(secondItem.category)
                        ? `✅ ${secondItem.translation}`
                        : secondItem.translation,
                    callback_data: `${FAVORITE_CATEGORY_CALLBACK_PREFIX}${secondItem.index}`
                });
            }

            keyboard.push(row);
        }

        return keyboard;
    }
}
