/**
 * Verifies a Cloudflare Turnstile token with the Cloudflare API.
 * @param {string} token - The token provided by the client side widget.
 * @param {string} ip - The client's IP address (optional but recommended by Cloudflare).
 * @returns {Promise<boolean>} - True if verification succeeds, false otherwise.
 */
export const verifyTurnstileToken = async (token, ip = null) => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY is not defined. Skipping verification.');
    // If we're missing the key in local dev, we could return true to not block development,
    // but in production this should definitely return false.
    // For safety, let's return true only if we're not in production.
    return process.env.NODE_ENV !== 'production';
  }

  if (!token) {
    console.warn('Turnstile token is missing from the request.');
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    if (ip) {
      formData.append('remoteip', ip);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const outcome = await result.json();

    if (outcome.success) {
      return true;
    } else {
      console.error('Turnstile verification failed:', outcome['error-codes']);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Turnstile verification request timed out (5s)');
    } else {
      console.error('Error contacting Cloudflare Turnstile API:', error);
    }
    return false;
  }
};
