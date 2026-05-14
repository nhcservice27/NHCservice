import Order from '../models/Order.js';

class OrderRepository {
  async findAll(query = {}) {
    return await Order.find(query).sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Order.findById(id);
  }

  async findOne(query, select = '', options = {}) {
    return await Order.findOne(query, select, options);
  }

  async create(orderData) {
    const order = new Order(orderData);
    return await order.save();
  }

  async update(id, updateData) {
    return await Order.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id) {
    return await Order.findByIdAndDelete(id);
  }

  async deleteMany(query) {
    return await Order.deleteMany(query);
  }

  async aggregate(pipeline) {
    return await Order.aggregate(pipeline);
  }

  async count(query = {}) {
    return await Order.countDocuments(query);
  }
}

export default new OrderRepository();
