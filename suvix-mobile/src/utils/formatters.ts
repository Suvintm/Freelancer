/**
 * 📊 SuviX Stats Formatter
 * Converts large numbers into human-readable social stats (Instagram style).
 */
export const formatCount = (count: number | undefined | null): string => {
  if (!count) return '0';
  
  const num = Number(count);
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  
  return num.toString();
};
