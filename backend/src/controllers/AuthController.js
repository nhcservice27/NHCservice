import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class AuthController {
    /**
     * @desc Login admin/staff user
     * @route POST /api/v1/auth/login
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ success: false, message: 'Username and password are required' });
            }

            const user = await User.findOne({ username: username.toLowerCase() });

            if (!user || !(await user.comparePassword(password))) {
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }

            const token = jwt.sign(
                { userId: user._id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    role: user.role,
                    username: user.username,
                    displayName: user.displayName || user.username
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error during login' });
        }
    }

    /**
     * @desc Logout user
     * @route POST /api/v1/auth/logout
     */
    async logout(req, res) {
        res.cookie('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            expires: new Date(0)
        });
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    }
}

export default new AuthController();
