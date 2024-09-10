const ErrorResponse = require("../utils/errorResponse");
const User = require('../models/userModel');



exports.signup = async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;

    // Validate if all fields are provided
    if (!firstName || !lastName || !email || !password) {
        return next(new ErrorResponse('Please provide all required fields', 400));
    }

    // Check if user already exists
    try {
        const userExist = await User.findOne({ email });
        if (userExist) {
            return next(new ErrorResponse('Email already registered', 400));
        }

        // Create new user
        const user = await User.create({ firstName, lastName, email, password });
        sendTokenResponse(user, 201, res); // Send token response after user creation
    } catch (error) {
        next(error);
    }
};

exports.signin = async (req, res, next) => {
    const { email, password } = req.body;

    // Validate if email and password are provided
    if (!email) {
        return next(new ErrorResponse('Please add an email', 400));
    }
    if (!password) {
        return next(new ErrorResponse('Please add a password', 400));
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return next(new ErrorResponse('Invalid credentials', 400));
        }

        // Check if password matches
        const isMatched = await user.comparePassword(password);
        if (!isMatched) {
            return next(new ErrorResponse('Invalid credentials', 400));
        }

        // Send token response
        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};
// Helper function to send token response
const sendTokenResponse = async (user, codeStatus, res) => {
    // Generate JWT token
    const token = await user.getJwtToken();

    // Set expiration time for cookie (1 hour)
    const oneHour = 3600000; // 1 hour in milliseconds

    // Send response with cookie
    res
        .status(codeStatus)
        .cookie("token", token, {
            httpOnly: true, // The cookie is only accessible by the web server
            expires: new Date(Date.now() + oneHour), // Cookie expiration time
            secure: process.env.NODE_ENV === 'production', // Set to true in production for HTTPS
            sameSite: 'Strict' // Cookie is sent for same-site requests only
        })
        .json({
            success: true,
            token
        });
};
exports.logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({
        success: true,
        message: "Logged out"
    });
};