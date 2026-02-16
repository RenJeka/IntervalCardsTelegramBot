import { LLMService } from '../services/llm.service';
import { LogService } from '../services/log.service';
import {
    GeneratedWord,
    WordSetGenerationParams,
    WordSetGenerationResult,
} from '../common/interfaces/llm';
import { WORD_SET_GENERATION_PROMPT } from '../const/prompts';
import {
    DEFAULT_WORDS_PER_SET,
    LLM_CACHE_TTL_MS,
    PRESET_WORDS_EXCLUDED_WORDS_LIMIT,
} from '../const/common';

/**
 * In-memory cache for generated word sets
 * Key format: "categoriesCSV:learningLang:nativeLang:count"
 */
const wordSetCache = new Map<
    string,
    {
        words: GeneratedWord[];
        timestamp: number;
    }
>();

/**
 * Helper class for high-level LLM operations, such as generating word sets
 */
export class LLMHelper {
    /**
     * Generate a set of vocabulary words using LLM
     * @param params - Parameters for word set generation (categories, languages, count)
     * @returns A promise that resolves to the generation result containing words and cache status
     * @throws Error if generation fails or response is invalid
     */
    static async generateWordSet(
        params: WordSetGenerationParams
    ): Promise<WordSetGenerationResult> {
        const {
            categories,
            learningLanguage,
            nativeLanguage,
            count = DEFAULT_WORDS_PER_SET,
            excludedWords = [],
        } = params;

        const cacheKey = this.getCacheKey(
            categories,
            learningLanguage,
            nativeLanguage,
            count
        );

        // 1. Try to get from cache
        const cachedResult = this.tryGetFromCache(cacheKey, excludedWords);
        if (cachedResult) {
            return cachedResult;
        }

        // 2. Generate new word set with retries for uniqueness
        try {
            const generatedWords = await this.generateUniqueWordsLoop(
                params,
                excludedWords
            );

            // 3. Cache the result if applicable
            if (excludedWords.length === 0 && generatedWords.length >= count) {
                this.saveToCache(cacheKey, generatedWords);
            }

            LogService.info('Word set generated successfully', {
                categories: categories.join(', '),
                learningLanguage,
                count: generatedWords.length,
            });

            return {
                words: generatedWords,
                cached: false,
            };
        } catch (error) {
            LogService.error('Failed to generate word set', error);
            throw error;
        }
    }

    private static tryGetFromCache(
        cacheKey: string,
        excludedWords: string[]
    ): WordSetGenerationResult | null {
        if (excludedWords.length > 0) {
            return null;
        }

        const cached = this.getFromCache(cacheKey);
        if (cached) {
            LogService.info('Word set retrieved from cache', { cacheKey });
            return {
                words: cached,
                cached: true,
            };
        }

        return null;
    }

    private static async generateUniqueWordsLoop(
        params: WordSetGenerationParams,
        initialExcludedWords: string[]
    ): Promise<GeneratedWord[]> {
        const {
            categories,
            learningLanguage,
            nativeLanguage,
            count = DEFAULT_WORDS_PER_SET,
        } = params;

        const generatedWords: GeneratedWord[] = [];
        let attempts = 0;
        const maxAttempts = 3;
        const currentExcluded = new Set(
            initialExcludedWords.map((w) => w.toLowerCase())
        );

        while (generatedWords.length < count && attempts < maxAttempts) {
            attempts++;
            const wordsNeeded = count - generatedWords.length;
            const REQUEST_MULTIPLEXOR = 1.5;

            const requestCount = Math.ceil(wordsNeeded * REQUEST_MULTIPLEXOR);

            LogService.info(
                `Generating words attempt ${attempts}/${maxAttempts}`,
                {
                    needed: wordsNeeded,
                    requesting: requestCount,
                    excludedCount: currentExcluded.size,
                }
            );

            const userPrompt = this.generateUserPrompt(
                categories,
                learningLanguage,
                nativeLanguage,
                requestCount,
                Array.from(currentExcluded)
            );

            try {
                const response = await LLMService.complete([
                    { role: 'system', content: WORD_SET_GENERATION_PROMPT },
                    { role: 'user', content: userPrompt },
                ]);

                const words = this.parseWordSetResponse(response);

                // Filter out duplicates and excluded words
                for (const word of words) {
                    const lowerWord = word.word.toLowerCase();
                    if (!currentExcluded.has(lowerWord)) {
                        generatedWords.push(word);
                        currentExcluded.add(lowerWord);
                    }

                    if (generatedWords.length >= count) break;
                }

                if (words.length === 0) {
                    LogService.warn(
                        'LLM returned zero valid words in this attempt'
                    );
                }
            } catch (error) {
                LogService.warn(`Attempt ${attempts} failed:`, error);
                // Continue to next attempt
            }
        }

        // Validate final word count
        if (generatedWords.length === 0) {
            throw new Error(
                'LLM failed to generate any valid words after retries'
            );
        }

        if (generatedWords.length < count) {
            LogService.warn(
                `Could not generate full set of ${count} words. Got ${generatedWords.length}.`
            );
        }

        return generatedWords;
    }

    /**
     * Parse LLM response and extract word/translation pairs
     * @param response - The raw JSON string from LLM
     * @returns Array of generated words
     * @throws Error if response format is invalid
     * @private
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
                .filter(
                    (item) =>
                        item &&
                        typeof item === 'object' &&
                        typeof item.word === 'string' &&
                        typeof item.translation === 'string' &&
                        item.word.trim() !== '' &&
                        item.translation.trim() !== ''
                )
                .map((item) => ({
                    word: item.word.trim(),
                    translation: item.translation.trim(),
                }));

            return words;
        } catch (error) {
            LogService.error('Failed to parse LLM response', {
                response,
                error,
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
        count: number,
        excludedWords: string[] = []
    ): string {
        const categoriesString = categories.join(', ');
        let prompt = `Generate ${count} basic vocabulary words for these categories: ${categoriesString} in ${learningLanguage} with translations to ${nativeLanguage}.`;

        if (excludedWords.length > 0) {
            const recentExclusions = excludedWords
                .slice(-PRESET_WORDS_EXCLUDED_WORDS_LIMIT)
                .join(', ');
            prompt += `\nDo NOT include the following words: ${recentExclusions}.`;
        }

        return prompt;
    }

    /**
     * Generate cache key for the given parameters
     * Categories are sorted to ensure the same set of categories yields the same cache key
     * @param categories - Array of categories
     * @param learningLanguage - Language being learned
     * @param nativeLanguage - User's native language
     * @param count - Number of words
     * @returns The generated cache key string
     * @private
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
            timestamp: Date.now(),
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
