import express from 'express';
import OrderController from '../controllers/OrderController.js';
import { protect, authorizeRole } from '../middlewares/auth.js';
import { validateOrderParams } from '../middlewares/validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management and processing
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phone, phase, totalQuantity, totalPrice, address]
 */
router.post('/orders', validateOrderParams, OrderController.create);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/orders', protect, authorizeRole('Admin'), OrderController.getAll);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 */
router.get('/orders/:id', OrderController.getById);

/**
 * @swagger
 * /orders/{id}:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/orders/:id', protect, authorizeRole('Admin'), OrderController.update);

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/orders/:id', protect, authorizeRole('Admin'), OrderController.delete);

/**
 * @swagger
 * /orders/revenue-chart:
 *   get:
 *     summary: Get revenue stats
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/orders/revenue-chart', protect, authorizeRole('Admin'), OrderController.getRevenueChart);

/**
 * @swagger
 * /customer-orders/{customerId}:
 *   get:
 *     summary: Get orders for a customer
 *     tags: [Orders]
 */
router.get('/customer-orders/:customerId', OrderController.getCustomerOrders);

/**
 * @swagger
 * /orders/export/pdf:
 *   get:
 *     summary: Export orders as PDF
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/orders/export/pdf', protect, authorizeRole('Admin'), OrderController.exportPdf);

/**
 * @swagger
 * /orders/export/csv:
 *   get:
 *     summary: Export orders as CSV
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/orders/export/csv', protect, authorizeRole('Admin'), OrderController.exportCsv);

export default router;
