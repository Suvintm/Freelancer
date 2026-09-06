/**
 * Request Coalescing (Single-Flight) Utility
 * 
 * Deduplicates concurrent identical requests.
 * If 10 clients request GET /subscriptions/plans?role=creator at the exact same millisecond,
 * only 1 call is sent to Java, and all 10 clients receive the resolved result.
 */

const inFlightMap = new Map();

/**
 * Execute an async function or join an existing in-flight promise for the same key.
 * 
 * @param {string} key - Unique identifier for the operation (e.g. "GET:/subscriptions/plans?role=creator")
 * @param {Function} fetcherFn - Async function returning a promise
 * @returns {Promise<any>}
 */
export const coalesceRequest = (key, fetcherFn) => {
  if (inFlightMap.has(key)) {
    return inFlightMap.get(key);
  }

  const promise = (async () => {
    try {
      return await fetcherFn();
    } finally {
      inFlightMap.delete(key);
    }
  })();

  inFlightMap.set(key, promise);
  return promise;
};

/**
 * Clear all in-flight promises (for testing / teardown).
 */
export const clearInFlight = () => {
  inFlightMap.clear();
};
