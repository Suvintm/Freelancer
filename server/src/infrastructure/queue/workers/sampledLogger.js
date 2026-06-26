/**
 * 📊 SAMPLED LOGGER (PRODUCTION-SAFE)
 *
 * The root cause of log flooding in production:
 * - A worker completing 100 jobs/min writes 100 log lines/min
 * - CloudWatch, Render, or Logtail charges by log volume
 *
 * Solution: Sample success logs. NEVER sample errors/warnings.
 *
 * Sample rates:
 *  - success: 5%    (1 in 20 successful jobs logged)
 *  - progress: 1%   (very noisy — almost never log)
 *  - error: 100%    (ALWAYS log errors)
 *  - warn: 100%     (ALWAYS log warnings)
 */

const SAMPLE_RATES = {
  success: 0.05,  // 5%
  progress: 0.01, // 1%
  error: 1.0,     // 100%
  warn: 1.0,      // 100%
};

function shouldLog(rate) {
  return Math.random() < rate;
}

export const sampledLogger = {
  /**
   * Log a successful operation (sampled at 5%)
   */
  success(message, meta = {}) {
    if (!shouldLog(SAMPLE_RATES.success)) return;
    console.log(JSON.stringify({
      level: "info",
      msg: message,
      ...meta,
      ts: new Date().toISOString(),
    }));
  },

  /**
   * Log a progress update (sampled at 1%)
   */
  progress(message, meta = {}) {
    if (!shouldLog(SAMPLE_RATES.progress)) return;
    console.log(JSON.stringify({
      level: "debug",
      msg: message,
      ...meta,
      ts: new Date().toISOString(),
    }));
  },

  /**
   * ALWAYS log errors — never sample these
   */
  error(message, err = {}, meta = {}) {
    console.error(JSON.stringify({
      level: "error",
      msg: message,
      error: err?.message || String(err),
      stack: err?.stack,
      ...meta,
      ts: new Date().toISOString(),
    }));
  },

  /**
   * ALWAYS log warnings — never sample these
   */
  warn(message, meta = {}) {
    console.warn(JSON.stringify({
      level: "warn",
      msg: message,
      ...meta,
      ts: new Date().toISOString(),
    }));
  },
};

export default sampledLogger;
