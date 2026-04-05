/**
 * KYC Controller
 * Handles Editor KYC submission and status
 */

import prisma from "../../../config/prisma.js";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import { RazorpayProvider } from "../../../services/RazorpayProvider.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { calculateProfileCompletion } from "../../profiles/utils/profileUtils.js";
import { Portfolio } from "../../profiles/models/Portfolio.js";
import logger from "../../../utils/logger.js";

/**
 * Get KYC Status
 * GET /api/profile/kyc-status
 */
export const getKYCStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [user, bankDetails] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
          kyc_status: true,
          kyc_submitted_at: true,
          kyc_verified_at: true,
          kyc_rejection_reason: true
      }
    }),
    prisma.userBankDetails.findUnique({
      where: { user_id: userId }
    })
  ]);

  res.json({
    success: true,
    kycStatus: user.kyc_status,
    kycSubmittedAt: user.kyc_submitted_at,
    kycVerifiedAt: user.kyc_verified_at,
    kycRejectionReason: user.kyc_rejection_reason,
    bankDetails: bankDetails ? {
      accountHolderName: bankDetails.account_holder_name,
      bankName: bankDetails.bank_name,
      ifscCode: bankDetails.ifsc_code,
      accountNumber: bankDetails.account_number_masked || (bankDetails.account_number_enc ? '••••' + bankDetails.account_number_enc.slice(-4) : null),
      address: {
          street: bankDetails.address_street,
          city: bankDetails.address_city,
          state: bankDetails.address_state,
          postalCode: bankDetails.address_postal_code,
          country: bankDetails.address_country
      },
      gstin: bankDetails.gstin,
    } : null,
  });
});

/**
 * Submit KYC Details
 * POST /api/profile/submit-kyc
 */
