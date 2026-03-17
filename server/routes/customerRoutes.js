import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { protectCustomer } from '../middleware/auth.js';
import { generateCustomerId, generateOrderId } from '../utils/idGenerator.js';
import { sendTelegramMessage } from '../utils/telegram.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

// Set FRONTEND_BASE_URL in .env to your frontend URL (e.g. https://your-app.cloudfront.net for AWS)
// In development, defaults to http://localhost:8080 for local testing
const FRONTEND_BASE_URL = (process.env.FRONTEND_BASE_URL || '').trim();
const getFrontendBaseUrl = () => {
    if (FRONTEND_BASE_URL) return FRONTEND_BASE_URL;
    if (process.env.NODE_ENV === 'development') return 'http://localhost:8080';
    return [...(process.env.ALLOWED_ORIGINS || '').split(',')].map(o => o.trim()).find(o => o.startsWith('https://') && !o.includes('localhost')) || 'https://cycle-harmony.netlify.app';
};

const getSessionCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
});

const buildCustomerToken = (customer) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign({
        customerId: customer._id,
        phone: customer.phone,
        email: customer.email || null
    }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const setCustomerCookie = (res, customer) => {
    const token = buildCustomerToken(customer);

    res.cookie('customerToken', token, {
        ...getSessionCookieOptions(),
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

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

// Register new customer (email, name, phone, age, gender, password)
router.post('/customers/register', async (req, res) => {
    try {
        const { email, name, phone, age, gender, password } = req.body;

        if (!email?.trim() || !name?.trim() || !phone?.trim() || !age || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email, Name, Phone, Age, and Password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const existingByEmail = await Customer.findOne({ email: email.trim() });
        if (existingByEmail) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists. Please login instead.' });
        }

        const existingByPhone = await Customer.findOne({ phone: phone.trim() });
        if (existingByPhone) {
            return res.status(400).json({ success: false, message: 'An account with this phone number already exists.' });
        }

        const newCustomerId = await generateCustomerId();
        const customer = new Customer({
            customerId: newCustomerId,
            email: email.trim(),
            phone: phone.trim(),
            name: name.trim(),
            age: Number(age),
            gender: gender || undefined,
            password,
            addresses: []
        });
        await customer.save();

        const customerData = customer.toObject();
        delete customerData.password;
        setCustomerCookie(res, customer);

        try {
            const telegramMsg = `
🆕 *New Customer Registered!*
----------------------------
*Name:* ${name}
*Email:* ${email}
*Phone:* ${phone}
*Age:* ${age}
*Gender:* ${gender || 'Not specified'}
*Customer ID:* ${newCustomerId}
            `;
            await sendTelegramMessage(telegramMsg.trim());
        } catch (err) {
            console.error('Telegram notification error:', err);
        }

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            customer: customerData
        });
    } catch (error) {
        console.error('Error registering customer:', error);
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

// Customer Login (email or phone + password)
router.post('/customer-login', async (req, res) => {
    try {
        const { identity, password } = req.body;

        if (!identity?.trim()) {
            return res.status(400).json({ success: false, message: 'Email or phone number is required' });
        }
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        const isEmail = identity.includes('@');
        const query = isEmail ? { email: identity.trim() } : { phone: identity.trim() };
        const customer = await Customer.findOne(query).select('+password');

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // If customer has no password set (legacy), allow them to set one first
        if (!customer.password) {
            return res.status(200).json({
                success: false,
                needsPasswordSetup: true,
                message: 'Please set your password first',
                identity: identity.trim()
            });
        }

        const isMatch = await customer.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Return customer without password
        const customerData = customer.toObject();
        delete customerData.password;

        const orders = await Order.find(
            isEmail ? { email: identity.trim() } : { phone: identity.trim() }
        ).sort({ createdAt: -1 });

        setCustomerCookie(res, customer);

        res.status(200).json({
            success: true,
            customer: customerData,
            orders
        });
    } catch (error) {
        console.error('Error during customer login:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Set password for existing customer (when they have no password yet)
router.post('/customer-set-password', async (req, res) => {
    try {
        const { identity, password } = req.body;

        if (!identity?.trim()) {
            return res.status(400).json({ success: false, message: 'Email or phone number is required' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const isEmail = identity.includes('@');
        const query = isEmail ? { email: identity.trim() } : { phone: identity.trim() };
        const customer = await Customer.findOne(query).select('+password');

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (customer.password) {
            return res.status(400).json({ success: false, message: 'Password already set. Use login instead.' });
        }

        customer.password = password;
        await customer.save();

        const customerData = customer.toObject();
        delete customerData.password;

        const orders = await Order.find(
            isEmail ? { email: identity.trim() } : { phone: identity.trim() }
        ).sort({ createdAt: -1 });

        setCustomerCookie(res, customer);

        res.status(200).json({
            success: true,
            message: 'Password set successfully',
            customer: customerData,
            orders
        });
    } catch (error) {
        console.error('Error setting customer password:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Forgot password - send reset link to email
router.post('/customer-forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email?.trim()) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const customer = await Customer.findOne({ email: email.trim() }).select('+passwordResetToken +passwordResetExpires');

        if (!customer) {
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link shortly.'
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        customer.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        customer.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await customer.save({ validateBeforeSave: false });

        const baseUrl = getFrontendBaseUrl();
        if (!FRONTEND_BASE_URL && process.env.NODE_ENV !== 'development') {
            console.warn('FRONTEND_BASE_URL not set in .env - password reset links may point to wrong domain. Set it to your AWS frontend URL.');
        }
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #fce7f3; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(to right, #ec4899, #8b5cf6); padding: 24px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Cycle Harmony</h1>
                    <p style="margin: 8px 0 0; opacity: 0.8;">Password Reset Request</p>
                </div>
                <div style="padding: 32px; color: #1f2937;">
                    <h2 style="margin-top: 0;">Reset Your Password</h2>
                    <p>Hi ${customer.name},</p>
                    <p>You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
                    <p style="text-align: center; margin: 32px 0;">
                        <a href="${resetUrl}" style="background: #db2777; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </p>
                    <p style="font-size: 12px; color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
                </div>
            </div>
        `;

        await sendEmail({
            to: customer.email,
            subject: 'Cycle Harmony - Reset Your Password',
            html
        });

        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link shortly.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Reset password with token from email
router.post('/customer-reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const customer = await Customer.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() }
        }).select('+password +passwordResetToken +passwordResetExpires');

        if (!customer) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please request a new one.' });
        }

        customer.password = password;
        customer.passwordResetToken = undefined;
        customer.passwordResetExpires = undefined;
        await customer.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now login.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/customer-logout', (req, res) => {
    res.clearCookie('customerToken', getSessionCookieOptions());

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

router.get('/customer-session', protectCustomer, async (req, res) => {
    try {
        const customer = await Customer.findById(req.customerAuth.customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer session not found'
            });
        }

        res.status(200).json({
            success: true,
            customer
        });
    } catch (error) {
        console.error('Error restoring customer session:', error);
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
