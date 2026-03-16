import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as fs from 'fs';

// Since aiAgent.js is deeply integrated, I'll just write a quick script
// that simulates what getInitialContext does.
dotenv.config();

async function checkContext() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    // Simulate get_recent_orders
    const Order = (await import('./models/Order.js')).default;
    const recentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(5);
    console.log("Found recent orders:", recentOrders.length);
    if (recentOrders.length > 0) {
        console.log("First Order ID:", recentOrders[0].orderId || recentOrders[0]._id);
        console.log("First Order Name:", recentOrders[0].fullName);
        console.log("First Order Status:", recentOrders[0].orderStatus);
    }

    process.exit(0);
}

checkContext();
