import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { validateAuthParams } from '../middlewares/validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Admin and Staff authentication
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Admin/Staff login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/auth/login', validateAuthParams, AuthController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/auth/logout', AuthController.logout);

export default router;
