import React from 'react';
import { BannerHost } from './banners/BannerHost';

export const UnifiedBanner: React.FC<{ className?: string }> = ({ className }) => {
  return <BannerHost className={className} />;
};

export { BannerHost };