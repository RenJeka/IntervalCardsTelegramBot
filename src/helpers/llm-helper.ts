import { LLMService } from '../services/llm.service';
import { LogService } from '../services/log.service';
import {
    GeneratedWord,
    WordSetGenerationParams,
    WordSetGenerationResult
} from '../common/interfaces/llm';
import { WORD_SET_GENERATION_PROMPT } from '../const/prompts';
import { DEFAULT_WORDS_PER_SET, LLM_CACHE_TTL_MS } from '../const/common';

/**
 * In-memory cache for generated word sets
 * Key format: "categoriesCSV:learningLang:nativeLang:count"
 */
const wordSetCache = new Map<string, {
    words: GeneratedWord[];
    timestamp: number;
}>();

export class LLMHelper {
    /**
     * Generate a set of vocabulary words using LLM
     */
    static async generateWordSet(
        params: WordSetGenerationParams
    ): Promise<WordSetGenerationResult> {
        const {
            categories,
            learningLanguage,
            nativeLanguage,
            count = DEFAULT_WORDS_PER_SET
        } = params;

        // Check cache first
        const cacheKey = this.getCacheKey(categories, learningLanguage, nativeLanguage, count);
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            LogService.info('Word set retrieved from cache', { cacheKey });
            return {
                words: cached,
                cached: true
            };
        }

        // Generate new word set
        try {
            const userPrompt = this.generateUserPrompt(categories, learningLanguage, nativeLanguage, count);

            const response = await LLMService.complete([
                { role: 'system', content: WORD_SET_GENERATION_PROMPT },
                { role: 'user', content: userPrompt }
            ]);

            const words = this.parseWordSetResponse(response);

            // Validate word count
            if (words.length === 0) {
                throw new Error('LLM returned empty word set');
            }

            // Cache the result
            this.saveToCache(cacheKey, words);

            LogService.info('Word set generated successfully', {
                categories: categories.join(', '),
                learningLanguage,
                count: words.length
            });

            return {
                words,
                cached: false
            };
        } catch (error) {
            LogService.error('Failed to generate word set', error);
            throw error;
        }
    }

    /**
     * Parse LLM response and extract word/translation pairs
     */
    private static parseWordSetResponse(response: string): GeneratedWord[] {
        try {
            // Remove markdown code blocks if present
            const cleaned = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const parsed = JSON.parse(cleaned);

            if (!Array.isArray(parsed)) {
                throw new Error('Response is not an array');
            }

            // Validate and filter valid entries
            const words: GeneratedWord[] = parsed
                .filter(item => 
                    item &&
                    typeof item === 'object' &&
                    typeof item.word === 'string' &&
                    typeof item.translation === 'string' &&
                    item.word.trim() !== '' &&
                    item.translation.trim() !== ''
                )
                .map(item => ({
                    word: item.word.trim(),
                    translation: item.translation.trim()
                }));

            return words;
        } catch (error) {
            LogService.error('Failed to parse LLM response', {
                response,
                error
            });
            throw new Error('Invalid response format from LLM');
        }
    }

    /**
     * Generate user prompt for word set generation
     */
    private static generateUserPrompt(
        categories: string[],
        learningLanguage: string,
        nativeLanguage: string,
        count: number
    ): string {
        const categoriesString = categories.join(', ');
        return `Generate ${count} basic vocabulary words for these categories: ${categoriesString} in ${learningLanguage} with translations to ${nativeLanguage}.`;
    }

    /**
     * Generate cache key
     * Categories are sorted to ensure the same set of categories yields the same cache key
     */
    private static getCacheKey(
        categories: string[],
        learningLanguage: string,
        nativeLanguage: string,
        count: number
    ): string {
        const sortedCategories = [...categories].sort().join(',');
        return `${sortedCategories}:${learningLanguage}:${nativeLanguage}:${count}`;
    }

    /**
     * Get word set from cache if not expired
     */
    private static getFromCache(key: string): GeneratedWord[] | null {
        const cached = wordSetCache.get(key);
        
        if (!cached) {
            return null;
        }

        const now = Date.now();
        const age = now - cached.timestamp;

        if (age > LLM_CACHE_TTL_MS) {
            wordSetCache.delete(key);
            return null;
        }

        return cached.words;
    }

    /**
     * Save word set to cache
     */
    private static saveToCache(key: string, words: GeneratedWord[]): void {
        wordSetCache.set(key, {
            words,
            timestamp: Date.now()
        });
    }

    /**
     * Clear all cached word sets (useful for testing or manual cache invalidation)
     */
    static clearCache(): void {
        wordSetCache.clear();
        LogService.info('Word set cache cleared');
    }
}
