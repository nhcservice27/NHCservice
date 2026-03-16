import express from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Ingredient from '../models/Ingredient.js';
import { generateCustomerId, generateOrderId } from '../utils/idGenerator.js';
import { sendEmail, getOrderEmailTemplate } from '../utils/email.js';
import { sendTelegramMessage } from '../utils/telegram.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit-table');

import { protect, authorizeRole } from '../middleware/auth.js';
import { validateOrderParams } from '../middleware/validation.js';

const router = express.Router();

// Get Revenue Chart Data
router.get('/orders/revenue-chart', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;

    // Default to current date if not provided
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59); // Last day of month

    const startDateObj = startDate;
    const endDateObj = endDate;


    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: { $ne: 'Cancelled' } // Exclude cancelled orders
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          totalRevenue: { $sum: "$totalPrice" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ];

    const stats = await Order.aggregate(pipeline);

    // Fill in missing days with 0
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const finalData = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dayStat = stats.find(s => s._id === i);
      finalData.push({
        day: i,
        revenue: dayStat ? dayStat.totalRevenue : 0,
        count: dayStat ? dayStat.count : 0
      });
    }

    res.status(200).json({
      success: true,
      data: finalData,
      month: targetMonth,
      year: targetYear
    });

  } catch (error) {
    console.error('Error fetching revenue chart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue chart',
      error: error.message
    });
  }
});

// Get Orders for a specific Customer
router.get('/customer-orders/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    // Find customer to get their phone/email
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Find orders by phone OR email (only if they exist)
    const orderQuery = { $or: [] };
    if (customer.phone) orderQuery.$or.push({ phone: customer.phone });
    if (customer.email) orderQuery.$or.push({ email: customer.email });

    // If for some reason both are missing (shouldn't happen with phone required), return empty
    if (orderQuery.$or.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const orders = await Order.find(orderQuery).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer orders',
      error: error.message
    });
  }
});

// Get Monthly Summary Stats
router.get('/orders/monthly-summary', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $facet: {
          phaseStats: [
            { $match: { orderStatus: { $ne: 'Cancelled' } } },
            {
              $group: {
                _id: "$phase",
                count: { $sum: 1 },
                revenue: { $sum: "$totalPrice" }
              }
            }
          ],
          statusStats: [
            {
              $group: {
                _id: "$orderStatus",
                count: { $sum: 1 }
              }
            }
          ],
          overview: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$totalPrice" }, // Gross revenue including cancelled? Or match !Cancelled first?
                totalOrders: { $sum: 1 }
              }
            }
          ]
        }
      }
    ];

    const results = await Order.aggregate(pipeline);
    const data = results[0]; // Facet returns single doc with arrays

    // Calculate Net Revenue (excluding Cancelled) explicitly for overview if needed, 
    // but phaseStats is already filtered. We can sum phaseStats revenue.
    const netRevenue = data.phaseStats.reduce((acc, curr) => acc + curr.revenue, 0);

    res.status(200).json({
      success: true,
      data: {
        phaseStats: data.phaseStats,
        statusStats: data.statusStats,
        netRevenue
      }
    });

  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    res.status(500).json({ success: false, message: 'Error fetching summary' });
  }
});

// Get Detailed Orders Report (List)
router.get('/orders/report', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching orders report:', error);
    res.status(500).json({ success: false, message: 'Error fetching report' });
  }
});


// Export PDF Report
router.get('/orders/export/pdf', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    // Set headers
    const filename = `orders-report-${targetYear}-${targetMonth.toString().padStart(2, '0')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('NHC SERVICE - Orders Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' })} ${targetYear}`, { align: 'center' });
    doc.moveDown();

    // Summary
    doc.fontSize(14).text('Summary');
    doc.fontSize(10).text(`Total Orders: ${totalOrders}`);
    doc.text(`Total Revenue: INR ${totalRevenue.toLocaleString()}`);
    doc.moveDown();

    // Table
    const table = {
      title: "Detailed Transactions",
      headers: [
        { label: "Date", property: "date", width: 60 },
        { label: "Order ID", property: "orderId", width: 60 },
        { label: "Customer", property: "customer", width: 100 },
        { label: "Phase", property: "phase", width: 50 },
        { label: "Qty", property: "qty", width: 40 },
        { label: "Amount", property: "amount", width: 60 },
        { label: "Status", property: "status", width: 70 }
      ],
      datas: orders.map(order => ({
        date: new Date(order.createdAt).toLocaleDateString(),
        orderId: order.orderId || order._id.toString().substring(order._id.toString().length - 6).toUpperCase(),
        customer: order.fullName,
        phase: order.phase,
        qty: order.totalQuantity,
        amount: `INR ${order.totalPrice}`,
        status: order.orderStatus
      }))
    };

    doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
      prepareRow: (row, i) => doc.font("Helvetica").fontSize(8)
    });

    doc.end();

  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ success: false, message: 'Error generating PDF' });
  }
});

