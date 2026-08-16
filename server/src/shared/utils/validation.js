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

const RESERVED_USERNAMES = new Set([
  'admin', 'api', 'settings', 'login', 'register', 'signup',
  'home', 'explore', 'suvix', 'support', 'help', 'about',
  'contact', 'privacy', 'terms', 'dashboard', 'profile',
  'community', 'jobs', 'gigs', 'messages', 'notifications',
  'creator', 'brand', 'editor', 'auth', 'oauth', 'app',
  'blog', 'press', 'careers', 'status', 'docs'
]);

/**
 * Username validation
 */
const isValidUsername = (username) => {
  if (!username) return false;
  const lower = username.toLowerCase().trim();
  if (lower.length < 3 || lower.length > 30) return false;
  if (lower.startsWith('.') || lower.endsWith('.')) return false;
  const regex = /^[a-z0-9._]+$/;
  if (!regex.test(lower)) return false;
  if (RESERVED_USERNAMES.has(lower)) return false;
  
  return true;
};

export {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidUsername
};
