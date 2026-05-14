import CustomerService from '../services/CustomerService.js';
import CustomerRepository from '../repositories/CustomerRepository.js';
import OrderRepository from '../repositories/OrderRepository.js';

class CustomerController {
    /**
     * @desc Check if customer exists by phone
     * @route POST /api/v1/check-customer
     */
    async checkByPhone(req, res) {
        try {
            const { phone } = req.body;
            const normalizedPhone = CustomerService.normalizePhone(phone);

            if (!normalizedPhone) {
                return res.status(400).json({ success: false, message: 'Phone number is required' });
            }

            const customer = await CustomerRepository.findOne({ phone: normalizedPhone });

            if (customer) {
                return res.status(200).json({ success: true, exists: true, data: customer });
            } else {
                return res.status(200).json({ success: true, exists: false, message: 'Customer not found' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Register new customer
     * @route POST /api/v1/customers/register
     */
    async register(req, res) {
        try {
            const customer = await CustomerService.register(req.body);
            const token = CustomerService.buildToken(customer);

            const customerData = customer.toObject();
            delete customerData.password;

            res.cookie('customerToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                customer: customerData,
                token
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Customer login
     * @route POST /api/v1/customer-login
     */
    async login(req, res) {
        try {
            const result = await CustomerService.login(req.body.identity, req.body.password);
            
            if (result.needsPasswordSetup) {
                return res.status(200).json({
                    success: false,
                    needsPasswordSetup: true,
                    message: 'Please set your password first',
                    identity: result.identity
                });
            }

            const token = CustomerService.buildToken(result.customer);
            res.cookie('customerToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.status(200).json({
                success: true,
                customer: result.customer,
                orders: result.orders,
                token
            });
        } catch (error) {
            res.status(401).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Get all customers
     * @route GET /api/v1/customers
     */
    async getAll(req, res) {
        try {
            const { search } = req.query;
            const query = {};

            if (search) {
                const searchRegex = new RegExp(search, 'i');
                query.$or = [
                    { customerId: searchRegex },
                    { name: searchRegex },
                    { phone: searchRegex }
                ];
            }

            const customers = await CustomerRepository.findAll(query);
            res.status(200).json({ success: true, data: customers });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Update customer
     * @route PATCH /api/v1/customers/:id
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const customer = await CustomerRepository.findById(id);

            if (!customer) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }

            await CustomerService.handleUpgradeToComplete(customer, req.body);
            
            Object.assign(customer, req.body);
            await customer.save();

            res.status(200).json({
                success: true,
                message: 'Customer updated successfully',
                data: customer
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Delete customer
     * @route DELETE /api/v1/customers/:id
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const customer = await CustomerRepository.findById(id);
            if (!customer) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }

            await CustomerRepository.delete(id);
            await OrderRepository.deleteMany({ phone: customer.phone });

            res.status(200).json({
                success: true,
                message: 'Customer and associated orders deleted successfully'
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * @desc Add address
     * @route POST /api/v1/customers/:id/addresses
     */
    async addAddress(req, res) {
        try {
            const { id } = req.params;
            const { house, area, pincode, label, landmark } = req.body;

            const customer = await CustomerRepository.findById(id);
            if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

            customer.addresses.push({ house, area, pincode, label: label || 'Home', landmark: landmark || '' });
            await customer.save();

            res.status(200).json({ success: true, message: 'Address added successfully', data: customer.addresses });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new CustomerController();
