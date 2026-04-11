/**
 * PRODUCTION-GRADE VALIDATION UTILITIES
 * Centralized rules for consistent UX across SuviX Mobile.
 */

/**
 * Standard Email Regex (RFC 5322 compliant snippet)
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
};

/**
 * Phone Number Validation
 * Enforces exactly 10 digits (Standard for Indian mobile numbers)
 * Adjust this if international support with +countryCode is required.
 */
export const isValidPhone = (phone: string): boolean => {
  // Remove all non-numeric characters (spaces, dashes, etc.)
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
};

/**
 * Password Strength Validation
 * Minimum 6 characters for basic production security.
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Username Format Validation
 * 3-30 characters, lowercase letters, numbers, underscores, and periods.
 * Cannot start or end with a period.
 */
export const isValidUsername = (username: string): boolean => {
  if (username.length < 3 || username.length > 30) return false;
  if (username.startsWith('.') || username.endsWith('.')) return false;
  const regex = /^[a-z0-9._]+$/;
  return regex.test(username);
};
