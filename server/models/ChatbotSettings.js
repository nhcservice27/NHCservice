import mongoose from 'mongoose';

export const DEFAULT_ALLOWED_CUSTOMER_FIELDS = [
    'lastPeriodDate',
    'averageCycleLength',
    'orderDetails',
    'orderStatus',
    'nextDeliveryDate',
    'planType'
];

const chatbotSettingsSchema = new mongoose.Schema({
    enabled: {
        type: Boolean,
        default: true
    },
    welcomeMessage: {
        type: String,
        default: 'Ask me about seed cycling, your orders, and your cycle information.'
    },
    allowedCustomerFields: {
        type: [String],
        default: DEFAULT_ALLOWED_CUSTOMER_FIELDS
    }
}, {
    timestamps: true
});

export default mongoose.model('ChatbotSettings', chatbotSettingsSchema);
