import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Order from './models/Order.js';
import Customer from './models/Customer.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const notApproved = await Order.find({ orderStatus: 'Not Approved' });
    console.log("Not Approved orders count:", notApproved.length);
    if (notApproved.length > 0) {
        console.log(notApproved.map(o => `${o.orderId}: ${o.fullName} - ${o.phase}`));
    }

    const nany = await Customer.findOne({ name: /nany/i });
    if (nany) {
        console.log("nany6787 planType:", nany.planType);
        console.log("nany6787 orders count:", nany.orders.length);
    }

    process.exit();
});