// Export CSV Report
router.get('/orders/export/csv', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 });

    const filename = `orders-report-${targetYear}-${targetMonth.toString().padStart(2, '0')}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    // Manual CSV generation
    const headers = ['Date,Order ID,Customer Name,Phone,Phase,Quantity,Amount,Status'];
    const rows = orders.map(order => [
      new Date(order.createdAt).toLocaleDateString(),
      order.orderId || order._id,
      `"${order.fullName}"`, // Escape quotes
      order.phone,
      order.phase,
      order.totalQuantity,
      order.totalPrice,
      order.orderStatus
    ].join(','));

    // Fix: Join with newline characters correctly for CSV
    const csvContent = [headers, ...rows].join('\n');
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ success: false, message: 'Error generating CSV' });
  }
});



// Create a new order
router.post('/orders', validateOrderParams, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      periodsStarted,
      cycleLength,
      phase,
      totalQuantity,
      totalWeight,
      totalPrice,
      address,
      paymentMethod,
      message,
      age, // Extract age
      email, // Extract email
      planType, // Starter or complete
      nextDeliveryDate,
      shippingDate,
      autoPhase2,
      phase1Qty,
      phase2Qty
    } = req.body;

    // --- DYNAMIC PRICING CONFIG ---
    const RATE_P1 = parseFloat(process.env.VITE_PRICE_PER_LADDU_PHASE1 || 33.27);
    const RATE_P2 = parseFloat(process.env.VITE_PRICE_PER_LADDU_PHASE2 || 33.27);
    const DISCOUNT_COMPLETE = parseFloat(process.env.VITE_COMPLETE_PLAN_DISCOUNT || 0.9);

    // Validate required fields
    if (!fullName || !phone || !periodsStarted || !cycleLength || !phase ||
      !totalQuantity || !totalWeight || !totalPrice || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // --- ISSUE #9: PRE-VALIDATE INGREDIENT STOCK (Non-blocking) ---
    let stockWarning = '';
    try {
      const requiredGrams = totalQuantity * 30;
      const ingredients = await Ingredient.find({ phase: phase });

      if (ingredients.length === 0) {
        stockWarning = `No ingredients found for ${phase}.`;
      } else {
        const insufficient = ingredients.filter(ing => ing.stockGrams < requiredGrams);
        if (insufficient.length > 0) {
          const itemNames = insufficient.map(i => i.name).join(', ');
          stockWarning = `Insufficient stock for ${itemNames}. We need ${requiredGrams}g, but some raw materials are low.`;
        }
      }
    } catch (err) {
      console.error('Ingredient validation error:', err);
      // Don't set warning here, or set a generic one
    }
    // --- END VALIDATION ---

    // Validate address fields (only if not a simple request)
    const isRequestOnly = phase && (req.body.orderStatus === 'Requested' || req.body.orderStatus === 'Pending');

    if (!isRequestOnly && (!address.house || !address.area || !address.pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required address fields (house, area, pincode)'
      });
    }

    // Default empty address for requests if missing
    const finalAddress = {
      house: address?.house || '',
      area: address?.area || '',
      landmark: address?.landmark || '',
      pincode: address?.pincode || '',
      mapLink: address?.mapLink || '',
      label: address?.label || 'Home'
    };

    // Link Customer & Generate IDs
    let customer;
    if (email) {
      customer = await mongoose.model('Customer').findOne({ email });
    }

    if (!customer && phone) {
      customer = await mongoose.model('Customer').findOne({ phone });
    }

    let currentCustomerId;

    if (customer) {
      // Customer exists
      if (!customer.customerId) {
        // Legacy customer (exists but no ID), generate one now
        customer.customerId = await generateCustomerId(planType);
        await customer.save();
      }
      currentCustomerId = customer.customerId;

      // Update existing customer details
      customer.name = fullName;
      if (age) customer.age = age;

      // Add address if new (deduplication)
      const isDuplicate = customer.addresses.some(addr =>
        addr.house.trim().toLowerCase() === address.house.trim().toLowerCase() &&
        addr.area.trim().toLowerCase() === address.area.trim().toLowerCase() &&
        addr.pincode.trim().toLowerCase() === address.pincode.trim().toLowerCase()
      );

      if (!isRequestOnly && !isDuplicate) {
        customer.addresses.push(finalAddress);
      }
    } else {
      // Create new customer
      const newCustomerId = await generateCustomerId(planType);
      currentCustomerId = newCustomerId;

      customer = new mongoose.model('Customer')({
        customerId: newCustomerId,
        phone,
        name: fullName,
        age: age || 0,
        addresses: (!isRequestOnly && finalAddress.house) ? [finalAddress] : [],
        orders: [], // Will push later
        email: email || undefined
      });
      await customer.save();
    }

    // Update customer email if not set
    if (customer && !customer.email && email) {
      customer.email = email;
      await customer.save();
    }

    // ROBUST SPLIT LOGIC
    const p1Raw = phase1Qty || req.body.phase1_qty;
    const p2Raw = phase2Qty || req.body.phase2_qty;
    let p1Val = parseInt(p1Raw, 10);
    let p2Val = parseInt(p2Raw, 10);

    const isCompletePlanDetect = planType?.toLowerCase() === 'complete';

    // Fallback if quantities missing for complete plan
    if (isCompletePlanDetect && (isNaN(p1Val) || isNaN(p2Val))) {
      p1Val = 12; // Default for Phase 1
      p2Val = totalQuantity - p1Val;
      if (p2Val < 0) p2Val = 0;
    }

    const isCompletePlan = isCompletePlanDetect && !isNaN(p1Val);

    console.log('Order split debug:', { planType, p1Raw, p2Raw, p1Val, p2Val, isCompletePlan });

    let savedOrder;
    let secondSavedOrder;

    if (isCompletePlan) {
      // CALCULATE PRICE FROM ENV
      const rate1 = phase === 'Phase-1' ? RATE_P1 : RATE_P2;
      const rate2 = phase === 'Phase-1' ? RATE_P2 : RATE_P1;

      const price1 = Math.round(p1Val * rate1 * DISCOUNT_COMPLETE);
      const price2 = Math.round(p2Val * rate2 * DISCOUNT_COMPLETE);

      const baseDeliveryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default expected tomorrow
      const baseNextDeliveryDate = nextDeliveryDate ? new Date(nextDeliveryDate) : new Date(baseDeliveryDate.getTime() + 15 * 24 * 60 * 60 * 1000); // +15 days approx

      savedOrder = null;

      for (let cycle = 0; cycle < 3; cycle++) {
        const cycleDaysToAdd = cycle * (cycleLength || 30);
        const isFirstCycle = cycle === 0;
        const cycleStatus = isFirstCycle ? (req.body.orderStatus || 'Pending') : 'Not Approved';

        // ORDER 1 (Current Phase for this cycle)
        const orderId1 = await generateOrderId(currentCustomerId);
        const order1 = new Order({
          customerId: currentCustomerId,
          orderId: orderId1,
          fullName, phone, email, age,
          periodsStarted: new Date(periodsStarted),
          cycleLength,
          phase,
          totalQuantity: p1Val,
          totalWeight: p1Val * 30,
          totalPrice: price1,
          address: finalAddress,
          paymentMethod: isFirstCycle ? (paymentMethod || 'Cash on Delivery') : '',
          message: isFirstCycle ? (message || '') : 'Subscription Future Order',
          orderStatus: cycleStatus,
          planType: 'complete',
          subscriptionStatus: 'active',
          autoPhase2: true,
          shippingDate: isFirstCycle && shippingDate ? new Date(shippingDate) : undefined,
          nextDeliveryDate: isFirstCycle && nextDeliveryDate ? new Date(nextDeliveryDate) : undefined,
          deliveryDate: new Date(baseDeliveryDate.getTime() + cycleDaysToAdd * 24 * 60 * 60 * 1000),
          stockWarning: isFirstCycle ? stockWarning : undefined
        });
        const saved1 = await order1.save();
        customer.orders.push(saved1._id);

        if (isFirstCycle) savedOrder = saved1;

        // ORDER 2 (Next Phase for this cycle)
        const orderId2 = await generateOrderId(currentCustomerId);
        const nextPhase = phase === 'Phase-1' ? 'Phase-2' : 'Phase-1';
        const secondOrderStatus = isFirstCycle && req.body.orderStatus === 'Requested' ? 'Requested' : (isFirstCycle ? 'Pending' : 'Not Approved');

        const order2 = new Order({
          customerId: currentCustomerId,
          orderId: orderId2,
          fullName, phone, email, age,
          periodsStarted: new Date(periodsStarted),
          cycleLength,
          phase: nextPhase,
          totalQuantity: p2Val,
          totalWeight: p2Val * 30,
          totalPrice: price2,
          address: finalAddress,
          paymentMethod: isFirstCycle ? (paymentMethod || 'Cash on Delivery') : '',
          message: 'Subscription Auto-Order',
          orderStatus: secondOrderStatus,
          planType: 'complete',
          subscriptionStatus: 'active',
          autoPhase2: false,
          deliveryDate: new Date(baseNextDeliveryDate.getTime() + cycleDaysToAdd * 24 * 60 * 60 * 1000),
        });
        const saved2 = await order2.save();
        customer.orders.push(saved2._id);

        if (isFirstCycle) secondSavedOrder = saved2;
      }
    } else {
      // STANDARD FLOW
      // Generate Order ID based on Customer ID
      const newOrderId = await generateOrderId(currentCustomerId);

      // Create new order
      const order = new Order({
        customerId: currentCustomerId,
        orderId: newOrderId,
        fullName,
        phone,
        periodsStarted: new Date(periodsStarted),
        cycleLength,
        phase,
        totalQuantity,
        totalWeight,
        totalPrice: Math.round(totalQuantity * (phase === 'Phase-1' ? RATE_P1 : RATE_P2)),
        address: finalAddress,
        paymentMethod: paymentMethod || 'Cash on Delivery',
        message: message || '',
        email: email || '',
        orderStatus: req.body.orderStatus || 'Pending',
        planType: planType || 'starter',
        subscriptionStatus: planType === 'complete' ? 'active' : 'completed',
        autoPhase2: autoPhase2 || false,
        nextDeliveryDate: nextDeliveryDate ? new Date(nextDeliveryDate) : undefined,
        shippingDate: shippingDate ? new Date(shippingDate) : undefined,
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default expected tomorrow
        stockWarning: stockWarning || undefined
      });

      // Save to database
      savedOrder = await order.save();

      // Link order to customer and update cycle data
      customer.orders.push(savedOrder._id);
    }

    // Common customer updates
    customer.lastPeriodDate = new Date(periodsStarted);
    customer.averageCycleLength = cycleLength;

    // Update Subscription Info on Customer
    customer.planType = planType || 'starter';
    customer.subscriptionStatus = planType === 'complete' ? 'active' : 'inactive';
    customer.autoPhase2 = autoPhase2 || false;
    if (nextDeliveryDate) customer.nextDeliveryDate = new Date(nextDeliveryDate);
    if (shippingDate) customer.shippingDate = new Date(shippingDate);

    await customer.save();

    // --- PHASE 1: INVENTORY & NOTIFICATIONS ---
    // 1. Decrement Ingredient Stock (30g Rule) - Already validated above
    try {
      if (isCompletePlan) {
        // Order 1
        await Ingredient.updateMany({ phase: phase }, { $inc: { stockGrams: -(p1Val * 30) } });
        // Order 2
        const nextPhase = phase === 'Phase-1' ? 'Phase-2' : 'Phase-1';
        await Ingredient.updateMany({ phase: nextPhase }, { $inc: { stockGrams: -(p2Val * 30) } });
      } else {
        await Ingredient.updateMany({ phase: phase }, { $inc: { stockGrams: -(totalQuantity * 30) } });
      }
    } catch (err) { console.error('Inventory error:', err); }

    // 2. Decrement Product Stock (Legacy/Simplified)
    try {
      // This part might need more complex logic if products are tied to specific phases/quantities
      // For now, keeping it simple or removing if not relevant for split orders
      if (!isCompletePlan) { // Only decrement for single orders for now
        await Product.findOneAndUpdate(
          { name: phase },
          { $inc: { stock: -totalQuantity } }
        );
      }
    } catch (err) {
      console.error('Legacy stock decrement error:', err);
    }

    // 3. Send Telegram Notification
    try {
      let telegramMsg = `
