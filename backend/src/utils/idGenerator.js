import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

export const generateCustomerId = async (planType = 'standard') => {
    try {
        const isCompletePlan = planType?.toLowerCase() === 'complete' || planType === "🌼 Complete Plan";
        const prefix = isCompletePlan ? '#AA' : '#A';
        const digits = isCompletePlan ? 2 : 3;

        // Find the last customer with an ID matching the specific pattern
        const regex = new RegExp(`^${prefix.replace('#', '\\#')}\\d{${digits}}$`);
        const lastCustomer = await Customer.findOne({
            customerId: { $regex: regex }
        }).sort({ customerId: -1 });

        if (!lastCustomer || !lastCustomer.customerId) {
            const startSeq = '1'.padStart(digits, '0');
            return `${prefix}${startSeq}`;
        }

        // Extract the number part
        const currentIdStr = lastCustomer.customerId.substring(prefix.length);
        const currentIdNum = parseInt(currentIdStr, 10);

        // Increment and pad
        const nextIdNum = currentIdNum + 1;
        const nextIdStr = nextIdNum.toString().padStart(digits, '0');

        return `${prefix}${nextIdStr}`;
    } catch (error) {
        console.error('Error generating customer ID:', error);
        throw error;
    }
};

export const generateOrderId = async (customerId) => {
    try {
        // Pattern: {customerId}A{sequence} -> e.g., #A001A01 or #AA01A01
        const prefix = `${customerId}A`;
        const regex = new RegExp(`^${prefix.replace('#', '\\#')}\\d{2,}$`);

        const lastOrder = await Order.findOne({
            orderId: { $regex: regex }
        }).sort({ orderId: -1 });

        if (!lastOrder || !lastOrder.orderId) {
            return `${prefix}01`;
        }

        const currentSeqStr = lastOrder.orderId.substring(prefix.length);
        const currentSeqNum = parseInt(currentSeqStr, 10);

        const nextSeqNum = currentSeqNum + 1;
        const nextSeqStr = nextSeqNum.toString().padStart(2, '0');

        return `${prefix}${nextSeqStr}`;

    } catch (error) {
        console.error('Error generating order ID:', error);
        throw error;
    }
};
