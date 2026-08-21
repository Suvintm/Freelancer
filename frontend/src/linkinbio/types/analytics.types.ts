/**
 * Analytics and Tracking Type Definitions
 */

export interface AnalyticsSummary {
  pageId: string;
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  averageCtr: number;
  topLink: {
    blockId: string;
    title: string;
    clicks: number;
    url: string;
  } | null;
}

export interface DailyStatPoint {
  date: string;
  views: number;
  uniqueVisitors: number;
  clicks: number;
  ctr: number;
}

export interface LinkClickBreakdown {
  blockId: string;
  title: string;
  url: string;
  clicks: number;
  ctr: number;
}

export interface GeoLocationStat {
  countryCode: string;
  countryName: string;
  views: number;
  percentage: number;
}

export interface DeviceBreakdownStat {
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface BioPageAnalytics {
  summary: AnalyticsSummary;
  timeSeries: DailyStatPoint[];
  linkBreakdown: LinkClickBreakdown[];
  devices: DeviceBreakdownStat;
  topCountries: GeoLocationStat[];
}
