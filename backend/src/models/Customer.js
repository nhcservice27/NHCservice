import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const customerSchema = new mongoose.Schema({
    customerId: {
        type: String,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
        trim: true
    },
    lastPeriodDate: {
        type: Date
    },
    averageCycleLength: {
        type: Number
    },
    addresses: [{
        house: String,
        area: String,
        landmark: String,
        pincode: String,
        mapLink: String,
        label: String
    }],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    planType: {
        type: String,
        enum: ['starter', 'complete']
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'paused', 'inactive'],
        default: 'inactive'
    },
    autoPhase2: {
        type: Boolean,
        default: false
    },
    nextDeliveryDate: {
        type: Date
    },
    shippingDate: {
        type: Date
    },
    password: {
        type: String,
        select: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    }
}, {
    timestamps: true
});

// Hash password before saving (only when password is set/modified)
customerSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

customerSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
