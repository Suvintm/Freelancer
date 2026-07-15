import ytBadge from '../../assets/verifiedBadges/yt_badge.png';
import editorBadge from '../../assets/verifiedBadges/editor_badge.png';
import brandBadge from '../../assets/verifiedBadges/brand_badge.png';

interface VerifiedBadgeProps {
  isVerified?: boolean;
  role?: string;
  className?: string;
}

export function VerifiedBadge({ isVerified, role, className = "w-[16px] h-[16px]" }: VerifiedBadgeProps) {
  if (!isVerified) return null;

  let badgeSrc = ytBadge; // Default to YT badge
  const normalizedRole = role?.toUpperCase() || '';

  if (
    normalizedRole.includes('CLIENT') || 
    normalizedRole.includes('BRAND') ||
    normalizedRole.includes('DIRECT')
  ) {
    badgeSrc = brandBadge;
  } else if (normalizedRole.includes('EDITOR')) {
    badgeSrc = editorBadge;
  }

  if (!badgeSrc) return null;

  return (
    <img 
      src={badgeSrc} 
      alt="Verified Badge" 
      className={`inline-block object-contain ${className}`}
      title="Verified User"
    />
  );
}
