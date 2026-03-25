import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Customer Information
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  customerId: {
    type: String,
    // required: true // Can't be required immediately if legacy data exists without migration
    trim: true
  },
  orderId: {
    type: String,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },

  // Cycle Information
  periodsStarted: {
    type: Date,
    required: true
  },
  cycleLength: {
    type: Number,
    required: true
  },

  // Order Details
  phase: {
    type: String,
    required: true,
    enum: ['Phase-1', 'Phase-2']
  },
  totalQuantity: {
    type: Number,
    required: true
  },
  totalWeight: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },

  // Delivery Address
  address: {
    house: {
      type: String,
      trim: true
    },
    area: {
      type: String,
      trim: true
    },
    landmark: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    mapLink: {
      type: String,
      trim: true
    },
    label: {
      type: String,
      default: 'Home',
      trim: true
    }
  },

  // Payment Information
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash on Delivery', 'Online (Razorpay)', 'UPI', 'Card', 'Net Banking', 'Cash', 'Pending'],
    default: 'Cash on Delivery'
  },
  razorpayPaymentId: {
    type: String,
    trim: true
  },
  razorpayOrderId: {
    type: String,
    trim: true
  },
  razorpaySignature: {
    type: String,
    trim: true
  },

  // Order Status
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Requested', 'Not Approved'],
    default: 'Pending'
  },
  planType: {
    type: String,
    enum: ['starter', 'complete'],
    default: 'starter'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'completed'
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

  // Delivery Assignment
  deliveryBoy: {
    type: String,
    trim: true
  },
  deliveryBoyPhone: {
    type: String,
    trim: true
  },
  deliveryDate: {
    type: Date
  },

  // Additional Information
  message: {
    type: String
  },
  stockWarning: {
    type: String
  },

  // Timestamps
  orderDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields automatically
});

// Index for faster queries
orderSchema.index({ phone: 1, orderDate: -1 });
orderSchema.index({ orderStatus: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
