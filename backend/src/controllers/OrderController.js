import OrderRepository from '../repositories/OrderRepository.js';
import OrderService from '../services/OrderService.js';
import CustomerRepository from '../repositories/CustomerRepository.js';
import logger from '../utils/logger.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit-table');

class OrderController {
    /**
     * @desc Create a new order
     */
    async create(req, res) {
        try {
            const { order, customer } = await OrderService.createOrder(req.body);
            res.status(201).json({ success: true, message: 'Order placed successfully', data: order, customer });
        } catch (error) {
            logger.error('Order creation error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Get all orders
     */
    async getAll(req, res) {
        try {
            const { search, status, phase } = req.query;
            const query = {};
            if (status) query.orderStatus = status;
            if (phase) query.phase = phase;
            if (search) {
                const searchRegex = new RegExp(search, 'i');
                query.$or = [{ orderId: searchRegex }, { fullName: searchRegex }, { phone: searchRegex }];
            }
            const orders = await OrderRepository.findAll(query);
            res.status(200).json({ success: true, data: orders });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Get order by ID
     */
    async getById(req, res) {
        try {
            const order = await OrderRepository.findById(req.params.id);
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Update order status
     */
    async update(req, res) {
        try {
            const order = await OrderService.updateOrderStatus(req.params.id, req.body);
            res.status(200).json({ success: true, message: 'Order updated', data: order });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Delete order
     */
    async delete(req, res) {
        try {
            await OrderRepository.delete(req.params.id);
            res.status(200).json({ success: true, message: 'Order deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Get revenue chart data
     */
    async getRevenueChart(req, res) {
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
                        createdAt: { $gte: startDate, $lte: endDate },
                        orderStatus: { $ne: 'Cancelled' }
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

            const stats = await OrderRepository.aggregate(pipeline);
            const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
            const finalData = Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const stat = stats.find(s => s._id === day);
                return { day, revenue: stat ? stat.totalRevenue : 0, count: stat ? stat.count : 0 };
            });

            res.status(200).json({ success: true, data: finalData, month: targetMonth, year: targetYear });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Get customer orders
     */
    async getCustomerOrders(req, res) {
        try {
            const { customerId } = req.params;
            const customer = await CustomerRepository.findById(customerId);
            if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

            const query = { $or: [] };
            if (customer.phone) query.$or.push({ phone: customer.phone });
            if (customer.email) query.$or.push({ email: customer.email });

            if (query.$or.length === 0) return res.status(200).json({ success: true, orders: [] });

            const orders = await OrderRepository.findAll(query);
            res.status(200).json({ success: true, orders });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Export orders as PDF
     */
    async exportPdf(req, res) {
        try {
            const { month, year } = req.query;
            const now = new Date();
            const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
            const targetYear = year ? parseInt(year) : now.getFullYear();

            const startDate = new Date(targetYear, targetMonth - 1, 1);
            const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

            const orders = await OrderRepository.findAll({
                createdAt: { $gte: startDate, $lte: endDate }
            });

            const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            const doc = new PDFDocument({ margin: 30, size: 'A4' });

            const filename = `orders-report-${targetYear}-${targetMonth.toString().padStart(2, '0')}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

            doc.pipe(res);
            doc.fontSize(20).text('NHC SERVICE - Orders Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Period: ${new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' })} ${targetYear}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).text('Summary');
            doc.fontSize(10).text(`Total Orders: ${orders.length}`);
            doc.text(`Total Revenue: INR ${totalRevenue.toLocaleString()}`);
            doc.moveDown();

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
                datas: orders.map(o => ({
                    date: new Date(o.createdAt).toLocaleDateString(),
                    orderId: o.orderId,
                    customer: o.fullName,
                    phase: o.phase,
                    qty: o.totalQuantity,
                    amount: `INR ${o.totalPrice}`,
                    status: o.orderStatus
                }))
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
                prepareRow: () => doc.font("Helvetica").fontSize(8)
            });

            doc.end();
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error generating PDF' });
        }
    }

    /**
     * @desc Export orders as CSV
     */
    async exportCsv(req, res) {
        try {
            const { month, year } = req.query;
            const now = new Date();
            const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
            const targetYear = year ? parseInt(year) : now.getFullYear();

            const startDate = new Date(targetYear, targetMonth - 1, 1);
            const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

            const orders = await OrderRepository.findAll({
                createdAt: { $gte: startDate, $lte: endDate }
            });

            const filename = `orders-report-${targetYear}-${targetMonth.toString().padStart(2, '0')}.csv`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

            const headers = ['Date,Order ID,Customer Name,Phone,Phase,Quantity,Amount,Status'];
            const rows = orders.map(o => [
                new Date(o.createdAt).toLocaleDateString(),
                o.orderId,
                `"${o.fullName}"`,
                o.phone,
                o.phase,
                o.totalQuantity,
                o.totalPrice,
                o.orderStatus
            ].join(','));

            res.send([headers, ...rows].join('\n'));
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error generating CSV' });
        }
    }
}

export default new OrderController();
