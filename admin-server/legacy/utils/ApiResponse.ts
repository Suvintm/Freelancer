import { Response } from "express";

/**
 * Standardized API Response Manager
 */
class ApiResponse {
    statusCode: number;
    data: any;
    message: string;
    success: boolean;

    constructor(statusCode: number, data: any, message: string = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }

    static sendSuccess<T>(res: Response, data: T | null = null, message: string = "Success", statusCode: number = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    static sendError(res: Response, message: string = "Operation Failed", statusCode: number = 500, errors: any[] = []) {
        const response: any = {
            success: false,
            message,
        };
        if (errors && errors.length > 0) response.errors = errors;
        
        return res.status(statusCode).json(response);
    }
}

export default ApiResponse;
