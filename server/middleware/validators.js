import { body, param, validationResult } from "express-validator";
import { ApiError } from "./errorHandler.js";

// Validation result handler
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map((err) => err.msg);
        throw new ApiError(400, messages.join(", "));
    }
    next();
};

// ============ AUTH VALIDATORS ============

export const registerValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2-50 characters")
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage("Name can only contain letters and spaces"),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one uppercase, one lowercase, and one number"),

    body("role")
        .notEmpty()
        .withMessage("Role is required")
        .isIn(["editor", "client"])
        .withMessage("Role must be either 'editor' or 'client'"),

    validate,
];

export const loginValidator = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required"),

    validate,
];

// ============ PROFILE VALIDATORS ============

export const updateProfileValidator = [
    body("about")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("About section cannot exceed 1000 characters"),

    body("contactEmail")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Please provide a valid contact email")
        .normalizeEmail(),

    body("country")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Country name cannot exceed 100 characters"),

    body("experience")
        .optional()
        .trim()
        .isIn(["", "0-6 months", "6-12 months", "1-2 years", "2-3 years", "3-5 years", "5+ years"])
        .withMessage("Invalid experience value"),

    validate,
];

// ============ PORTFOLIO VALIDATORS ============

export const portfolioValidator = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Portfolio title is required")
        .isLength({ min: 3, max: 100 })
        .withMessage("Title must be between 3-100 characters"),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("Portfolio description is required")
        .isLength({ min: 10, max: 500 })
        .withMessage("Description must be between 10-500 characters"),

    validate,
];

export const mongoIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid ID format"),

    validate,
];

export const userIdValidator = [
    param("userId")
        .isMongoId()
        .withMessage("Invalid user ID format"),

    validate,
];
