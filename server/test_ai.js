import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { processAiQuery } from './utils/aiAgent.js';

dotenv.config();

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Testing AI Query: /customer");
    const response = await processAiQuery("/customer", []);
    console.log("\n--- AI Response ---");
    console.log(response);

    process.exit(0);
}

runTest();
