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
    DEFAULT_LLM_MAX_TOKENS,
    OPENROUTER_API_URL
} from '../const/common';

export class LLMService {
    private static readonly apiKey = process.env.OPENROUTER_API_KEY;
    private static readonly llmModel = process.env.OPENROUTER_MODEL || DEFAULT_LLM_MODEL;

    /**
     * Send a completion request to OpenRouter API
     */
    static async complete(
        messages: LLMMessage[] | null,
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
            model: options?.model || this.llmModel,
            messages: messages as any,
            temperature: options?.temperature ?? DEFAULT_LLM_TEMPERATURE,
            max_tokens: options?.max_tokens ?? DEFAULT_LLM_MAX_TOKENS
        };


        // // DEBUG:

        // console.log('DEBUG: OpenRouter Request Body:', JSON.stringify(requestBody, null, 2));

        try {
            const response = await axios.post<LLMCompletionResponse>(
                OPENROUTER_API_URL,
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

            // // DEBUG:

            // console.log('DEBUG: Raw OpenRouter response:', JSON.stringify(response.data, null, 2));

            const choice = response.data.choices[0];

            // Reasoning tokens guard
            if (choice?.finish_reason === 'length') {
                const reasoningTokens = response.data.usage?.completion_tokens ?? 0;
                const hint = reasoningTokens > 0
                    ? ` (your llm model used ${reasoningTokens} reasoning-tokens — increase max_tokens)`
                    : ' (increase max_tokens)';
                throw new Error(`LLM response was cut off due to token limit${hint}`);
            }

            const content = choice?.message?.content;

            if (content == null) {
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

                // // Detailed logging for debugging
                // console.error('OpenRouter API Error Details:', {
                //     status,
                //     statusText: axiosError.response.statusText,
                //     data: errorData,
                //     headers: axiosError.response.headers
                // });

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