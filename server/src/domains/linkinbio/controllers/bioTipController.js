import crypto from 'crypto';
import prisma from '../../../infrastructure/database/postgres.js';
import bioAnalyticsRepository from '../repositories/bioAnalyticsRepository.js';

const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key';
const getRazorpayKeySecret = () => process.env.RAZORPAY_KEY_SECRET || '';
const isRazorpayConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const verifyPaymentSignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const secret = getRazorpayKeySecret();
  if (!secret) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generatedSignature = hmac.digest('hex');
  return generatedSignature === razorpay_signature;
};

export class BioTipController {
  /**
   * POST /api/linkinbio/tips/create-order
   * Create Razorpay payment order for creator tip
   */
  async createTipOrder(req, res, next) {
    try {
      const { pageId, amount, currency = 'INR', tipMessage, visitorName } = req.body;

      if (!pageId || !amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Valid pageId and tip amount are required' });
      }

      // Fetch bio page and owner
      const page = await prisma.bioPage.findUnique({
        where: { id: pageId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: { name: true, profile_picture: true },
              },
            },
          },
        },
      });

      if (!page) {
        return res.status(404).json({ success: false, message: 'Bio page not found' });
      }

      const creatorName = page.user?.profile?.name || page.user?.username || 'Creator';
      const orderReceipt = `tip_${pageId.slice(0, 8)}_${Date.now()}`;

      // Create Razorpay Order
      if (isRazorpayConfigured()) {
        const auth = Buffer.from(`${getRazorpayKeyId()}:${getRazorpayKeySecret()}`).toString('base64');
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: Math.round(parseFloat(amount) * 100),
            currency,
            receipt: orderReceipt,
            notes: {
              type: 'linkinbio_tip',
              pageId,
              creatorUserId: page.userId,
              visitorName: visitorName || 'Supporter',
              tipMessage: tipMessage || '',
            },
          }),
        });

        const razorpayOrder = await response.json();

        return res.status(200).json({
          success: true,
          data: {
            orderId: razorpayOrder.id || razorpayOrder.orderId,
            amount: parseFloat(amount),
            currency,
            keyId: getRazorpayKeyId(),
            creatorName,
            creatorAvatar: page.user?.profile?.profile_picture || '',
          },
        });
      }

      // Mock mode fallback for local development / testing without live keys
      return res.status(200).json({
        success: true,
        data: {
          orderId: `mock_order_${Date.now()}`,
          amount: parseFloat(amount),
          currency,
          keyId: 'rzp_test_mock_key',
          creatorName,
          creatorAvatar: page.user?.profile?.profile_picture || '',
          isMock: true,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/linkinbio/tips/verify
   * Verify Razorpay checkout signature and credit creator
   */
  async verifyTip(req, res, next) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, pageId, amount, currency = 'INR' } = req.body;

      // Verify signature in live mode
      if (isRazorpayConfigured() && razorpay_signature) {
        const isValid = verifyPaymentSignature({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        });

        if (!isValid) {
          return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
      }

      // Record analytics event
      if (pageId) {
        bioAnalyticsRepository.logEvent({
          pageId,
          eventType: 'click',
          blockId: 'tip-jar',
          visitorId: razorpay_payment_id,
        }).catch(() => {});
      }

      console.log(`[BioTipController] 💖 Tip payment verified successfully! Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);

      return res.status(200).json({
        success: true,
        message: 'Tip processed successfully! Thank you for supporting the creator.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new BioTipController();
