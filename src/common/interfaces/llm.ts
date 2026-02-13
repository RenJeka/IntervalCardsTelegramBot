/**
 * OpenRouter API request/response interfaces
 */

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMCompletionRequest {
    model: string;
    messages: LLMMessage[] | null;
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
    categories: string[];
    learningLanguage: string;
    nativeLanguage: string;
    count: number;
}

export interface WordSetGenerationResult {
    words: GeneratedWord[];
    cached: boolean;
}
