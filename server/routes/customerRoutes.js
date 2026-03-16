import express from 'express';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { generateCustomerId, generateOrderId } from '../utils/idGenerator.js';
import { sendTelegramMessage } from '../utils/telegram.js';

const router = express.Router();

// Check if customer exists by phone
router.post('/check-customer', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const customer = await Customer.findOne({ phone });

        if (customer) {
            return res.status(200).json({
                success: true,
                exists: true,
                data: customer
            });
        } else {
            return res.status(200).json({
                success: true,
                exists: false,
                message: 'Customer not found'
            });
        }

    } catch (error) {
        console.error('Error checking customer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Check if customer exists by email
router.post('/check-customer-by-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const customer = await Customer.findOne({ email });

        if (customer) {
            return res.status(200).json({
                success: true,
                exists: true,
                data: customer
            });
        } else {
            return res.status(200).json({
                success: true,
                exists: false,
                message: 'Customer not found'
            });
        }

    } catch (error) {
        console.error('Error checking customer by email:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update or Create Customer Profile (can be used for initial data gathering)
router.post('/customers', async (req, res) => {
    try {
        const { phone, name, age } = req.body;

        if (!phone || !name || !age) {
            return res.status(400).json({ success: false, message: 'Phone, Name, and Age are required' });
        }

        let customer = await Customer.findOne({ phone });

        if (customer) {
            // Update existing
            customer.name = name;
            customer.age = age;
            await customer.save();
        } else {
            // Create new
            const newCustomerId = await generateCustomerId();
            customer = new Customer({
                customerId: newCustomerId,
                phone,
                name,
                age,
                addresses: []
            });
            await customer.save();

            // Notify Telegram about new customer
            try {
                const telegramMsg = `
🆕 *New Customer Registered!*
----------------------------
*Name:* ${name}
*Phone:* ${phone}
*Age:* ${age}
*Customer ID:* ${newCustomerId}
                `;
                await sendTelegramMessage(telegramMsg.trim());
            } catch (err) {
                console.error('Telegram notification error:', err);
            }
        }

        res.status(200).json({
            success: true,
            data: customer
        });

    } catch (error) {
        console.error('Error saving customer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all customers (with optional search)
router.get('/customers', async (req, res) => {
    try {
        const { search } = req.query;
        const query = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { customerId: searchRegex },
                { name: searchRegex },
                { phone: searchRegex }
            ];
        }

        const customers = await Customer.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Customer Profile with Orders (by phone)
router.get('/customer-profile/:phone', async (req, res) => {
    try {
        const { phone } = req.params;

        const customer = await Customer.findOne({ phone });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Fetch orders for this phone number
        const orders = await Order.find({ phone: phone }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            customer: customer,
            orders: orders
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Customer Profile with Orders (by email)
router.get('/customer-profile-by-email/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const customer = await Customer.findOne({ email });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Fetch orders for this email
        const orders = await Order.find({ email: email }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            customer: customer,
            orders: orders
        });

    } catch (error) {
        console.error('Error fetching profile by email:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH /customers/:id - Update customer details
router.patch('/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const wasStarter = customer.planType === 'starter' || !customer.planType || customer.planType === 'none';
        const isUpgradingToComplete = updates.planType === 'complete' && wasStarter;

        Object.assign(customer, updates);
        await customer.save();

        if (isUpgradingToComplete) {
            // Generate future orders automatically for the remainder of the 3-month cycle
            const lastOrder = await Order.findOne({ customerId: customer.customerId }).sort({ createdAt: -1 });

            if (lastOrder) {
                const p1Val = lastOrder.phase === 'Phase-1' ? lastOrder.totalQuantity : 14;
                const p2Val = lastOrder.phase === 'Phase-2' ? lastOrder.totalQuantity : 14;
                const price1 = Math.round(lastOrder.totalPrice * (p1Val / (p1Val + p2Val || 1)));
                const price2 = lastOrder.totalPrice - price1;

                const baseDeliveryDate = lastOrder.deliveryDate ? new Date(lastOrder.deliveryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
                const baseNextDeliveryDate = lastOrder.nextDeliveryDate ? new Date(lastOrder.nextDeliveryDate) : new Date(baseDeliveryDate.getTime() + 15 * 24 * 60 * 60 * 1000);
                const cycleLength = lastOrder.cycleLength || 30;

                for (let cycle = 1; cycle <= 2; cycle++) { // Cycles 2 and 3 (index 1 & 2)
                    const cycleDaysToAdd = cycle * cycleLength;

                    // ORDER 1 (Phase 1)
                    const orderId1 = await generateOrderId(customer.customerId);
                    const order1 = new Order({
                        customerId: customer.customerId,
                        orderId: orderId1,
                        fullName: lastOrder.fullName,
                        phone: lastOrder.phone,
                        email: lastOrder.email,
                        age: lastOrder.age,
                        periodsStarted: new Date(lastOrder.periodsStarted),
                        cycleLength,
                        phase: 'Phase-1',
                        totalQuantity: p1Val,
                        totalWeight: p1Val * 30,
                        totalPrice: price1,
                        address: lastOrder.address,
                        paymentMethod: '',
                        message: 'Subscription Future Order',
                        orderStatus: 'Not Approved',
                        planType: 'complete',
                        subscriptionStatus: 'active',
                        autoPhase2: true,
                        deliveryDate: new Date(baseDeliveryDate.getTime() + cycleDaysToAdd * 24 * 60 * 60 * 1000),
                    });
                    const saved1 = await order1.save();
                    customer.orders.push(saved1._id);

                    // ORDER 2 (Phase 2)
                    const orderId2 = await generateOrderId(customer.customerId);
                    const order2 = new Order({
                        customerId: customer.customerId,
                        orderId: orderId2,
                        fullName: lastOrder.fullName,
                        phone: lastOrder.phone,
                        email: lastOrder.email,
                        age: lastOrder.age,
                        periodsStarted: new Date(lastOrder.periodsStarted),
                        cycleLength,
                        phase: 'Phase-2',
                        totalQuantity: p2Val,
                        totalWeight: p2Val * 30,
                        totalPrice: price2,
                        address: lastOrder.address,
                        paymentMethod: '',
                        message: 'Subscription Auto-Order',
                        orderStatus: 'Not Approved',
                        planType: 'complete',
                        subscriptionStatus: 'active',
                        autoPhase2: false,
                        deliveryDate: new Date(baseNextDeliveryDate.getTime() + cycleDaysToAdd * 24 * 60 * 60 * 1000),
                    });
                    const saved2 = await order2.save();
                    customer.orders.push(saved2._id);
                }
                await customer.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            data: customer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /customers/:id - Delete customer and optionally their orders
router.delete('/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Delete the customer
        await Customer.findByIdAndDelete(id);

        // Optionally delete all orders associated with this customer
        // We use the phone number to link orders, so we delete orders with that phone
        await Order.deleteMany({ phone: customer.phone });

        res.status(200).json({
            success: true,
            message: 'Customer and associated orders deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add a new address to customer
router.post('/customers/:id/addresses', async (req, res) => {
    try {
        const { id } = req.params;
        const { house, area, pincode, label, landmark } = req.body;

        if (!house || !area || !pincode) {
            return res.status(400).json({ success: false, message: 'House, Area, and Pincode are required' });
        }

        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Deduplication check
        const isDuplicate = customer.addresses.some(addr =>
            addr.house.trim().toLowerCase() === house.trim().toLowerCase() &&
            addr.area.trim().toLowerCase() === area.trim().toLowerCase() &&
            addr.pincode.trim().toLowerCase() === pincode.trim().toLowerCase()
        );

        if (isDuplicate) {
            return res.status(400).json({ success: false, message: 'This address already exists' });
        }

        customer.addresses.push({ house, area, pincode, label: label || 'Home', landmark: landmark || '' });
        await customer.save();

        res.status(200).json({ success: true, message: 'Address added successfully', data: customer.addresses });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete an address from customer
router.delete('/customers/:id/addresses/:index', async (req, res) => {
    try {
        const { id, index } = req.params;

        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (index < 0 || index >= customer.addresses.length) {
            return res.status(400).json({ success: false, message: 'Invalid address index' });
        }

        customer.addresses.splice(index, 1);
        await customer.save();

        res.status(200).json({ success: true, message: 'Address deleted successfully', data: customer.addresses });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
