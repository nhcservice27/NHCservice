import { body, validationResult } from 'express-validator';

// Standard validation check function
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
        });
    }
    next();
};

export const validateOrderParams = [
    // Sanitize and validate fields
    body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
    body('message').optional().trim(),
    body('address.house').optional().trim(),
    body('address.area').optional().trim(),
    body('address.pincode').optional().trim(),
    body('address.landmark').optional().trim(),
    body('address.label').optional().trim(),
    handleValidationErrors
];

export const validateAuthParams = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').trim().notEmpty().withMessage('Password is required'),
    handleValidationErrors
];
