import type {
  ConsentCategories,
  ConsentAction,
  ConsentRecord,
  ConsentLogApiPayload,
} from '../types/consent.types';
import {
  CONSENT_COOKIE_NAME,
  CURRENT_CONSENT_VERSION,
  CONSENT_EXPIRY_DAYS,
  CONSENT_SOFT_RENEWAL_DAYS,
} from '../constants/consentConfig';
import { applyScriptConsent } from './scriptLoader';

const VISITOR_ID_KEY = 'suvix_visitor_uuid';

/**
 * Retrieves or generates an anonymous visitor UUID
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'SSR_VISITOR';
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    try {
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    } catch {
      // Ignore storage errors in private mode
    }
  }
  return visitorId;
}

/**
 * Reads cookie by name directly from document.cookie
 */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Writes a cookie with 180-day max-age, SameSite=Lax, and Secure
 */
function writeCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === 'undefined') return;
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${
    isSecure ? '; Secure' : ''
  }`;
}

export const consentManager = {
  /**
   * Synchronously retrieves current consent record from cookie (or localStorage fallback)
   */
  getConsent(): ConsentRecord | null {
    try {
      const rawCookie = readCookie(CONSENT_COOKIE_NAME);
      if (rawCookie) {
        return JSON.parse(rawCookie) as ConsentRecord;
      }

      // Fallback to localStorage if cookies were cleared
      const rawStorage = localStorage.getItem(CONSENT_COOKIE_NAME);
      if (rawStorage) {
        return JSON.parse(rawStorage) as ConsentRecord;
      }
    } catch {
      return null;
    }
    return null;
  },

  /**
   * Checks whether the user has a valid, non-expired consent record with matching version
   */
  hasValidConsent(): boolean {
    const record = this.getConsent();
    if (!record) return false;

    // Check version mismatch (e.g. new vendor added)
    if (record.version !== CURRENT_CONSENT_VERSION) return false;

    // Check expiration (180 days)
    if (Date.now() > record.expiry) return false;

    return true;
  },

  /**
   * Checks if consent is nearing expiration (150-180 days) for soft reminder
   */
  isSoftRenewalDue(): boolean {
    const record = this.getConsent();
    if (!record || !this.hasValidConsent()) return false;

    const softThreshold = record.timestamp + CONSENT_SOFT_RENEWAL_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() >= softThreshold;
  },

  /**
   * Saves consent decision, updates Google Consent Mode, writes cookie, and dispatches log to backend
   */
  async saveConsent(
    categories: Partial<ConsentCategories>,
    action: ConsentAction,
    userRole?: string,
    isMinor?: boolean
  ): Promise<ConsentRecord> {
    const visitorId = getOrCreateVisitorId();
    const now = Date.now();
    const expiry = now + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const fullCategories: ConsentCategories = {
      necessary: true, // Strictly necessary is locked true
      analytics: Boolean(categories.analytics),
      functional: Boolean(categories.functional),
      marketing: Boolean(categories.marketing),
    };

    const record: ConsentRecord = {
      version: CURRENT_CONSENT_VERSION,
      timestamp: now,
      expiry,
      visitorId,
      userRole,
      categories: fullCategories,
      action,
    };

    // 1. Write cookie (primary source of truth)
    const serialized = JSON.stringify(record);
    writeCookie(CONSENT_COOKIE_NAME, serialized, CONSENT_EXPIRY_DAYS);

    // 2. Backup to localStorage
    try {
      localStorage.setItem(CONSENT_COOKIE_NAME, serialized);
    } catch {
      // In incognito mode, continue gracefully
    }

    // 3. Update Google Consent Mode and inject permitted third-party scripts
    applyScriptConsent(fullCategories);

    // 4. Notify app components via CustomEvent
    window.dispatchEvent(
      new CustomEvent('suvix_consent_changed', { detail: record })
    );

    // 5. Fire-and-forget asynchronous audit log to backend (keepalive survives page unload)
    try {
      const apiPayload: ConsentLogApiPayload = {
        visitorId,
        consentVersion: CURRENT_CONSENT_VERSION,
        userRole,
        categories: fullCategories,
        action,
        isMinor,
      };

      const apiUrl = (import.meta.env.VITE_API_URL || '') + '/api/v1/consent/log';
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
            : {}),
        },
        body: JSON.stringify(apiPayload),
        keepalive: true,
      }).catch(() => {
        // Silent catch for background audit log
      });
    } catch {
      // Fail-open for client experience
    }

    return record;
  },

  /**
   * Helper to accept all categories
   */
  async acceptAll(userRole?: string): Promise<ConsentRecord> {
    return this.saveConsent(
      { necessary: true, analytics: true, functional: true, marketing: true },
      'accept_all',
      userRole
    );
  },

  /**
   * Helper to reject all non-essential categories
   */
  async rejectNonEssential(userRole?: string): Promise<ConsentRecord> {
    return this.saveConsent(
      { necessary: true, analytics: false, functional: false, marketing: false },
      'reject_non_essential',
      userRole
    );
  },
};
