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
        .notEmpty().withMessage("Name is required")
        .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2-50 characters")
        .matches(/^[a-zA-Z\s]+$/).withMessage("Name can only contain letters and spaces"),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one uppercase, one lowercase, and one number"),

    body("role")
        .notEmpty().withMessage("Role is required")
        .isIn(["editor", "client"]).withMessage("Role must be either 'editor' or 'client'"),

    validate,
];

export const loginValidator = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required"),

    validate,
];

// ============ PROFILE VALIDATORS ============

export const updateProfileValidator = [
    body("about")
        .optional().trim()
        .isLength({ max: 1000 }).withMessage("About section cannot exceed 1000 characters"),

    body("contactEmail")
        .optional().trim()
        .isEmail().withMessage("Please provide a valid contact email")
        .normalizeEmail(),

    body("country")
        .optional().trim()
        .isLength({ max: 100 }).withMessage("Country name cannot exceed 100 characters"),

    body("experience")
        .optional().trim()
        .isIn(["", "0-6 months", "6-12 months", "1-2 years", "2-3 years", "3-5 years", "5+ years"])
        .withMessage("Invalid experience value"),

    validate,
];

// ============ PORTFOLIO VALIDATORS ============

export const portfolioValidator = [
    body("title")
        .trim()
        .notEmpty().withMessage("Portfolio title is required")
        .isLength({ min: 3, max: 100 }).withMessage("Title must be between 3-100 characters"),

    body("description")
        .trim()
        .notEmpty().withMessage("Portfolio description is required")
        .isLength({ min: 10, max: 500 }).withMessage("Description must be between 10-500 characters"),

    validate,
];

// ============ COMMON ID VALIDATORS ============

export const mongoIdValidator = [
    param("id").isMongoId().withMessage("Invalid ID format"),
    validate,
];

export const userIdValidator = [
    param("userId").isMongoId().withMessage("Invalid user ID format"),
    validate,
];

// ============ GIG VALIDATORS (Phase 2) ============

export const gigValidator = [
    body("title")
        .trim()
        .notEmpty().withMessage("Gig title is required")
        .isLength({ min: 10, max: 100 }).withMessage("Title must be 10–100 characters"),

    body("description")
        .trim()
        .notEmpty().withMessage("Gig description is required")
        .isLength({ min: 30, max: 2000 }).withMessage("Description must be 30–2000 characters"),

    body("price")
        .notEmpty().withMessage("Price is required")
        .isFloat({ min: 1, max: 500000 }).withMessage("Price must be between ₹1 and ₹5,00,000"),

    body("deliveryTime")
        .notEmpty().withMessage("Delivery time is required")
        .isInt({ min: 1, max: 90 }).withMessage("Delivery time must be between 1 and 90 days"),

    body("category")
        .trim()
        .notEmpty().withMessage("Category is required"),

    validate,
];

// ============ RATING VALIDATORS (Phase 2) ============

export const ratingValidator = [
    body("rating")
        .notEmpty().withMessage("Rating is required")
        .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),

    body("comment")
        .optional().trim()
        .isLength({ max: 1000 }).withMessage("Review comment cannot exceed 1000 characters"),

    validate,
];

export const ratingResponseValidator = [
    body("response")
        .trim()
        .notEmpty().withMessage("Response cannot be empty")
        .isLength({ min: 5, max: 500 }).withMessage("Response must be 5–500 characters"),

    validate,
];

// ============ PROPOSAL VALIDATORS (Phase 2) ============

export const proposalValidator = [
    body("briefId")
        .notEmpty().withMessage("Brief ID is required")
        .isMongoId().withMessage("Invalid brief ID"),

    body("coverLetter")
        .trim()
        .notEmpty().withMessage("Cover letter is required")
        .isLength({ min: 50, max: 2000 }).withMessage("Cover letter must be 50–2000 characters"),

    body("proposedBudget")
        .notEmpty().withMessage("Proposed budget is required")
        .isFloat({ min: 1, max: 500000 }).withMessage("Budget must be between ₹1 and ₹5,00,000"),

    body("deliveryDays")
        .notEmpty().withMessage("Delivery days is required")
        .isInt({ min: 1, max: 180 }).withMessage("Delivery days must be between 1 and 180"),

    validate,
];

// ============ ORDER VALIDATORS (Phase 2) ============

export const createGigOrderValidator = [
    body("gigId")
        .notEmpty().withMessage("Gig ID is required")
        .isMongoId().withMessage("Invalid gig ID"),

    body("requirements")
        .trim()
        .notEmpty().withMessage("Project requirements are required")
        .isLength({ min: 20, max: 3000 }).withMessage("Requirements must be 20–3000 characters"),

    validate,
];

export const disputeValidator = [
    body("reason")
        .trim()
        .notEmpty().withMessage("Dispute reason is required")
        .isLength({ min: 20, max: 1000 }).withMessage("Reason must be 20–1000 characters"),

    validate,
];

export const extendDeadlineValidator = [
    body("days")
        .notEmpty().withMessage("Extension days required")
        .isInt({ min: 1, max: 30 }).withMessage("Extension must be 1–30 days"),

    body("reason")
        .trim()
        .notEmpty().withMessage("Extension reason is required")
        .isLength({ min: 10, max: 500 }).withMessage("Reason must be 10–500 characters"),

    validate,
];

// ============ SUBSCRIPTION VALIDATORS (Phase 2) ============

export const createSubscriptionOrderValidator = [
    body("planId")
        .notEmpty().withMessage("Plan ID is required")
        .isMongoId().withMessage("Invalid plan ID format"),

    validate,
];

export const verifySubscriptionPaymentValidator = [
    body("orderId").notEmpty().withMessage("Order ID required"),
    body("paymentId").notEmpty().withMessage("Payment ID required"),
    body("signature").notEmpty().withMessage("Signature required"),
    body("subscriptionId")
        .notEmpty().withMessage("Subscription ID required")
        .isMongoId().withMessage("Invalid subscription ID"),

    validate,
];
