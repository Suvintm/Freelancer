import multer from "multer";

// Memory storage (no uploads folder needed)
const storage = multer.memoryStorage();
export const upload = multer({ storage });
