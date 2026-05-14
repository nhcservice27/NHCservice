import jwt from 'jsonwebtoken';

const getVerifiedToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }

    return jwt.verify(token, process.env.JWT_SECRET);
};

const protect = (req, res, next) => {
    let token;

    // Check for token in cookies first, fallback to Authorization header
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No authentication token provided'
        });
    }

    try {
        const decoded = getVerifiedToken(token);
        req.user = decoded; // { userId, username, role }
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token'
        });
    }
};

// Role-based authorization middleware
const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You do not have permission to access this resource'
            });
        }
        next();
    };
};

const protectCustomer = (req, res, next) => {
    const token = req.cookies?.customerToken
        || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : null);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Please log in to access your customer data'
        });
    }

    try {
        req.customerAuth = getVerifiedToken(token);
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired customer session'
        });
    }
};

const attachOptionalCustomer = (req, res, next) => {
    const token = req.cookies?.customerToken
        || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : null);

    if (!token) {
        req.customerAuth = null;
        return next();
    }

    try {
        req.customerAuth = getVerifiedToken(token);
    } catch (error) {
        req.customerAuth = null;
    }

    next();
};

export { protect, authorizeRole, protectCustomer, attachOptionalCustomer };
