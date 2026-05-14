import Ingredient from '../models/Ingredient.js';

class IngredientRepository {
    async findAll(query = {}, sort = { phase: 1, name: 1 }) {
        return await Ingredient.find(query).sort(sort);
    }

    async findById(id) {
        return await Ingredient.findById(id);
    }

    async findOne(query) {
        return await Ingredient.findOne(query);
    }

    async updateStock(name, phase, gramsToAdd, threshold) {
        return await Ingredient.findOneAndUpdate(
            { name, phase },
            {
                $set: { minThreshold: threshold },
                $inc: { stockGrams: gramsToAdd }
            },
            { upsert: true, new: true }
        );
    }

    async update(id, updateData) {
        return await Ingredient.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id) {
        return await Ingredient.findByIdAndDelete(id);
    }
}

export default new IngredientRepository();