🛍️ *New Order Received!*
------------------------
*Customer:* ${fullName}
*Phone:* ${phone}
*Plan:* ${planType === 'complete' ? 'Complete Balance' : 'Starter'}
`;

      if (isCompletePlan) {
        telegramMsg += `
✅ *Order 1:* ${savedOrder.orderId}
Phase: ${savedOrder.phase} | Qty: ${savedOrder.totalQuantity}
📅 *Order 2:* ${secondSavedOrder.orderId}
Phase: ${secondSavedOrder.phase} | Qty: ${secondSavedOrder.totalQuantity}
Next Delivery: ${nextDeliveryDate ? new Date(nextDeliveryDate).toLocaleDateString() : 'N/A'}
`;
      } else {
        telegramMsg += `
*Order ID:* ${savedOrder.orderId}
*Phase:* ${phase}
*Quantity:* ${totalQuantity} Laddus
`;
      }

      telegramMsg += `
*Total Amount:* ₹${totalPrice}
*Payment:* ${paymentMethod || 'Cash on Delivery'}

*Address:*
${address.house}, ${address.area}, ${address.pincode}
${address.mapLink ? `📍 *Map Link:* [View on Map](${address.mapLink})` : ''}

${stockWarning ? `⚠️ *STOCK WARNING:* ${stockWarning}` : ''}
      `;
      await sendTelegramMessage(telegramMsg.trim());
    } catch (err) {
      console.error('Telegram notification error:', err);
    }

    // 2. Send Email Notification
    if (email) {
      const { subject, html } = getOrderEmailTemplate(savedOrder, 'confirmation');
      await sendEmail({ to: email, subject, html });
    }
    // --- END PHASE 1 ---

    res.status(201).json({
      success: true,
      message: isCompletePlan ? 'Subscription plan active! Two orders generated.' : 'Order created successfully',
      data: savedOrder
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// Stats endpoint
router.get('/orders/stats', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
          pending: { $sum: { $cond: [{ $eq: ["$orderStatus", "Pending"] }, 1, 0] } },
          processing: { $sum: { $cond: [{ $eq: ["$orderStatus", "Processing"] }, 1, 0] } },
          shipped: { $sum: { $cond: [{ $eq: ["$orderStatus", "Shipped"] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ["$orderStatus", "Delivered"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$orderStatus", "Cancelled"] }, 1, 0] } }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalOrders: 0, totalRevenue: 0,
      pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0
    };

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

// Get all orders (with optional filters)
router.get('/orders', protect, async (req, res) => {
  try {
    // Check if MongoDB is connected


    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not connected, returning empty orders list');
      return res.status(200).json({
        success: true,
        data: [],
        totalPages: 0,
        currentPage: 1,
        totalOrders: 0,
        message: 'Database not connected - displaying empty list'
      });
    }

    const { phone, status, search, page = 1, limit = 10, deliveryBoy } = req.query;

    const query = {};

    // Exact phone match
    if (phone) query.phone = phone;

    // Delivery Boy filter (case-insensitive)
    if (deliveryBoy) query.deliveryBoy = new RegExp(`^${deliveryBoy}$`, 'i');

    // Status filter
    if (status) query.orderStatus = status;

    // General Search (ID, CustomerI D, Name, Phone)
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive
      query.$or = [
        { orderId: searchRegex },
        { customerId: searchRegex },
        { fullName: searchRegex },
        { phone: searchRegex },
        { 'address.pincode': searchRegex } // Optional: also search pincode
      ];
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalOrders: count
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Get a single order by ID
router.get('/orders/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// Update order status
router.patch('/orders/:id/status', protect, async (req, res) => {
  try {
    const { status, deliveryDate } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const updateData = { orderStatus: status };
    if (deliveryDate) {
      updateData.deliveryDate = new Date(deliveryDate);
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

// Update order details (Edit Order)
router.patch('/orders/:id', protect, async (req, res) => {
  try {
    const updates = req.body;
    const previousStatus = updates._previousStatus; // optional hint from frontend

    // Prevent updating immutable fields like _id, orderId if necessary
    delete updates._id;
    delete updates._previousStatus;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Send Telegram notification when order moves to 'Requested'
    if (updates.orderStatus === 'Requested') {
      try {
        const telegramMsg = `
