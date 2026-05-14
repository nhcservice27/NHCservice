import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import CustomerRepository from '../repositories/CustomerRepository.js';
import OrderRepository from '../repositories/OrderRepository.js';
import { generateCustomerId, generateOrderId } from '../utils/idGenerator.js';
import { sendTelegramMessage } from '../utils/telegram.js';
import { sendEmail } from '../utils/email.js';
import Order from '../models/Order.js'; // Needed for direct instantiation in auto-generation

class CustomerService {
    normalizeEmail(email = '') {
        return email.trim().toLowerCase();
    }

    normalizePhone(phone = '') {
        return phone.trim();
    }

    buildToken(customer) {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        return jwt.sign({
            customerId: customer._id,
            phone: customer.phone,
            email: customer.email || null
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
    }

    getFrontendBaseUrl() {
        const FRONTEND_BASE_URL = (process.env.FRONTEND_BASE_URL || '').trim();
        if (FRONTEND_BASE_URL) return FRONTEND_BASE_URL;
        if (process.env.NODE_ENV === 'development') return 'http://localhost:8080';
        return [...(process.env.ALLOWED_ORIGINS || '').split(',')].map(o => o.trim()).find(o => o.startsWith('https://') && !o.includes('localhost')) || 'https://cycle-harmony.netlify.app';
    }

    async register(data) {
        const { email, name, phone, age, gender, password } = data;
        const normalizedEmail = this.normalizeEmail(email);
        const normalizedPhone = this.normalizePhone(phone);

        const existingByEmail = await CustomerRepository.findOne({ email: normalizedEmail });
        if (existingByEmail) throw new Error('An account with this email already exists.');

        const existingByPhone = await CustomerRepository.findOne({ phone: normalizedPhone });
        if (existingByPhone) throw new Error('An account with this phone number already exists.');

        const newCustomerId = await generateCustomerId();
        const customer = await CustomerRepository.create({
            customerId: newCustomerId,
            email: normalizedEmail,
            phone: normalizedPhone,
            name: name.trim(),
            age: Number(age),
            gender: gender || undefined,
            password,
            addresses: []
        });

        // Notify Telegram
        try {
            const telegramMsg = `🆕 *New Customer Registered!*\n*Name:* ${customer.name}\n*Email:* ${customer.email}\n*Phone:* ${customer.phone}\n*Customer ID:* ${customer.customerId}`;
            await sendTelegramMessage(telegramMsg.trim());
        } catch (err) {
            console.error('Telegram notification error:', err);
        }

        return customer;
    }

    async login(identity, password) {
        const normalizedIdentity = String(identity || '').trim();
        const isEmail = normalizedIdentity.includes('@');
        const query = isEmail ? { email: this.normalizeEmail(normalizedIdentity) } : { phone: this.normalizePhone(normalizedIdentity) };
        
        const customer = await CustomerRepository.findOne(query, '+password');
        if (!customer) throw new Error('Customer not found');

        if (!customer.password) {
            return { needsPasswordSetup: true, identity: normalizedIdentity };
        }

        const isMatch = await customer.comparePassword(password);
        if (!isMatch) throw new Error('Invalid password');

        const customerData = customer.toObject();
        delete customerData.password;

        const orders = await OrderRepository.findAll(
            isEmail ? { email: this.normalizeEmail(normalizedIdentity) } : { phone: this.normalizePhone(normalizedIdentity) }
        );

        return { customer: customerData, orders };
    }

    async handleUpgradeToComplete(customer, updates) {
        const wasStarter = customer.planType === 'starter' || !customer.planType || customer.planType === 'none';
        const isUpgradingToComplete = updates.planType === 'complete' && wasStarter;

        if (isUpgradingToComplete) {
            const lastOrder = await OrderRepository.findOne({ customerId: customer.customerId }, '', { createdAt: -1 });

            if (lastOrder) {
                const cycleLength = lastOrder.cycleLength || 30;
                const p1Val = 15; 
                const p2Val = 15;

                const RATE_P1 = parseFloat(process.env.VITE_PRICE_PER_LADDU_PHASE1 || 33.27);
                const RATE_P2 = parseFloat(process.env.VITE_PRICE_PER_LADDU_PHASE2 || 33.27);
                const DISCOUNT_COMPLETE = parseFloat(process.env.VITE_COMPLETE_PLAN_DISCOUNT || 0.9);
                
                const price1 = Math.round(p1Val * RATE_P1 * DISCOUNT_COMPLETE);
                const price2 = Math.round(p2Val * RATE_P2 * DISCOUNT_COMPLETE);

                let currentDelivery = lastOrder.deliveryDate ? new Date(lastOrder.deliveryDate) : new Date();
                let currentQtyToAdd = lastOrder.totalQuantity || 14; 
                let nextPhase = lastOrder.phase === 'Phase-1' ? 'Phase-2' : 'Phase-1';

                for (let i = 0; i < 5; i++) {
                    const isP1 = nextPhase === 'Phase-1';
                    const qty = isP1 ? p1Val : p2Val;
                    const price = isP1 ? price1 : price2;

                    const nextDelivery = new Date(currentDelivery.getTime() + currentQtyToAdd * 24 * 60 * 60 * 1000);
                    const newOrderId = await generateOrderId(customer.customerId);
                    
                    const newOrder = new Order({
                        customerId: customer.customerId,
                        orderId: newOrderId,
                        fullName: lastOrder.fullName,
                        phone: lastOrder.phone,
                        email: lastOrder.email,
                        age: lastOrder.age || 0,
                        periodsStarted: new Date(lastOrder.periodsStarted),
                        cycleLength,
                        phase: nextPhase,
                        totalQuantity: qty,
                        totalWeight: qty * 30,
                        totalPrice: price,
                        address: lastOrder.address,
                        paymentMethod: 'Pending',
                        message: 'Subscription Auto-Order',
                        orderStatus: 'Not Approved',
                        planType: 'complete',
                        subscriptionStatus: 'active',
                        autoPhase2: isP1,
                        deliveryDate: new Date(nextDelivery),
                    });
                    
                    const saved = await newOrder.save();
                    customer.orders.push(saved._id);

                    currentDelivery = nextDelivery;
                    currentQtyToAdd = qty;
                    nextPhase = isP1 ? 'Phase-2' : 'Phase-1';
                }
            }
        }
    }

    async forgotPassword(email) {
        const normalizedEmail = this.normalizeEmail(email);
        const customer = await CustomerRepository.findOne({ email: normalizedEmail }, '+passwordResetToken +passwordResetExpires');

        if (!customer) return; // Silent return for security

        const resetToken = crypto.randomBytes(32).toString('hex');
        customer.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        customer.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await customer.save({ validateBeforeSave: false });

        const baseUrl = this.getFrontendBaseUrl();
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #fce7f3; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(to right, #ec4899, #8b5cf6); padding: 24px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Cycle Harmony</h1>
                </div>
                <div style="padding: 32px; color: #1f2937;">
                    <h2>Reset Your Password</h2>
                    <p>Hi ${customer.name}, click below to set a new password. Link expires in 1 hour.</p>
                    <p style="text-align: center; margin: 32px 0;">
                        <a href="${resetUrl}" style="background: #db2777; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
                    </p>
                </div>
            </div>
        `;

        await sendEmail({
            to: customer.email,
            subject: 'Cycle Harmony - Reset Your Password',
            html
        });
    }
}

export default new CustomerService();
