import Customer from '../models/Customer.js';

class CustomerRepository {
    async findById(id) {
        return await Customer.findById(id);
    }

    async findOne(query, select = '') {
        return await Customer.findOne(query).select(select);
    }

    async findAll(query = {}, sort = { createdAt: -1 }) {
        return await Customer.find(query).sort(sort);
    }

    async create(customerData) {
        const customer = new Customer(customerData);
        return await customer.save();
    }

    async update(id, updateData) {
        return await Customer.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    async delete(id) {
        return await Customer.findByIdAndDelete(id);
    }

    async count(query = {}) {
        return await Customer.countDocuments(query);
    }
}

export default new CustomerRepository();
