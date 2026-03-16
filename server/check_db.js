import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Customer from './models/Customer.js';
import Order from './models/Order.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const customer = await Customer.findOne({ name: /nany/i });
    if (customer) {
        console.log("Customer orders length:", customer.orders.length);
        const orders = await Order.find({ _id: { $in: customer.orders } });
        console.log(orders.map(o => `${o.orderId}: ${o.phase} - ${o.orderStatus} - ${o.planType}`));
    } else {
        console.log("Customer not found.");
    }
    process.exit();
});