export const submitKYC = asyncHandler(async (req, res) => {
  const { 
    accountHolderName, accountNumber, ifscCode, panNumber, bankName,
    street, city, state, postalCode, country, gstin 
  } = req.body;
  const userId = req.user.id;

  if (!street) throw new ApiError(400, "Street address is required");

  // Basic Validation
  if (!accountHolderName || !accountNumber || !ifscCode || !panNumber) {
    throw new ApiError(400, "All primary fields are required");
  }

  // Process Document Uploads
  const documents = [];
  if (req.files) {
    const upload = async (fileKey, type) => {
        if (req.files[fileKey]?.[0]) {
            const result = await uploadToCloudinary(req.files[fileKey][0].buffer, "kyc-documents");
            return { doc_type: type, url: result.url };
        }
        return null;
    };
    const idProof = await upload('id_proof', 'id_proof');
    const bankProof = await upload('bank_proof', 'bank_proof');
    if (idProof) documents.push(idProof);
    if (bankProof) documents.push(bankProof);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.role !== "editor") throw new ApiError(403, "Only editors can submit KYC");
  if (user.kyc_status === "verified") throw new ApiError(400, "Already verified");

  try {
    const settings = await prisma.siteSettings.findUnique({ where: { key: 'global' } });
    if (!settings?.auto_kyc_enabled) throw new Error("Auto-KYC disabled");

    const provider = new RazorpayProvider();
    
    // Manage Razorpay Contact
    let contactId = user.razorpay_contact_id;
    if (!contactId) {
      const contact = await provider.createContact({
        name: accountHolderName,
        email: user.email,
        phone: user.phone,
        _id: user.id
      });
      contactId = contact.contactId;
    }

    // Link Bank Account to Razorpay
    const fundAccount = await provider.createFundAccount(contactId, {
      accountHolderName,
      accountNumber,
      ifscCode
    });

    // Update User & Bank Details (Auto-Verified)
    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: {
                razorpay_contact_id: contactId,
                razorpay_fund_account_id: fundAccount.fundAccountId,
                kyc_status: "verified",
                is_verified: true,
                kyc_submitted_at: new Date(),
                kyc_verified_at: new Date()
            }
        }),
        prisma.userBankDetails.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                account_holder_name: accountHolderName,
                account_number_enc: accountNumber, // Should be encrypted in production
                account_number_masked: '••••' + accountNumber.slice(-4),
                ifsc_code: ifscCode.toUpperCase(),
                bank_name: bankName,
                pan_number_enc: panNumber.toUpperCase(),
                pan_number_masked: '••••' + panNumber.slice(-4),
                gstin,
                address_street: street,
                address_city: city,
                address_state: state,
                address_postal_code: postalCode,
                address_country: country || "IN"
            },
            update: {
                account_holder_name: accountHolderName,
                account_number_enc: accountNumber,
                account_number_masked: '••••' + accountNumber.slice(-4),
                ifsc_code: ifscCode.toUpperCase(),
                bank_name: bankName,
                pan_number_enc: panNumber.toUpperCase(),
                pan_number_masked: '••••' + panNumber.slice(-4),
                gstin,
                address_street: street,
                address_city: city,
                address_state: state,
                address_postal_code: postalCode,
                address_country: country || "IN"
            }
        }),
        ...documents.map(doc => prisma.kycDocument.create({
            data: {
                user_id: userId, // Assuming relation exists or using a shared KycSubmission
                doc_type: doc.doc_type,
                url: doc.url,
                kyc_id: userId // Temporary simplified mapping
            }
        })),
        prisma.kycLog.create({
            data: {
                user_id: userId,
                user_role: "editor",
                performer_role: "system",
                action: "auto_verified",
                reason: "Razorpay automated verification"
            }
        })
    ]);

    // Recalculate Completion
    await updateCompletionScore(userId);

    res.json({ success: true, message: "KYC verified successfully", kycStatus: "verified" });

  } catch (error) {
    logger.error("Razorpay KYC auto-verify failed, falling back to manual:", error.message);

    // Save as Submitted for Manual Verification
    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { kyc_status: "submitted", kyc_submitted_at: new Date() }
        }),
        prisma.userBankDetails.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                account_holder_name: accountHolderName,
                account_number_enc: accountNumber,
                account_number_masked: '••••' + accountNumber.slice(-4),
                ifsc_code: ifscCode.toUpperCase(),
                bank_name: bankName,
                pan_number_enc: panNumber.toUpperCase(),
                pan_number_masked: '••••' + panNumber.slice(-4),
                gstin,
                address_street: street,
                address_city: city,
                address_state: state,
                address_postal_code: postalCode,
                address_country: country || "IN"
            },
            update: {
                account_holder_name: accountHolderName,
                account_number_enc: accountNumber,
                account_number_masked: '••••' + accountNumber.slice(-4),
                ifsc_code: ifscCode.toUpperCase(),
                bank_name: bankName,
                pan_number_enc: panNumber.toUpperCase(),
                pan_number_masked: '••••' + panNumber.slice(-4),
                gstin,
                address_street: street,
                address_city: city,
                address_state: state,
                address_postal_code: postalCode,
                address_country: country || "IN"
            }
        }),
        prisma.kycLog.create({
            data: {
                user_id: userId,
                user_role: "editor",
                performer_role: "user",
                action: "submitted",
                reason: "Manual submission due to auto-verify failure"
            }
        })
    ]);

    await updateCompletionScore(userId);
    res.json({ success: true, message: "KYC submitted for manual review", kycStatus: "submitted" });
  }
});

async function updateCompletionScore(userId) {
    const [user, profile, portfolioCount] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.userProfile.findUnique({ where: { user_id: userId } }),
        Portfolio.countDocuments({ user: userId })
    ]);
    const percent = calculateProfileCompletion(user, profile, portfolioCount);
    await prisma.user.update({
        where: { id: userId },
        data: { profile_completion_percent: percent, profile_completed: percent >= 100 }
    });
}

/**
 * Lookup IFSC Code
 */
export const lookupIFSC = asyncHandler(async (req, res) => {
  const { ifsc } = req.params;
  if (!ifsc || ifsc.length !== 11) throw new ApiError(400, "Invalid IFSC");
  
  try {
    const response = await fetch(`https://ifsc.razorpay.com/${ifsc.toUpperCase()}`);
    if (!response.ok) throw new ApiError(404, "IFSC not found");
    const data = await response.json();
    res.json({
        success: true,
        bank: data.BANK,
        branch: data.BRANCH,
        city: data.CITY,
        state: data.STATE,
        address: data.ADDRESS,
    });
  } catch (error) {
    throw new ApiError(404, "Could not verify IFSC code");
  }
});

export default { getKYCStatus, submitKYC, lookupIFSC };
