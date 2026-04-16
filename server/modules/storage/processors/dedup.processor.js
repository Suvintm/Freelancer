import crypto from "crypto";
import prisma from "../../../config/prisma.js";

/**
 * @param {Buffer} fileBuffer
 * @returns {string} - SHA-256 hex hash
 */
export const hashFile = (fileBuffer) => {
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
};

/**
 * @param {string} hash - SHA-256 file hash
 * @returns {Promise<object|null>} - Existing Media record or null
 */
export const findDuplicate = async (hash) => {
  try {
    const existingMedia = await prisma.media.findFirst({
      where: { 
        hash,
        status: "READY"
      },
      orderBy: { created_at: "desc" }
    });
    return existingMedia;
  } catch (error) {
    return null;
  }
};

export default { hashFile, findDuplicate };
