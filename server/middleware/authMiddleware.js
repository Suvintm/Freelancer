import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ApiError } from "./errorHandler.js";
import logger from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for Bearer token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new ApiError(401, "Not authorized, token missing");
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        throw new ApiError(401, "Token expired, please login again");
      }
      if (jwtError.name === "JsonWebTokenError") {
        throw new ApiError(401, "Invalid token");
      }
      throw new ApiError(401, "Token verification failed");
    }

    // Get user from database
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    logger.error("Auth Middleware Error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};

// Optional: Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user.role}' is not authorized to access this route`);
    }
    next();
  };
};

export default protect;
