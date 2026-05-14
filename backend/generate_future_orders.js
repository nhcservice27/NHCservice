import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Customer from './models/Customer.js';
import Order from './models/Order.js';
import { generateOrderId } from './utils/idGenerator.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const customer = await Customer.findOne({ name: /nany/i });
    if (!customer) { console.log("Customer not found"); process.exit(); }

    console.log("Found customer:", customer.name, "planType:", customer.planType);

    const lastOrder = await Order.findOne({
        $or: [{ customerId: customer.customerId }, { phone: customer.phone }, { email: customer.email }]
    }).sort({ createdAt: -1 });

    if (!lastOrder) { console.log("No orders found for customer"); process.exit(); }

    console.log("Last order:", lastOrder.orderId, lastOrder.phase, lastOrder.orderStatus);

    const p1Val = 15;
    const p2Val = 15;
    const price1 = Math.round(lastOrder.totalPrice / 2);
    const price2 = lastOrder.totalPrice - price1;
    const baseDeliveryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const baseNextDeliveryDate = new Date(baseDeliveryDate.getTime() + 15 * 24 * 60 * 60 * 1000);
    const cycleLength = lastOrder.cycleLength || 30;

    for (let cycle = 1; cycle <= 2; cycle++) {
        const cycleDaysToAdd = cycle * cycleLength;

        const orderId1 = await generateOrderId(customer.customerId || customer._id.toString().slice(-6));
        const order1 = new Order({
            customerId: customer.customerId,
            orderId: orderId1,
            fullName: lastOrder.fullName,
            phone: lastOrder.phone,
            email: lastOrder.email || '',
            age: lastOrder.age,
            periodsStarted: new Date(lastOrder.periodsStarted),
            cycleLength,
            phase: 'Phase-1',
            totalQuantity: p1Val,
            totalWeight: p1Val * 30,
            totalPrice: price1,
            address: lastOrder.address,
            paymentMethod: 'Pending',
            message: 'Subscription Future Order',
            orderStatus: 'Not Approved',
            planType: 'complete',
            subscriptionStatus: 'active',
            autoPhase2: true,
            deliveryDate: new Date(baseDeliveryDate.getTime() + cycleDaysToAdd * 24 * 60 * 60 * 1000),
        });
        const saved1 = await order1.save();
        customer.orders.push(saved1._id);
        console.log("Created order:", orderId1, "Phase-1 Not Approved");

        const orderId2 = await generateOrderId(customer.customerId || customer._id.toString().slice(-6));
        const order2 = new Order({
            customerId: customer.customerId,
            orderId: orderId2,
            fullName: lastOrder.fullName,
            phone: lastOrder.phone,
            email: lastOrder.email || '',
            age: lastOrder.age,
            periodsStarted: new Date(lastOrder.periodsStarted),
            cycleLength,
            phase: 'Phase-2',
            totalQuantity: p2Val,
            totalWeight: p2Val * 30,
            totalPrice: price2,
            address: lastOrder.address,
            paymentMethod: 'Pending',
            message: 'Subscription Auto-Order',
            orderStatus: 'Not Approved',
            planType: 'complete',
            subscriptionStatus: 'active',
            autoPhase2: false,
            deliveryDate: new Date(baseNextDeliveryDate.getTime() + cycleDaysToAdd * 24 * 60 * 60 * 1000),
        });
        const saved2 = await order2.save();
        customer.orders.push(saved2._id);
        console.log("Created order:", orderId2, "Phase-2 Not Approved");
    }

    customer.planType = 'complete';
    customer.subscriptionStatus = 'active';
    customer.autoPhase2 = true;
    await customer.save();
    console.log("Done! 4 future Not Approved orders created and customer upgraded.");
    process.exit();
});