📬 *Subscription Future Request Sent!*
------------------------
*Customer:* ${order.fullName}
*Phone:* ${order.phone}
*Order ID:* #${order.orderId || order._id.toString().slice(-6).toUpperCase()}
*Phase:* ${order.phase}
*Quantity:* ${order.totalQuantity} Laddus
*Amount:* ₹${order.totalPrice}
*Payment:* ${updates.paymentMethod || order.paymentMethod || 'Cash on Delivery'}

*Ship To:*
${updates.address?.house || order.address?.house}, ${updates.address?.area || order.address?.area}
Pincode: ${updates.address?.pincode || order.address?.pincode}
${(updates.address?.mapLink || order.address?.mapLink) ? `📍 Map: ${updates.address?.mapLink || order.address?.mapLink}` : ''}

📅 Estimated Delivery: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}
`.trim();
        await sendTelegramMessage(telegramMsg);
      } catch (telegramErr) {
        console.error('Telegram notification error on PATCH:', telegramErr);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
});


// Delete an order (admin only - consider adding authentication)
router.delete('/orders/:id', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message
    });
  }
});

// Get all products (inventory)
router.get('/products', protect, async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manual Email Notification
router.post('/orders/:id/notify', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.email) return res.status(400).json({ success: false, message: 'No email associated with this order' });

    const { subject, html } = getOrderEmailTemplate(order, 'update');
    const result = await sendEmail({ to: order.email, subject, html });

    res.status(200).json({ success: true, simulated: result.simulated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public: Fetch order by ID (Requested status only)
router.get('/orders/public/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.orderStatus !== 'Requested') {
      return res.status(404).json({ success: false, message: 'Order request not found or already confirmed' });
    }

    // Try to find customer profile address as a hint
    let customerProfileAddress = null;
    const customer = await Customer.findOne({ phone: order.phone });
    if (customer && customer.addresses && customer.addresses.length > 0) {
      customerProfileAddress = customer.addresses[customer.addresses.length - 1];
    }

    res.status(200).json({
      success: true,
      data: {
        ...order.toObject(),
        customerProfileAddress
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching order' });
  }
});

// Public: Confirm order (Requested -> Confirmed)
router.post('/orders/public/:id/confirm', async (req, res) => {
  try {
    const { paymentMethod, address } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order || order.orderStatus !== 'Requested') {
      return res.status(404).json({ success: false, message: 'Order request not found or already confirmed' });
    }

    // Update order with customer selections
    order.paymentMethod = paymentMethod;
    if (address) {
      order.address = {
        ...order.address,
        house: address.house,
        area: address.area,
        pincode: address.pincode,
        landmark: address.landmark || order.address?.landmark
      };
    }
    order.orderStatus = 'Confirmed';
    await order.save();

    // Notify via Telegram
    try {
      await sendTelegramMessage(`✅ *Order Confirmed by Customer!*\nOrder ID: ${order.orderId}\nCustomer: ${order.fullName}\nStatus: Confirmed`);
    } catch (err) { console.error('Telegram error:', err); }

    res.status(200).json({ success: true, message: 'Order confirmed' });
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(500).json({ success: false, message: 'Error confirming order' });
  }
});

export default router;

