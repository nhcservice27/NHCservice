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
    body('fullName').optional().trim().escape().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().trim().escape().notEmpty().withMessage('Phone cannot be empty'),
    body('message').optional().trim().escape(),
    body('address.house').optional().trim().escape(),
    body('address.area').optional().trim().escape(),
    body('address.pincode').optional().trim().escape(),
    body('address.landmark').optional().trim().escape(),
    body('address.label').optional().trim().escape(),
    handleValidationErrors
];

export const validateAuthParams = [
    body('username').trim().escape().notEmpty().withMessage('Username is required'),
    body('password').trim().escape().notEmpty().withMessage('Password is required'),
    handleValidationErrors
];
