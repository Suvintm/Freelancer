import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define human-readable format for the terminal
const humanReadableFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        if (stack) {
            log += `\n${stack}`;
        }
        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    // Default format for files is pure JSON (Enterprise standard)
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        // 1. Console transport (Terminal) -> Stays Human Readable & Colored
        new winston.transports.Console({
            format: humanReadableFormat,
        }),
        // 2. File transport for errors -> Saves as JSON
        new winston.transports.File({
            filename: path.join(__dirname, "../logs/error.log"),
            level: "error",
            maxsize: 5242880, // 5MB limit
            maxFiles: 5,      // Keep last 5 files, auto-delete older ones
        }),
        // 3. File transport for all logs -> Saves as JSON
        new winston.transports.File({
            filename: path.join(__dirname, "../logs/combined.log"),
            maxsize: 5242880, // 5MB limit
            maxFiles: 5,      // Keep last 5 files, auto-delete older ones
        }),
    ],
});

export default logger;
