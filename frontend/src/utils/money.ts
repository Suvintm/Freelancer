/**
 * Financial Precision & Currency Utilities
 * Aligned with Backend RoundingMode.HALF_UP (2-decimal precision & integer paise)
 */

export const round2 = (n: number): number => {
  if (isNaN(n) || n === null || n === undefined) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

export const toPaise = (rupees: number): number => {
  return Math.round(round2(rupees) * 100);
};

export const fromPaise = (paise: number): number => {
  return round2(paise / 100);
};

export const formatINR = (amount: number, includeSymbol: boolean = true): string => {
  const rounded = round2(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
  }).format(rounded);
  return includeSymbol ? `₹${formatted}` : formatted;
};

export const formatUSD = (amount: number, includeSymbol: boolean = true): string => {
  const rounded = round2(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
  }).format(rounded);
  return includeSymbol ? `$${formatted}` : formatted;
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const isUsd = (currency || 'INR').toUpperCase() === 'USD';
  return isUsd ? formatUSD(amount) : formatINR(amount);
};
