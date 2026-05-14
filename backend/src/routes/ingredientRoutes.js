import express from 'express';
import IngredientController from '../controllers/IngredientController.js';
import { protect, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Ingredients
 *   description: Raw material and stock management
 */

/**
 * @swagger
 * /ingredients:
 *   get:
 *     summary: Get all ingredients
 *     tags: [Ingredients]
 *     security:
 *       - bearerAuth: []
 */
router.get('/ingredients', protect, IngredientController.getAll);

/**
 * @swagger
 * /ingredients/update:
 *   post:
 *     summary: Update or Add stock
 *     tags: [Ingredients]
 *     security:
 *       - bearerAuth: []
 */
router.post('/ingredients/update', protect, authorizeRole('Admin'), IngredientController.updateStock);

/**
 * @swagger
 * /ingredients/{id}:
 *   put:
 *     summary: Set absolute stock
 *     tags: [Ingredients]
 *     security:
 *       - bearerAuth: []
 */
router.put('/ingredients/:id', protect, authorizeRole('Admin'), IngredientController.update);

/**
 * @swagger
 * /ingredients/{id}:
 *   delete:
 *     summary: Delete ingredient
 *     tags: [Ingredients]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/ingredients/:id', protect, authorizeRole('Admin'), IngredientController.delete);

/**
 * @swagger
 * /ingredients/check-order/{orderId}:
 *   get:
 *     summary: Check stock for a specific order
 *     tags: [Ingredients]
 *     security:
 *       - bearerAuth: []
 */
router.get('/ingredients/check-order/:orderId', protect, IngredientController.checkOrderStock);

export default router;
