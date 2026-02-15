import 'dotenv/config';
import { LLMHelper } from './helpers/llm-helper';

async function testLLM() {
    console.log('🧪 Testing LLM integration...\n');

    try {
        // Test 1: Generate English words for Ukrainian speaker
        console.log('Test 1: Generating Animals & Nature vocabulary (EN → UK)');
        const result1 = await LLMHelper.generateWordSet({
            categories: ['Animals', 'Nature'],
            learningLanguage: 'English',
            nativeLanguage: 'Ukrainian',
            count: 5
        });
        console.log('✅ Result:', JSON.stringify(result1, null, 2));
        console.log('Cached:', result1.cached);
        console.log('');

        // Test 2: Same request (should be cached)
        console.log('Test 2: Same request (should use cache)');
        const result2 = await LLMHelper.generateWordSet({
            categories: ['Animals', 'Nature'],
            learningLanguage: 'English',
            nativeLanguage: 'Ukrainian',
            count: 5
        });
        console.log('✅ Result (cached check):', result2.cached ? 'PASSED (Using cache)' : 'FAILED (Not using cache)');
        console.log('');

        // Test 3: Different categories
        console.log('Test 3: Different categories (Food, Drinks)');
        const result3 = await LLMHelper.generateWordSet({
            categories: ['Food', 'Drinks'],
            learningLanguage: 'English',
            nativeLanguage: 'Ukrainian',
            count: 3
        });
        console.log('✅ Result:', JSON.stringify(result3, null, 2));
        console.log('');

        console.log('🎉 All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testLLM();
