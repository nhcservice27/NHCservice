import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

import Order from './models/Order.js';

const RATE_P1 = parseFloat(process.env.VITE_PRICE_PER_LADDU_PHASE1 || '33.27');
const RATE_P2 = parseFloat(process.env.VITE_PRICE_PER_LADDU_PHASE2 || '33.27');
const DISCOUNT_COMPLETE = parseFloat(process.env.VITE_COMPLETE_PLAN_DISCOUNT || '0.9');

async function updatePrices() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const orders = await Order.find({ orderStatus: 'Not Approved' });
        console.log(`Found ${orders.length} future orders to update.`);

        for (const order of orders) {
            const rate = order.phase === 'Phase-1' ? RATE_P1 : RATE_P2;
            // Complete plan orders usually have DISCOUNT_COMPLETE applied in the current logic
            // Since mostly complete plans have "Not Approved" orders, we apply discount
            const newPrice = Math.round(order.totalQuantity * rate * DISCOUNT_COMPLETE);

            console.log(`Updating Order ${order.orderId}: ₹${order.totalPrice} -> ₹${newPrice} (${order.phase}, Qty: ${order.totalQuantity})`);

            order.totalPrice = newPrice;
            await order.save();
        }

        console.log('Update complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

updatePrices();
