import OrderRepository from '../repositories/OrderRepository.js';
import CustomerRepository from '../repositories/CustomerRepository.js';
import IngredientRepository from '../repositories/IngredientRepository.js';
import { generateCustomerId, generateOrderId } from '../utils/idGenerator.js';
import { sendEmail, getOrderEmailTemplate } from '../utils/email.js';
import { sendTelegramMessage } from '../utils/telegram.js';
import logger from '../utils/logger.js';
import Order from '../models/Order.js'; // Needed for direct instantiation if repo doesn't cover all cases

class OrderService {
    async createOrder(orderData) {
        const {
            fullName, phone, email, age, periodsStarted, cycleLength,
            phase, totalQuantity, totalWeight, totalPrice, address,
            paymentMethod, message, planType, autoPhase2, deliveryDate
        } = orderData;

        // 1. Handle Customer
        const normalizedEmail = email ? email.trim().toLowerCase() : '';
        const normalizedPhone = phone.trim();

        let customer = await CustomerRepository.findOne({
            $or: [
                { phone: normalizedPhone },
                { email: normalizedEmail }
            ].filter(q => q.phone || q.email)
        });

        if (!customer) {
            const newCustomerId = await generateCustomerId();
            customer = await CustomerRepository.create({
                customerId: newCustomerId,
                name: fullName.trim(),
                phone: normalizedPhone,
                email: normalizedEmail,
                age: Number(age),
                addresses: [address]
            });
        }

        // 2. Generate Order ID
        const orderId = await generateOrderId(customer.customerId);

        // 3. Create Order
        const newOrder = await OrderRepository.create({
            customerId: customer.customerId,
            orderId,
            fullName,
            phone: normalizedPhone,
            email: normalizedEmail,
            age,
            periodsStarted: new Date(periodsStarted),
            cycleLength,
            phase,
            totalQuantity,
            totalWeight,
            totalPrice,
            address,
            paymentMethod,
            message,
            planType: planType || 'starter',
            autoPhase2: autoPhase2 || false,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        });

        // 4. Update Customer orders
        customer.orders.push(newOrder._id);
        await customer.save();

        // 5. Notifications
        this.sendNotifications(newOrder, customer);

        return { order: newOrder, customer };
    }

    async sendNotifications(order, customer) {
        // Telegram
        try {
            const telegramMsg = `🛍️ *New Order Received!*\n*Order ID:* ${order.orderId}\n*Customer:* ${order.fullName}\n*Phase:* ${order.phase}\n*Total:* ₹${order.totalPrice}`;
            await sendTelegramMessage(telegramMsg);
        } catch (err) {
            logger.error('Telegram notification error:', err);
        }

        // Email
        if (order.email) {
            try {
                const emailHtml = getOrderEmailTemplate(order);
                await sendEmail({
                    to: order.email,
                    subject: `Order Confirmation - ${order.orderId}`,
                    html: emailHtml
                });
            } catch (err) {
                logger.error('Email notification error:', err);
            }
        }
    }

    async updateOrderStatus(id, updates) {
        const order = await OrderRepository.findById(id);
        if (!order) throw new Error('Order not found');

        const oldStatus = order.orderStatus;
        Object.assign(order, updates);
        
        const updatedOrder = await order.save();

        if (oldStatus !== 'Approved' && updates.orderStatus === 'Approved') {
            await this.handleOrderApproval(updatedOrder);
        }

        return updatedOrder;
    }

    async handleOrderApproval(order) {
        // Reduce stock
        const ingredients = await IngredientRepository.findAll({ phase: order.phase });
        const gramsPerLaddu = 30;
        const totalNeeded = order.totalQuantity * gramsPerLaddu;

        for (const ing of ingredients) {
            ing.stockGrams -= totalNeeded;
            await ing.save();
            
            if (ing.stockGrams < (ing.minThreshold || 500)) {
                await sendTelegramMessage(`⚠️ *Low Stock Alert!*\n*Ingredient:* ${ing.name}\n*Current Stock:* ${ing.stockGrams}g`);
            }
        }
    }
}

export default new OrderService();
