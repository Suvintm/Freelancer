export interface CountryData {
  code: string;        // ISO 3166-1 alpha-2 (e.g., 'IN', 'US')
  name: string;        // English full name (e.g., 'India', 'United States')
  dialCode: string;    // International dial code (e.g., '+91', '+1')
  flag: string;        // Unicode flag emoji (e.g., '🇮🇳', '🇺🇸')
  currency: string;    // Default currency code (e.g., 'INR', 'USD')
}

// Full global country database sorted alphabetically by common popular regions first, then all nations
export const COUNTRIES: CountryData[] = [
  // 🌟 Popular / Primary Markets
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', currency: 'INR' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', currency: 'USD' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', currency: 'USD' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', currency: 'USD' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', currency: 'USD' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', currency: 'USD' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', currency: 'USD' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', currency: 'USD' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', currency: 'USD' },

  // 🌍 All Countries (A-Z)
  { code: 'AF', name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫', currency: 'USD' },
  { code: 'AL', name: 'Albania', dialCode: '+355', flag: '🇦🇱', currency: 'USD' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿', currency: 'USD' },
  { code: 'AD', name: 'Andorra', dialCode: '+376', flag: '🇦🇩', currency: 'USD' },
  { code: 'AO', name: 'Angola', dialCode: '+244', flag: '🇦🇴', currency: 'USD' },
  { code: 'AG', name: 'Antigua and Barbuda', dialCode: '+1268', flag: '🇦🇬', currency: 'USD' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', currency: 'USD' },
  { code: 'AM', name: 'Armenia', dialCode: '+374', flag: '🇦🇲', currency: 'USD' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', currency: 'USD' },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', flag: '🇦🇿', currency: 'USD' },
  { code: 'BS', name: 'Bahamas', dialCode: '+1242', flag: '🇧🇸', currency: 'USD' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', currency: 'USD' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', currency: 'USD' },
  { code: 'BB', name: 'Barbados', dialCode: '+1246', flag: '🇧🇧', currency: 'USD' },
  { code: 'BY', name: 'Belarus', dialCode: '+375', flag: '🇧🇾', currency: 'USD' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', currency: 'USD' },
  { code: 'BZ', name: 'Belize', dialCode: '+501', flag: '🇧🇿', currency: 'USD' },
  { code: 'BJ', name: 'Benin', dialCode: '+229', flag: '🇧🇯', currency: 'USD' },
  { code: 'BT', name: 'Bhutan', dialCode: '+975', flag: '🇧🇹', currency: 'USD' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴', currency: 'USD' },
  { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387', flag: '🇧🇦', currency: 'USD' },
  { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼', currency: 'USD' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', currency: 'USD' },
  { code: 'BN', name: 'Brunei', dialCode: '+673', flag: '🇧🇳', currency: 'USD' },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬', currency: 'USD' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫', currency: 'USD' },
  { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮', currency: 'USD' },
  { code: 'KH', name: 'Cambodia', dialCode: '+855', flag: '🇰🇭', currency: 'USD' },
  { code: 'CM', name: 'Cameroon', dialCode: '+237', flag: '🇨🇲', currency: 'USD' },
  { code: 'CV', name: 'Cape Verde', dialCode: '+238', flag: '🇨🇻', currency: 'USD' },
  { code: 'CF', name: 'Central African Republic', dialCode: '+236', flag: '🇨🇫', currency: 'USD' },
  { code: 'TD', name: 'Chad', dialCode: '+235', flag: '🇹🇩', currency: 'USD' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', currency: 'USD' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', currency: 'USD' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', currency: 'USD' },
  { code: 'KM', name: 'Comoros', dialCode: '+269', flag: '🇰🇲', currency: 'USD' },
  { code: 'CG', name: 'Congo - Brazzaville', dialCode: '+242', flag: '🇨🇬', currency: 'USD' },
  { code: 'CD', name: 'Congo - Kinshasa', dialCode: '+243', flag: '🇨🇩', currency: 'USD' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷', currency: 'USD' },
  { code: 'HR', name: 'Croatia', dialCode: '+385', flag: '🇭🇷', currency: 'USD' },
  { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺', currency: 'USD' },
  { code: 'CY', name: 'Cyprus', dialCode: '+357', flag: '🇨🇾', currency: 'USD' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿', currency: 'USD' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', currency: 'USD' },
  { code: 'DJ', name: 'Djibouti', dialCode: '+253', flag: '🇩🇯', currency: 'USD' },
  { code: 'DM', name: 'Dominica', dialCode: '+1767', flag: '🇩🇲', currency: 'USD' },
  { code: 'DO', name: 'Dominican Republic', dialCode: '+1809', flag: '🇩🇴', currency: 'USD' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨', currency: 'USD' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', currency: 'USD' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻', currency: 'USD' },
  { code: 'GQ', name: 'Equatorial Guinea', dialCode: '+240', flag: '🇬🇶', currency: 'USD' },
  { code: 'ER', name: 'Eritrea', dialCode: '+291', flag: '🇪🇷', currency: 'USD' },
  { code: 'EE', name: 'Estonia', dialCode: '+372', flag: '🇪🇪', currency: 'USD' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹', currency: 'USD' },
  { code: 'FJ', name: 'Fiji', dialCode: '+679', flag: '🇫🇯', currency: 'USD' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', currency: 'USD' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦', currency: 'USD' },
  { code: 'GM', name: 'Gambia', dialCode: '+220', flag: '🇬🇲', currency: 'USD' },
  { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '🇬🇪', currency: 'USD' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', currency: 'USD' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷', currency: 'USD' },
  { code: 'GD', name: 'Grenada', dialCode: '+1473', flag: '🇬🇩', currency: 'USD' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹', currency: 'USD' },
  { code: 'GN', name: 'Guinea', dialCode: '+224', flag: '🇬🇳', currency: 'USD' },
  { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245', flag: '🇬🇼', currency: 'USD' },
  { code: 'GY', name: 'Guyana', dialCode: '+592', flag: '🇬🇾', currency: 'USD' },
  { code: 'HT', name: 'Haiti', dialCode: '+509', flag: '🇭🇹', currency: 'USD' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳', currency: 'USD' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', currency: 'USD' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺', currency: 'USD' },
  { code: 'IS', name: 'Iceland', dialCode: '+354', flag: '🇮🇸', currency: 'USD' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', currency: 'USD' },
  { code: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷', currency: 'USD' },
  { code: 'IQ', name: 'Iraq', dialCode: '+964', flag: '🇮🇶', currency: 'USD' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', currency: 'USD' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱', currency: 'USD' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', currency: 'USD' },
  { code: 'JM', name: 'Jamaica', dialCode: '+1876', flag: '🇯🇲', currency: 'USD' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', currency: 'USD' },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴', currency: 'USD' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿', currency: 'USD' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', currency: 'USD' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', currency: 'USD' },
  { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', flag: '🇰🇬', currency: 'USD' },
  { code: 'LA', name: 'Laos', dialCode: '+856', flag: '🇱🇦', currency: 'USD' },
  { code: 'LV', name: 'Latvia', dialCode: '+371', flag: '🇱🇻', currency: 'USD' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧', currency: 'USD' },
  { code: 'LS', name: 'Lesotho', dialCode: '+266', flag: '🇱🇸', currency: 'USD' },
  { code: 'LR', name: 'Liberia', dialCode: '+231', flag: '🇱🇷', currency: 'USD' },
  { code: 'LY', name: 'Libya', dialCode: '+218', flag: '🇱🇾', currency: 'USD' },
  { code: 'LI', name: 'Liechtenstein', dialCode: '+423', flag: '🇱🇮', currency: 'USD' },
  { code: 'LT', name: 'Lithuania', dialCode: '+370', flag: '🇱🇹', currency: 'USD' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺', currency: 'USD' },
  { code: 'MO', name: 'Macau', dialCode: '+853', flag: '🇲🇴', currency: 'USD' },
  { code: 'MK', name: 'North Macedonia', dialCode: '+389', flag: '🇲🇰', currency: 'USD' },
  { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬', currency: 'USD' },
  { code: 'MW', name: 'Malawi', dialCode: '+265', flag: '🇲🇼', currency: 'USD' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', currency: 'USD' },
  { code: 'MV', name: 'Maldives', dialCode: '+960', flag: '🇲🇻', currency: 'USD' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱', currency: 'USD' },
  { code: 'MT', name: 'Malta', dialCode: '+356', flag: '🇲🇹', currency: 'USD' },
  { code: 'MR', name: 'Mauritania', dialCode: '+222', flag: '🇲🇷', currency: 'USD' },
  { code: 'MU', name: 'Mauritius', dialCode: '+230', flag: '🇲🇺', currency: 'USD' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', currency: 'USD' },
  { code: 'MD', name: 'Moldova', dialCode: '+373', flag: '🇲🇩', currency: 'USD' },
  { code: 'MC', name: 'Monaco', dialCode: '+377', flag: '🇲🇨', currency: 'USD' },
  { code: 'MN', name: 'Mongolia', dialCode: '+976', flag: '🇲🇳', currency: 'USD' },
  { code: 'ME', name: 'Montenegro', dialCode: '+382', flag: '🇲🇪', currency: 'USD' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦', currency: 'USD' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿', currency: 'USD' },
  { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲', currency: 'USD' },
  { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦', currency: 'USD' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', currency: 'USD' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', currency: 'USD' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', currency: 'USD' },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮', currency: 'USD' },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪', currency: 'USD' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', currency: 'USD' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', currency: 'USD' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', currency: 'USD' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', currency: 'USD' },
  { code: 'PA', name: 'Panama', dialCode: '+507', flag: '🇵🇦', currency: 'USD' },
  { code: 'PG', name: 'Papua New Guinea', dialCode: '+675', flag: '🇵🇬', currency: 'USD' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾', currency: 'USD' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪', currency: 'USD' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', currency: 'USD' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', currency: 'USD' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', currency: 'USD' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', currency: 'USD' },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴', currency: 'USD' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', currency: 'USD' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼', currency: 'USD' },
  { code: 'SN', name: 'Senegal', dialCode: '+221', flag: '🇸🇳', currency: 'USD' },
  { code: 'RS', name: 'Serbia', dialCode: '+381', flag: '🇷🇸', currency: 'USD' },
  { code: 'SC', name: 'Seychelles', dialCode: '+248', flag: '🇸🇨', currency: 'USD' },
  { code: 'SL', name: 'Sierra Leone', dialCode: '+232', flag: '🇸🇱', currency: 'USD' },
  { code: 'SK', name: 'Slovakia', dialCode: '+421', flag: '🇸🇰', currency: 'USD' },
  { code: 'SI', name: 'Slovenia', dialCode: '+386', flag: '🇸🇮', currency: 'USD' },
  { code: 'SO', name: 'Somalia', dialCode: '+252', flag: '🇸🇴', currency: 'USD' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', currency: 'USD' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', currency: 'USD' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', currency: 'USD' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', currency: 'USD' },
  { code: 'SD', name: 'Sudan', dialCode: '+249', flag: '🇸🇩', currency: 'USD' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', currency: 'USD' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', currency: 'USD' },
  { code: 'SY', name: 'Syria', dialCode: '+963', flag: '🇸🇾', currency: 'USD' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼', currency: 'USD' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿', currency: 'USD' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', currency: 'USD' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', flag: '🇹🇳', currency: 'USD' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', currency: 'USD' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬', currency: 'USD' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦', currency: 'USD' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾', currency: 'USD' },
  { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', flag: '🇺🇿', currency: 'USD' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪', currency: 'USD' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', currency: 'USD' },
  { code: 'YE', name: 'Yemen', dialCode: '+967', flag: '🇾🇪', currency: 'USD' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', flag: '🇿🇲', currency: 'USD' },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼', currency: 'USD' },
];

/**
 * Common timezone to ISO-2 country code mapping for instant zero-latency client pre-fill
 */
/**
 * Enhanced Timezone Map
 */
const TIMEZONE_MAP: Record<string, string> = {
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Delhi': 'IN',
  'Asia/Bombay': 'IN',
  'Asia/Colombo': 'LK',
  'Asia/Kathmandu': 'NP',
  'Asia/Dhaka': 'BD',
  'Asia/Karachi': 'PK',
  'Asia/Dubai': 'AE',
  'Asia/Muscat': 'OM',
  'Asia/Riyadh': 'SA',
  'Asia/Qatar': 'QA',
  'Asia/Kuwait': 'KW',
  'Asia/Bahrain': 'BH',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Jakarta': 'ID',
  'Asia/Bangkok': 'TH',
  'Asia/Manila': 'PH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Hong_Kong': 'HK',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Detroit': 'US',
  'America/Indiana/Indianapolis': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'America/Edmonton': 'CA',
  'Europe/London': 'GB',
  'Europe/Belfast': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Amsterdam': 'NL',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Stockholm': 'SE',
  'Europe/Zurich': 'CH',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Vienna': 'AT',
  'Europe/Brussels': 'BE',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Europe/Lisbon': 'PT',
  'Europe/Athens': 'GR',
  'Europe/Istanbul': 'TR',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Pacific/Auckland': 'NZ',
  'America/Sao_Paulo': 'BR',
  'America/Mexico_City': 'MX',
  'America/Bogota': 'CO',
  'America/Buenos_Aires': 'AR',
  'America/Santiago': 'CL',
  'Africa/Johannesburg': 'ZA',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Cairo': 'EG',
};

/**
 * Instant client-side browser country detection (0ms) using timezone, offset, and language heuristics
 */
export function detectBrowserCountry(): CountryData {
  try {
    // 1. Check IANA Timezone string
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      if (TIMEZONE_MAP[tz]) {
        const match = findCountryByCode(TIMEZONE_MAP[tz]);
        if (match) return match;
      }
      if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('Delhi') || tz.includes('India')) {
        return findCountryByCode('IN') || COUNTRIES[0];
      }
    }

    // 2. Check Timezone Offset (Minutes from UTC)
    // Indian Standard Time (IST) is UTC+5:30 -> offset is exactly -330
    const offset = new Date().getTimezoneOffset();
    if (offset === -330) {
      return findCountryByCode('IN') || COUNTRIES[0];
    } else if (offset === -345) {
      return findCountryByCode('NP') || COUNTRIES[0];
    } else if (offset === -360) {
      return findCountryByCode('BD') || COUNTRIES[0];
    } else if (offset === -240) {
      return findCountryByCode('AE') || COUNTRIES[0];
    } else if (offset === -180) {
      return findCountryByCode('SA') || COUNTRIES[0];
    } else if (offset === -480) {
      return findCountryByCode('SG') || COUNTRIES[0];
    }

    // 3. Check Browser Languages
    const langs = navigator.languages || [navigator.language];
    for (const lang of langs) {
      if (lang) {
        const upper = lang.toUpperCase();
        if (upper.includes('-IN') || upper === 'HI' || upper.startsWith('HI-') || upper.startsWith('TA-') || upper.startsWith('TE-') || upper.startsWith('MR-') || upper.startsWith('BN-')) {
          return findCountryByCode('IN') || COUNTRIES[0];
        } else if (upper.includes('-GB')) {
          return findCountryByCode('GB') || COUNTRIES[0];
        } else if (upper.includes('-CA')) {
          return findCountryByCode('CA') || COUNTRIES[0];
        } else if (upper.includes('-AU')) {
          return findCountryByCode('AU') || COUNTRIES[0];
        } else if (upper.includes('-AE')) {
          return findCountryByCode('AE') || COUNTRIES[0];
        } else if (upper.includes('-US')) {
          return findCountryByCode('US') || COUNTRIES[0];
        }
      }
    }
  } catch {
    // ignore
  }
  return COUNTRIES[0]; // Defaults to India
}

/**
 * Multi-tiered async country detector (Backend Edge -> Fallback Edge -> Browser)
 */
export async function autoDetectCountryAsync(backendDetector?: () => Promise<{ countryCode?: string; countryName?: string } | null>): Promise<CountryData> {
  // 1. Try Backend Detector (Cloudflare Edge / MaxMind)
  if (backendDetector) {
    try {
      const res = await backendDetector();
      if (res?.countryCode) {
        const match = findCountryByCode(res.countryCode) || (res.countryName ? findCountryByName(res.countryName) : undefined);
        if (match) return match;
      }
    } catch {
      // ignore
    }
  }

  // 2. Try Free Public Edge JSON Endpoint (Zero-token fallback)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const edgeRes = await fetch('https://api.country.is', { signal: controller.signal });
    clearTimeout(timer);
    if (edgeRes.ok) {
      const data = await edgeRes.json();
      if (data?.country) {
        const match = findCountryByCode(data.country);
        if (match) return match;
      }
    }
  } catch {
    // ignore
  }

  // 3. Instant Browser Heuristics Fallback
  return detectBrowserCountry();
}

export function findCountryByCode(code: string): CountryData | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase().trim();
  return COUNTRIES.find((c) => c.code === upper);
}

export function findCountryByName(name: string): CountryData | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase().trim();
  return COUNTRIES.find((c) => c.name.toLowerCase() === lower);
}

export function findCountryByDialCode(dialCode: string): CountryData | undefined {
  if (!dialCode) return undefined;
  const cleaned = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return COUNTRIES.find((c) => c.dialCode === cleaned);
}
