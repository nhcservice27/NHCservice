import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function testApiKey() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY not found in .env');
            return;
        }
        console.log('🔑 Testing API Key:', apiKey.substring(0, 10) + '...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent("Say hello!");
        console.log('✅ API Key is working!');
        console.log('🤖 Response:', result.response.text());
    } catch (error) {
        console.error('❌ API Key test failed:', error.message);
    }
}

testApiKey();
