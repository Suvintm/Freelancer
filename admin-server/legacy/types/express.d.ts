import { AdminUser } from "./auth.types.js";

declare global {
    namespace Express {
        interface Request {
            admin?: AdminUser;
        }
    }
}

export {};
