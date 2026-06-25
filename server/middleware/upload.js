import multer from "multer";
import os from "os";
import path from "path";

// Disk storage for temporary file uploads to prevent OOM
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});

export const upload = multer({ storage });

