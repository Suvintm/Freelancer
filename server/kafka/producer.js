/**
 * Kafka Producer — SuviX core-api (Node.js)
 *
 * This file creates a shared Kafka producer using KafkaJS.
 * It connects to Confluent Cloud using SASL/SSL.
 *
 * Usage: import { publishEvent } from './kafka/producer.js';
 * Then call: await publishEvent('order.events', 'ORDER_COMPLETED', { orderId, ... })
 */

import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'core-api',
  brokers: [process.env.KAFKA_BROKER],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_API_KEY,
    password: process.env.KAFKA_API_SECRET,
  },
  logLevel: logLevel.WARN,  // Reduce noise in production logs
});

const producer = kafka.producer({
  allowAutoTopicCreation: false,  // Topics must be pre-created in Confluent Cloud
  idempotent: true,               // Prevent duplicate messages on retries
});

let isConnected = false;

const connect = async () => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log('[Kafka] Producer connected to Confluent Cloud ✓');
  }
};

/**
 * Publish an event to a Kafka topic.
 *
 * @param {string} topic   - Kafka topic (e.g., 'order.events')
 * @param {string} type    - Event type (e.g., 'ORDER_COMPLETED')
 * @param {object} payload - Event data
 */
export const publishEvent = async (topic, type, payload) => {
  try {
    await connect();

    const event = {
      eventId:   crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      version:   '1.0',
      source:    'core-api',
      payload,
    };

    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(event) }],
    });

    console.log(`[Kafka] Published: type=${type} topic=${topic}`);
  } catch (error) {
    // Log error but do NOT crash the request — payment was already saved
    console.error(`[Kafka] Failed to publish event type=${type}:`, error.message);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (isConnected) {
    await producer.disconnect();
    console.log('[Kafka] Producer disconnected gracefully');
  }
});
