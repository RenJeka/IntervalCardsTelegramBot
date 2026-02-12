# ICTB-39: Імплементація підключення LLM через OpenRouter API

## Мета
Інтегрувати LLM (Large Language Model) у Telegram бота через OpenRouter API для подальшої генерації наборів слів з перекладами на основі обраних користувачем категорій та мови навчання.

## Контекст
- **API провайдер**: OpenRouter (https://openrouter.ai)
- **Модель за замовчуванням**: `gpt-5-nano`
- **Формат відповіді**: JSON з масивом об'єктів `{word: string, translation: string}`
- **Архітектура**: Розділення low-level LLM сервісу від high-level бізнес-логіки

## Обмеження OpenRouter API
- **Безкоштовні користувачі**: 50 запитів/день, 20 запитів/хвилину
- **Платні користувачі ($10+)**: без обмежень на платні моделі
- **Ціноутворення**: Pay-as-you-go, комісія 5.5% при поповненні
- **Модель `gpt-5-nano`**: безкоштовна модель з обмеженнями

---

## Етап 1: Підготовка інфраструктури

### 1.1 Оновлення констант
**Файл**: `src/const/common.ts`

**Зміни**:
```typescript
// LLM Configuration
export const DEFAULT_LLM_MODEL = 'openai/gpt-5-nano';
export const DEFAULT_LLM_TEMPERATURE = 0.7;
export const DEFAULT_LLM_MAX_TOKENS = 500;
export const DEFAULT_WORDS_PER_SET = 10;

// Cache configuration
export const LLM_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
```

**Обґрунтування**:
- `DEFAULT_LLM_MODEL`: модель за замовчуванням (можна перевизначити через `.env`)
- `DEFAULT_LLM_TEMPERATURE`: баланс між креативністю (1.0) та детермінованістю (0.0)
- `DEFAULT_LLM_MAX_TOKENS`: обмеження довжини відповіді для контролю витрат
- `DEFAULT_WORDS_PER_SET`: фіксована кількість слів у наборі
- `LLM_CACHE_TTL_MS`: час життя кешу (24 години для балансу між актуальністю та економією)

---

### 1.2 Створення файлу промптів
**Файл**: `src/const/prompts.ts` (новий)

**Зміст**:
```typescript
/**
 * System prompts for LLM interactions
 */

export const WORD_SET_GENERATION_PROMPT = `You are a language learning assistant. Generate a list of basic vocabulary words for language learners.

Requirements:
- Return ONLY valid JSON array without any markdown formatting or code blocks
- Each object must have "word" and "translation" fields
- Words should be appropriate for the specified category
- Translations should be accurate and commonly used
- Focus on basic, everyday vocabulary

Example format:
[{"word":"cat","translation":"кіт"},{"word":"dog","translation":"собака"}]`;

/**
 * Generates a user prompt for word set generation
 */
export function generateWordSetPrompt(
    category: string,
    learningLanguage: string,
    nativeLanguage: string,
    count: number
): string {
    return `Generate ${count} basic ${category.toLowerCase()} vocabulary words in ${learningLanguage} with translations to ${nativeLanguage}.`;
}
```

**Обґрунтування**:
- Розділення system prompt (інструкції для LLM) та user prompt (конкретний запит)
- Чіткі вимоги до формату відповіді (JSON без markdown)
- Функція `generateWordSetPrompt` для динамічної генерації запитів
- Акцент на базовій лексиці для початківців

---

### 1.3 Оновлення .env файлу
**Файл**: `.env` (приклад)

**Додати**:
```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=openai/gpt-5-nano
```

**Файл**: `.env.example` (оновити)

**Додати**:
```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-5-nano
```

---

## Етап 2: Створення TypeScript інтерфейсів

### 2.1 Інтерфейси для LLM
**Файл**: `src/common/interfaces/llm.ts` (новий)

**Зміст**:
```typescript
/**
 * OpenRouter API request/response interfaces
 */

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMCompletionRequest {
    model: string;
    messages: LLMMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
}

export interface LLMCompletionResponse {
    id: string;
    model: string;
    choices: {
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface LLMError {
    error: {
        message: string;
        type: string;
        code?: string;
    };
}

/**
 * High-level interfaces for word generation
 */

export interface GeneratedWord {
    word: string;
    translation: string;
}

export interface WordSetGenerationParams {
    category: string;
    learningLanguage: string;
    nativeLanguage: string;
    count: number;
}

export interface WordSetGenerationResult {
    words: GeneratedWord[];
    cached: boolean;
}
```

**Обґрунтування**:
- Розділення low-level (OpenRouter API) та high-level (бізнес-логіка) інтерфейсів
- Типізація для безпеки та автодоповнення
- `cached` флаг для моніторингу ефективності кешування

---

## Етап 3: Імплементація LLM сервісу

### 3.1 Базовий LLM сервіс
**Файл**: `src/services/llm.service.ts` (новий)

**Функціональність**:
```typescript
import axios, { AxiosError } from 'axios';
import { LogService } from './log.service';
import {
    LLMCompletionRequest,
    LLMCompletionResponse,
    LLMError,
    LLMMessage
} from '../common/interfaces/llm';
import {
    DEFAULT_LLM_MODEL,
    DEFAULT_LLM_TEMPERATURE,
    DEFAULT_LLM_MAX_TOKENS
} from '../const/common';

export class LLMService {
    private static readonly OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    private static readonly apiKey = process.env.OPENROUTER_API_KEY;
    private static readonly defaultModel = process.env.OPENROUTER_MODEL || DEFAULT_LLM_MODEL;

    /**
     * Send a completion request to OpenRouter API
     */
    static async complete(
        messages: LLMMessage[],
        options?: {
            model?: string;
            temperature?: number;
            max_tokens?: number;
        }
    ): Promise<string> {
        if (!this.apiKey) {
            throw new Error('OPENROUTER_API_KEY is not configured');
        }

        const requestBody: LLMCompletionRequest = {
            model: options?.model || this.defaultModel,
            messages,
            temperature: options?.temperature ?? DEFAULT_LLM_TEMPERATURE,
            max_tokens: options?.max_tokens ?? DEFAULT_LLM_MAX_TOKENS
        };

        try {
            const response = await axios.post<LLMCompletionResponse>(
                this.OPENROUTER_API_URL,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.APP_URL || 'https://github.com/RenJeka/IntervalCardsTelegramBot',
                        'X-Title': 'Interval Cards Telegram Bot'
                    },
                    timeout: 30000 // 30 seconds
                }
            );

            const content = response.data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Empty response from LLM');
            }

            return content;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Handle API errors and convert to user-friendly messages
     */
    private static handleError(error: unknown): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<LLMError>;
            
            if (axiosError.response) {
                const status = axiosError.response.status;
                const errorData = axiosError.response.data;

                LogService.error('OpenRouter API error', {
                    status,
                    error: errorData
                });

                switch (status) {
                    case 401:
                        throw new Error('LLM service authentication failed. Please check API key.');
                    case 429:
                        throw new Error('LLM service rate limit exceeded. Please try again later.');
                    case 500:
                    case 502:
                    case 503:
                        throw new Error('LLM service is temporarily unavailable. Please try again later.');
                    default:
                        throw new Error(`LLM service error: ${errorData?.error?.message || 'Unknown error'}`);
                }
            } else if (axiosError.code === 'ECONNABORTED') {
                throw new Error('LLM service request timeout. Please try again.');
            } else {
                throw new Error('Failed to connect to LLM service. Please check your internet connection.');
            }
        }

        LogService.error('Unexpected LLM error', error);
        throw new Error('An unexpected error occurred with LLM service.');
    }
}
```

**Ключові особливості**:
- ✅ Валідація API ключа
- ✅ Обробка всіх типів помилок (401, 429, 5xx, timeout, network)
- ✅ Логування помилок через `LogService`
- ✅ Зрозумілі користувачу повідомлення про помилки
- ✅ Timeout 30 секунд
- ✅ Метадані запиту (`HTTP-Referer`, `X-Title`) для OpenRouter analytics

---

## Етап 4: Імплементація хелпера для генерації слів

### 4.1 LLM Helper
**Файл**: `src/helpers/llm-helper.ts` (новий)

**Функціональність**:
```typescript
import { LLMService } from '../services/llm.service';
import { LogService } from '../services/log.service';
import {
    GeneratedWord,
    WordSetGenerationParams,
    WordSetGenerationResult
} from '../common/interfaces/llm';
import {
    WORD_SET_GENERATION_PROMPT,
    generateWordSetPrompt
} from '../const/prompts';
import { DEFAULT_WORDS_PER_SET } from '../const/common';

/**
 * In-memory cache for generated word sets
 * Key format: "category:learningLang:nativeLang:count"
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
            category,
            learningLanguage,
            nativeLanguage,
            count = DEFAULT_WORDS_PER_SET
        } = params;

        // Check cache first
        const cacheKey = this.getCacheKey(category, learningLanguage, nativeLanguage, count);
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            LogService.log('Word set retrieved from cache', { cacheKey });
            return {
                words: cached,
                cached: true
            };
        }

        // Generate new word set
        try {
            const userPrompt = generateWordSetPrompt(
                category,
                learningLanguage,
                nativeLanguage,
                count
            );

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

            LogService.log('Word set generated successfully', {
                category,
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
     * Generate cache key
     */
    private static getCacheKey(
        category: string,
        learningLanguage: string,
        nativeLanguage: string,
        count: number
    ): string {
        return `${category}:${learningLanguage}:${nativeLanguage}:${count}`;
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
        const TTL = 1000 * 60 * 60 * 24; // 24 hours

        if (age > TTL) {
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
        LogService.log('Word set cache cleared');
    }
}
```

**Ключові особливості**:
- ✅ In-memory кешування (простота реалізації, без залежностей)
- ✅ TTL 24 години для кешу
- ✅ Парсинг JSON з обробкою markdown блоків
- ✅ Валідація структури відповіді
- ✅ Фільтрація невалідних записів
- ✅ Детальне логування
- ✅ Метод `clearCache()` для майбутнього використання

---

## Етап 5: Тестування та валідація

### 5.1 Ручне тестування
**Створити тестовий скрипт**: `src/test-llm.ts` (тимчасовий)

```typescript
import 'dotenv/config';
import { LLMHelper } from './helpers/llm-helper';

async function testLLM() {
    console.log('🧪 Testing LLM integration...\n');

    try {
        // Test 1: Generate English words for Ukrainian speaker
        console.log('Test 1: Generating Animals vocabulary (EN → UK)');
        const result1 = await LLMHelper.generateWordSet({
            category: 'Animals',
            learningLanguage: 'English',
            nativeLanguage: 'Ukrainian',
            count: 5
        });
        console.log('✅ Result:', result1);
        console.log('Cached:', result1.cached);
        console.log('');

        // Test 2: Same request (should be cached)
        console.log('Test 2: Same request (should use cache)');
        const result2 = await LLMHelper.generateWordSet({
            category: 'Animals',
            learningLanguage: 'English',
            nativeLanguage: 'Ukrainian',
            count: 5
        });
        console.log('✅ Result:', result2);
        console.log('Cached:', result2.cached);
        console.log('');

        // Test 3: Different category
        console.log('Test 3: Different category (Food)');
        const result3 = await LLMHelper.generateWordSet({
            category: 'Food',
            learningLanguage: 'English',
            nativeLanguage: 'Ukrainian',
            count: 5
        });
        console.log('✅ Result:', result3);
        console.log('');

        console.log('🎉 All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testLLM();
```

**Запуск**:
```bash
npx ts-node src/test-llm.ts
```

### 5.2 Перевірка обробки помилок
**Тестові сценарії**:
1. ❌ Невалідний API ключ → "LLM service authentication failed"
2. ❌ Відсутній API ключ → "OPENROUTER_API_KEY is not configured"
3. ❌ Rate limit → "LLM service rate limit exceeded"
4. ❌ Timeout → "LLM service request timeout"
5. ❌ Невалідна відповідь → "Invalid response format from LLM"

---

## Етап 6: Документація

### 6.1 Оновити README.md
**Додати секцію**:

```markdown
## LLM Integration

This bot uses OpenRouter API to generate vocabulary word sets using AI.

### Configuration

Add the following to your `.env` file:

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=openai/gpt-5-nano
```

Get your API key at: https://openrouter.ai/keys

### Rate Limits

- Free tier: 50 requests/day, 20 requests/minute
- Paid tier ($10+): unlimited requests on paid models

### Caching

Generated word sets are cached for 24 hours to reduce API calls and costs.
```

### 6.2 Додати JSDoc коментарі
Всі публічні методи мають містити:
- Опис функціональності
- `@param` для параметрів
- `@returns` для повернених значень
- `@throws` для можливих помилок

---

## Етап 7: Підготовка до інтеграції

### 7.1 Експорт для використання в інших модулях
**Файл**: `src/index.ts` (оновити експорти)

```typescript
// Existing exports...

// LLM exports
export { LLMService } from './services/llm.service';
export { LLMHelper } from './helpers/llm-helper';
export * from './common/interfaces/llm';
```

### 7.2 Приклад майбутнього використання
**Псевдокод для команди `/generate_words`**:

```typescript
// У message-service.ts (майбутня імплементація)
async function handleGenerateWords(userId: string, lang: SupportedLanguage) {
    const userData = await DbAwsService.getUserData(userId);
    
    if (!userData.favoriteCategories?.length) {
        return t('errors.noFavoriteCategories', lang);
    }
    
    if (!userData.learningLanguage) {
        return t('errors.noLearningLanguage', lang);
    }
    
    try {
        const randomCategory = userData.favoriteCategories[
            Math.floor(Math.random() * userData.favoriteCategories.length)
        ];
        
        const result = await LLMHelper.generateWordSet({
            category: randomCategory,
            learningLanguage: userData.learningLanguage,
            nativeLanguage: lang,
            count: DEFAULT_WORDS_PER_SET
        });
        
        // Save words to DynamoDB
        for (const { word, translation } of result.words) {
            await DbAwsService.addUserItem({
                user_id: userId,
                word,
                translation
            });
        }
        
        return t('success.wordsGenerated', lang, { count: result.words.length });
    } catch (error) {
        LogService.error('Failed to generate words', error);
        return t('errors.llmFailed', lang);
    }
}
```

---

## Чеклист виконання

### Підготовка
- [ ] Додати константи LLM до `src/const/common.ts`
- [ ] Створити `src/const/prompts.ts` з промптами
- [ ] Оновити `.env` та `.env.example`

### Інтерфейси
- [ ] Створити `src/common/interfaces/llm.ts`

### Сервіси та хелпери
- [ ] Створити `src/services/llm.service.ts`
- [ ] Створити `src/helpers/llm-helper.ts`

### Тестування
- [ ] Створити тестовий скрипт `src/test-llm.ts`
- [ ] Протестувати успішну генерацію слів
- [ ] Протестувати кешування
- [ ] Протестувати обробку помилок (401, 429, timeout)
- [ ] Видалити тестовий скрипт після перевірки

### Документація
- [ ] Оновити README.md
- [ ] Додати JSDoc коментарі
- [ ] Оновити експорти в `src/index.ts`

---

## Наступні кроки (поза межами цього плану)

1. **Імплементація команди генерації слів**
   - Додати обробник команди `/generate_words`
   - Інтегрувати з `DbAwsService` для збереження слів
   - Додати переклади в `en.json` та `uk.json`

2. **UI для налаштувань**
   - Можливість вибору кількості слів
   - Вибір конкретної категорії або випадкової

3. **Моніторинг та аналітика**
   - Логування використання API
   - Відстеження витрат
   - Статистика кешування

4. **Розширення функціональності**
   - Підтримка прикладів використання (`example` поле)
   - Генерація фраз та ідіом
   - Персоналізація на основі рівня користувача

---

## Ризики та обмеження

### Технічні ризики
1. **Rate limits**: Безкоштовна модель обмежена 50 запитами/день
   - **Мітігація**: Кешування на 24 години, інформування користувачів про обмеження

2. **Якість відповідей**: LLM може повертати некоректні переклади
   - **Мітігація**: Валідація формату, можливість користувачу редагувати слова

3. **Доступність API**: OpenRouter може бути недоступний
   - **Мітігація**: Обробка помилок, fallback повідомлення користувачу

### Фінансові ризики
1. **Витрати на API**: При масовому використанні можуть зрости витрати
   - **Мітігація**: Кешування, моніторинг використання, встановлення лімітів

---

## Оцінка часу виконання

- **Етап 1-2** (Підготовка + Інтерфейси): ~30 хв
- **Етап 3** (LLM Service): ~1 год
- **Етап 4** (LLM Helper): ~1.5 год
- **Етап 5** (Тестування): ~45 хв
- **Етап 6-7** (Документація): ~30 хв

**Загальний час**: ~4-5 годин

---

## Висновок

Цей план забезпечує:
- ✅ Чітке розділення відповідальності (сервіс vs хелпер)
- ✅ Надійну обробку помилок
- ✅ Ефективне кешування
- ✅ Простоту розширення
- ✅ Готовність до інтеграції з існуючою кодовою базою

Після виконання цього плану у вас буде повністю функціональна інтеграція з LLM, готова для використання у генерації наборів слів та інших майбутніх фічах.
