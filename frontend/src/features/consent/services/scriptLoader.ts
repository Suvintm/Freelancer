import type { ConsentCategories } from '../types/consent.types';

// Declare global gtag types
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Ensures Google dataLayer and gtag are initialized on window
 */
function ensureGtagInitialized(): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  }
}

/**
 * Initializes Google Consent Mode v2 with strictly DENIED defaults.
 * Must be executed as early as possible before any Google tags fire.
 */
export function initGoogleConsentModeDefaults(): void {
  if (typeof window === 'undefined') return;
  ensureGtagInitialized();

  window.gtag?.('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500, // Wait up to 500ms for user choice on fast loads
  });
}

/**
 * Updates Google Consent Mode v2 based on granted categories
 */
export function updateGoogleConsentMode(categories: ConsentCategories): void {
  if (typeof window === 'undefined') return;
  ensureGtagInitialized();

  window.gtag?.('consent', 'update', {
    analytics_storage: categories.analytics ? 'granted' : 'denied',
    ad_storage: categories.marketing ? 'granted' : 'denied',
    ad_user_data: categories.marketing ? 'granted' : 'denied',
    ad_personalization: categories.marketing ? 'granted' : 'denied',
  });
}

/**
 * Dynamically injects or activates non-essential third-party scripts based on consent
 */
export function applyScriptConsent(categories: ConsentCategories): void {
  if (typeof window === 'undefined') return;

  // 1. Google Consent Mode update
  updateGoogleConsentMode(categories);

  // 2. Dynamic script loading for analytics
  if (categories.analytics) {
    injectAnalyticsScripts();
  }

  // 3. Dynamic script loading for marketing
  if (categories.marketing) {
    injectMarketingScripts();
  }
}

/**
 * Injects Google Analytics script tag if Google Analytics ID is configured
 */
function injectAnalyticsScripts(): void {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!gaId || document.getElementById('suvix-ga-script')) return;

  const script = document.createElement('script');
  script.id = 'suvix-ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  ensureGtagInitialized();
  window.gtag?.('js', new Date());
  window.gtag?.('config', gaId, { anonymize_ip: true });
}

/**
 * Injects Meta Pixel or AdSense scripts if configured
 */
function injectMarketingScripts(): void {
  const metaPixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (metaPixelId && !document.getElementById('suvix-meta-pixel')) {
    const script = document.createElement('script');
    script.id = 'suvix-meta-pixel';
    script.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${metaPixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }
}
