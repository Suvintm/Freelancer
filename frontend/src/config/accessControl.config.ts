/**
 * Frontend Access Control & Maintenance Safety Configuration
 *
 * Use this configuration to restrict Login, Signup, and OAuth access to
 * a specific list of authorized emails while technical works / maintenance
 * are ongoing.
 */

// 🔒 Set to false to disable whitelist and allow all users to login/signup
export const ENABLE_EMAIL_WHITELIST = true;

// 📋 Allowed email addresses (case-insensitive)
export const ALLOWED_EMAILS: string[] = [
  'admin@suvix.in',
  'developer@suvix.in',
  'suvintm@gmail.com',
  'suvin@suvix.in',
  'test@suvix.in',
  // Add more authorized tester/developer emails here
];

// 💬 Friendly message shown when an unauthorized email attempts to login or signup
export const RESTRICTED_ACCESS_MESSAGE =
  'Some technical works is going behind the team. Access is temporarily restricted to authorized team members. Please check back shortly!';

/**
 * Checks if the given email is permitted to log in or register.
 * Returns true if whitelist is disabled OR if the email is in the allowed list.
 */
export function isAccessAllowed(email?: string | null): boolean {
  if (!ENABLE_EMAIL_WHITELIST) {
    return true;
  }
  if (!email) {
    return false;
  }
  const normalized = email.trim().toLowerCase();
  return ALLOWED_EMAILS.some((allowed) => allowed.trim().toLowerCase() === normalized);
}