import multer from "multer";

// Memory storage (buffer available in req.file.buffer)
const storage = multer.memoryStorage();
export const upload = multer({ storage });
