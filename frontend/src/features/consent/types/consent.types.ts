export interface ConsentCategories {
  necessary: boolean; // Always true
  analytics: boolean; // Google Analytics, telemetry, performance
  functional: boolean; // Theme, language, creator editor preferences
  marketing: boolean; // Retargeting, AdSense, partner ad networks
}

export type ConsentAction =
  | 'accept_all'
  | 'reject_non_essential'
  | 'custom_save'
  | 'withdrawn';

export interface ConsentRecord {
  version: string;
  timestamp: number; // ms
  expiry: number; // ms (typically timestamp + 180 days)
  visitorId: string;
  userRole?: string; // 'audience' | 'creator' | 'brand' | 'editor' | 'guest'
  categories: ConsentCategories;
  action: ConsentAction;
}

export interface ConsentLogApiPayload {
  visitorId: string;
  consentVersion: string;
  userRole?: string;
  categories: ConsentCategories;
  action: ConsentAction;
  isMinor?: boolean;
}

export interface CategoryInfo {
  id: keyof ConsentCategories;
  name: string;
  description: string;
  required: boolean;
  examples: string[];
}
