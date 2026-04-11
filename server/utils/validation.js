/**
 * PRODUCTION-GRADE BACKEND VALIDATION RULES
 * Mirroring the client-side logic to ensure data integrity at the source.
 */

/**
 * Standard Email Regex
 */
const isValidEmail = (email) => {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(String(email).trim().toLowerCase());
};

/**
 * Phone Number Validation
 * Enforces exactly 10 digits.
 */
const isValidPhone = (phone) => {
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, '');
  return digits.length === 10;
};

/**
 * Password strength check
 */
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Username validation
 */
const isValidUsername = (username) => {
  if (!username) return false;
  const lower = username.toLowerCase().trim();
  if (lower.length < 3 || lower.length > 30) return false;
  if (lower.startsWith('.') || lower.endsWith('.')) return false;
  const regex = /^[a-z0-9._]+$/;
  return regex.test(lower);
};

export {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidUsername
};
