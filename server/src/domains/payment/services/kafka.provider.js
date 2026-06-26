import { publishEvent } from "../../../infrastructure/queue/kafka.producer.js";
import logger from "../../../infrastructure/monitoring/logger.js";

/**
 * Kafka Payment Provider
 * 
 * Implements the PaymentProvider interface to route payment requests
 * to the external Java Spring Boot Kafka Microservice.
 */
export class KafkaProvider {
  /**
   * Publish order creation event to Kafka
   */
  async createOrder(orderData) {
    try {
      // Format matches Java service expectations
      const payload = {
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        clientId: orderData.notes?.clientId,
        editorId: orderData.notes?.editorId,
      };

      await publishEvent("payment.orders", "PAYMENT_ORDER_CREATED", payload);
      logger.info(`[PaymentAdapter] Forwarded order ${orderData.orderId} to Kafka Java Service`);
      
      return {
        success: true,
        orderId: `KAFKA_${orderData.orderId}`, // Mock Razorpay format for frontend compatibility
        amount: orderData.amount,
        currency: payload.currency,
        provider: "KAFKA_JAVA"
      };
    } catch (error) {
      logger.error(`[PaymentAdapter] Failed to forward to Kafka: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify payment (Usually handled async via Webhooks in Kafka architecture)
   */
  async verifyPayment(paymentData) {
    // In Kafka/Java architecture, the Node.js frontend might just wait for a WebSocket
    // event triggered by the Java service consuming the success payload.
    // We publish a verify request if synchronous check is forced.
    await publishEvent("payment.orders", "PAYMENT_VERIFY_REQUESTED", paymentData);
    
    return {
      success: true,
      message: "Verification request sent to Java Service"
    };
  }

  /**
   * Process refund request
   */
  async processRefund(paymentId, amount) {
    const payload = { paymentId, amount };
    await publishEvent("payment.orders", "PAYMENT_REFUND_REQUESTED", payload);
    
    return {
      success: true,
      refundId: `REFUND_KAFKA_${paymentId}`,
      amount
    };
  }
}
