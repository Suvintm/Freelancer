/**
 * Razorpay Payment Provider
 * Implements payment operations using Razorpay API
 */

import razorpay, { verifyPaymentSignature, isRazorpayConfigured } from "../config/razorpay.js";

export class RazorpayProvider {
  constructor() {
    if (!isRazorpayConfigured()) {
      console.warn("⚠️  Razorpay not configured - using mock mode");
    }
  }

  /**
   * Create a Razorpay order
   * @param {Object} orderData - Order details
   * @returns {Object} Razorpay order object
   */
  async createOrder(orderData) {
    if (!razorpay) {
      throw new Error("Razorpay not configured");
    }

    const { amount, currency = "INR", orderId, notes = {} } = orderData;

    // Razorpay expects amount in paise (smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt: orderId,
        notes: {
          orderId,
          ...notes,
        },
        payment_capture: 1, // Auto-capture payment
      });

      return {
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
      };
    } catch (error) {
      console.error("❌ Razorpay order creation failed:", error);
      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }

  /**
   * Verify payment after checkout
   * @param {Object} paymentData - Payment verification data
   * @returns {Object} Verification result
   */
  async verifyPayment(paymentData) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { success: false, error: "Missing payment verification data" };
    }

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return { success: false, error: "Invalid payment signature" };
    }

    try {
      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);

      return {
        success: true,
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount / 100, // Convert from paise
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        capturedAt: payment.captured ? new Date() : null,
      };
    } catch (error) {
      console.error("❌ Payment verification failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process refund
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Refund amount (in main currency unit)
   * @returns {Object} Refund result
   */
  async processRefund(paymentId, amount) {
    if (!razorpay) {
      throw new Error("Razorpay not configured");
    }

    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: Math.round(amount * 100), // Convert to paise
        speed: "normal",
        notes: {
          reason: "Order refund",
        },
      });

      return {
        success: true,
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
      };
    } catch (error) {
      console.error("❌ Refund failed:", error);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Create payout to editor using RazorpayX
   * @param {Object} editor - Editor user object
   * @param {number} amount - Payout amount
   * @returns {Object} Payout result
   */
  async createPayout(editor, amount) {
    if (!razorpay) {
      throw new Error("Razorpay not configured");
    }

    // Check if editor has fund account linked
    if (!editor.razorpayFundAccountId) {
      throw new Error("Editor has not linked bank account for payouts");
    }

    try {
      // Create payout using RazorpayX
      const payout = await razorpay.payouts.create({
        account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
        fund_account_id: editor.razorpayFundAccountId,
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        mode: "IMPS", // Instant (or NEFT/RTGS)
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: `payout_${editor._id}_${Date.now()}`,
        narration: "SuviX Editor Payout",
      });

      return {
        success: true,
        payoutId: payout.id,
        amount: payout.amount / 100,
        status: payout.status,
        mode: payout.mode,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("❌ Payout failed:", error);
      throw new Error(`Payout failed: ${error.message}`);
    }
  }

  /**
   * Create contact for editor (required for payouts)
   * @param {Object} editor - Editor user object
   * @returns {Object} Contact result
   */
  async createContact(editor) {
    if (!razorpay) {
      throw new Error("Razorpay not configured");
    }

    try {
      const contact = await razorpay.contacts.create({
        name: editor.name,
        email: editor.email,
        contact: editor.phone,
        type: "vendor",
        reference_id: editor._id.toString(),
        notes: {
          userId: editor._id.toString(),
        },
      });

      return {
        success: true,
        contactId: contact.id,
      };
    } catch (error) {
      console.error("❌ Contact creation failed:", error);
      throw new Error(`Failed to create contact: ${error.message}`);
    }
  }

  /**
   * Create fund account for editor (bank account link)
   * @param {string} contactId - Razorpay contact ID
   * @param {Object} bankDetails - Bank account details
   * @returns {Object} Fund account result
   */
  async createFundAccount(contactId, bankDetails) {
    if (!razorpay) {
      throw new Error("Razorpay not configured");
    }

    try {
      const fundAccount = await razorpay.fundAccounts.create({
        contact_id: contactId,
        account_type: "bank_account",
        bank_account: {
          name: bankDetails.accountHolderName,
          ifsc: bankDetails.ifscCode,
          account_number: bankDetails.accountNumber,
        },
      });

      return {
        success: true,
        fundAccountId: fundAccount.id,
        active: fundAccount.active,
      };
    } catch (error) {
      console.error("❌ Fund account creation failed:", error);
      throw new Error(`Failed to link bank account: ${error.message}`);
    }
  }

  /**
   * Fetch payment details
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Object} Payment details
   */
  async getPaymentDetails(paymentId) {
    if (!razorpay) {
      throw new Error("Razorpay not configured");
    }

    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return {
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          captured: payment.captured,
          refundStatus: payment.refund_status,
        },
      };
    } catch (error) {
      console.error("❌ Failed to fetch payment:", error);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }
}

export default RazorpayProvider;
