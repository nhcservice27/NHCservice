import express from 'express';
import CustomerController from '../controllers/CustomerController.js';
import { protect, authorizeRole, attachOptionalCustomer } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management and authentication
 */

/**
 * @swagger
 * /customers/check-customer:
 *   post:
 *     summary: Check if customer exists by phone
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/check-customer', CustomerController.checkByPhone);

/**
 * @swagger
 * /customers/register:
 *   post:
 *     summary: Register a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, phone, age, password]
 *             properties:
 *               email: { type: string }
 *               name: { type: string }
 *               phone: { type: string }
 *               age: { type: number }
 *               gender: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Customer registered
 */
router.post('/customers/register', CustomerController.register);

/**
 * @swagger
 * /customer-login:
 *   post:
 *     summary: Customer login
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identity: { type: string, description: "Email or phone" }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/customer-login', CustomerController.login);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers (Admin only)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get('/customers', protect, authorizeRole('Admin'), CustomerController.getAll);

/**
 * @swagger
 * /customers/{id}:
 *   patch:
 *     summary: Update customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch('/customers/:id', CustomerController.update);

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/customers/:id', protect, authorizeRole('Admin'), CustomerController.delete);

/**
 * @swagger
 * /customers/{id}/addresses:
 *   post:
 *     summary: Add address to customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Address added
 */
router.post('/customers/:id/addresses', CustomerController.addAddress);

export default router;
