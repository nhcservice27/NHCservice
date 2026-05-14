import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY not found in .env');
            return;
        }

        // This is a direct call to the API to list models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            let output = '✅ Available Models:\n';
            data.models.forEach(m => {
                output += `- FULLNAME: ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})\n`;
            });
            fs.writeFileSync('models_complete.txt', output);
            console.log('✅ Models written to models_complete.txt');
        } else {
            console.log('❌ No models found or error:', data);
        }
    } catch (error) {
        console.error('❌ Error listing models:', error.message);
    }
}

listModels();
