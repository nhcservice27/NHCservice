import IngredientRepository from '../repositories/IngredientRepository.js';
import OrderRepository from '../repositories/OrderRepository.js';

class IngredientController {
    /**
     * @desc Get all ingredients
     * @route GET /api/v1/ingredients
     */
    async getAll(req, res) {
        try {
            const ingredients = await IngredientRepository.findAll();
            res.json({ success: true, data: ingredients });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Update or Add stock (upsert)
     * @route POST /api/v1/ingredients/update
     */
    async updateStock(req, res) {
        try {
            const { name, phase, stockGrams, minThreshold } = req.body;
            const gramsToAdd = parseFloat(stockGrams) || 0;
            const threshold = parseFloat(minThreshold) || 500;

            const ingredient = await IngredientRepository.updateStock(name, phase, gramsToAdd, threshold);
            res.json({ success: true, data: ingredient });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Reset/Set absolute stock
     * @route PUT /api/v1/ingredients/:id
     */
    async update(req, res) {
        try {
            const ingredient = await IngredientRepository.update(req.params.id, req.body);
            res.json({ success: true, data: ingredient });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Delete ingredient
     * @route DELETE /api/v1/ingredients/:id
     */
    async delete(req, res) {
        try {
            await IngredientRepository.delete(req.params.id);
            res.json({ success: true, message: 'Ingredient deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Check stock for an order
     * @route GET /api/v1/ingredients/check-order/:orderId
     */
    async checkOrderStock(req, res) {
        try {
            const order = await OrderRepository.findById(req.params.orderId);
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

            const requiredGrams = order.totalQuantity * 30;
            const ingredients = await IngredientRepository.findAll({ phase: order.phase });

            const issues = ingredients.filter(ing => ing.stockGrams < requiredGrams);

            res.json({
                success: true,
                hasStock: issues.length === 0,
                requiredGrams,
                availableIngredients: ingredients,
                issues: issues.map(i => i.name)
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new IngredientController();
