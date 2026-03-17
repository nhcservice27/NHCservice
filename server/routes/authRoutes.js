import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateAuthParams } from '../middleware/validation.js';

const router = express.Router();
const getSessionCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
});

// POST /api/auth/login
router.post('/auth/login', validateAuthParams, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user by username (case-insensitive)
        const user = await User.findOne({ username: username.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Generate JWT
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        
        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set HTTP-only cookie
        res.cookie('token', token, {
            ...getSessionCookieOptions(),
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// POST /api/auth/logout
router.post('/auth/logout', (req, res) => {
    res.cookie('token', '', {
        ...getSessionCookieOptions(),
        expires: new Date(0)
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export default router;
