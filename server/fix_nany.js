import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Customer from './models/Customer.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const customer = await Customer.findOne({ name: /nany/i });
    if (customer) {
        customer.planType = 'starter';
        customer.subscriptionStatus = 'inactive';
        customer.autoPhase2 = false;
        await customer.save();
        console.log("Customer plan reset to starter successfully.");
    } else {
        console.log("Customer not found.");
    }
    process.exit();
});
