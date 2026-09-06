/**
 * Lightweight Circuit Breaker with Stale Fallback
 * 
 * Protects Gateway from cascading failures when downstream microservices (Java)
 * are restarting or experiencing temporary network partitions.
 */

export class CircuitBreaker {
  constructor({
    name = 'default-breaker',
    failureThreshold = 5,
    resetTimeoutMs = 15000,
  } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.staleStore = new Map();
  }

  /**
   * Save a successful response as the fallback snapshot.
   */
  setStaleFallback(key, data) {
    this.staleStore.set(key, {
      data,
      savedAt: Date.now(),
    });
  }

  /**
   * Retrieve fallback snapshot if available.
   */
  getStaleFallback(key) {
    return this.staleStore.get(key)?.data || null;
  }

  /**
   * Execute an operation protected by this circuit breaker.
   */
  async execute(key, operationFn, fallbackFn = null) {
    const now = Date.now();

    // Check if OPEN state has expired -> try HALF_OPEN
    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        // Still OPEN -> trigger fallback immediately without hitting downstream
        if (fallbackFn) {
          return await fallbackFn(this.getStaleFallback(key));
        }
        const stale = this.getStaleFallback(key);
        if (stale) return stale;
        throw new Error(`CircuitBreaker[${this.name}] is OPEN. Downstream service unavailable.`);
      }
    }

    try {
      const result = await operationFn();
      
      // Success -> reset breaker
      if (this.state === 'HALF_OPEN' || this.failureCount > 0) {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }

      // Keep latest successful result in stale cache
      if (key && result) {
        this.setStaleFallback(key, result);
      }

      return result;
    } catch (err) {
      this.failureCount++;
      this.lastFailureTime = now;

      if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
        this.state = 'OPEN';
        console.warn(`[CircuitBreaker] Breaker '${this.name}' tripped to OPEN state. Failures: ${this.failureCount}`);
      }

      // If fallback provided or stale data exists, return gracefully
      if (fallbackFn) {
        return await fallbackFn(this.getStaleFallback(key));
      }
      const stale = this.getStaleFallback(key);
      if (stale) {
        console.warn(`[CircuitBreaker] Serving stale fallback for key '${key}' during downstream error.`);
        return stale;
      }

      throw err;
    }
  }
}

export const javaPaymentBreaker = new CircuitBreaker({
  name: 'java-payment-microservice',
  failureThreshold: 4,
  resetTimeoutMs: 15000,
});
