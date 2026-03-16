import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resetData = async () => {
    try {
        await connectDB();

        console.log('🧹 Clearing Customer collection...');
        await Customer.deleteMany({});

        console.log('🧹 Clearing Order collection...');
        await Order.deleteMany({});

        console.log('✅ Database reset successful!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
};

resetData();
