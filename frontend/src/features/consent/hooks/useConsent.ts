import { useState, useEffect, useCallback } from 'react';
import { consentManager } from '../services/consentManager';
import type { ConsentRecord, ConsentCategories } from '../types/consent.types';

export function useConsent() {
  const [consent, setConsent] = useState<ConsentRecord | null>(() => consentManager.getConsent());
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(() => !consentManager.hasValidConsent());
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState<boolean>(false);
  const [isSoftRenewalDue, setIsSoftRenewalDue] = useState<boolean>(() => consentManager.isSoftRenewalDue());

  // Listen for consent changes across windows / components
  useEffect(() => {
    const handleConsentChange = (event: Event) => {
      const customEvent = event as CustomEvent<ConsentRecord>;
      if (customEvent.detail) {
        setConsent(customEvent.detail);
        setIsBannerVisible(false);
        setIsSoftRenewalDue(consentManager.isSoftRenewalDue());
      }
    };

    window.addEventListener('suvix_consent_changed', handleConsentChange);
    return () => {
      window.removeEventListener('suvix_consent_changed', handleConsentChange);
    };
  }, []);

  const acceptAll = useCallback(async (role?: string) => {
    const record = await consentManager.acceptAll(role);
    setConsent(record);
    setIsBannerVisible(false);
    setIsPreferencesModalOpen(false);
  }, []);

  const rejectNonEssential = useCallback(async (role?: string) => {
    const record = await consentManager.rejectNonEssential(role);
    setConsent(record);
    setIsBannerVisible(false);
    setIsPreferencesModalOpen(false);
  }, []);

  const saveCustomPreferences = useCallback(
    async (categories: Partial<ConsentCategories>, role?: string, isMinor?: boolean) => {
      const record = await consentManager.saveConsent(categories, 'custom_save', role, isMinor);
      setConsent(record);
      setIsBannerVisible(false);
      setIsPreferencesModalOpen(false);
    },
    []
  );

  const openPreferences = useCallback(() => {
    setIsPreferencesModalOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesModalOpen(false);
  }, []);

  return {
    consent,
    isBannerVisible,
    isPreferencesModalOpen,
    isSoftRenewalDue,
    acceptAll,
    rejectNonEssential,
    saveCustomPreferences,
    openPreferences,
    closePreferences,
  };
}
