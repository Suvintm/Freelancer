// ─── Formatters ───────────────────────────────────────────────────────────
// All date, currency, number, and byte formatting lives here.
// Import from here — never inline .toLocaleString() calls in components.

// ── Currency ──────────────────────────────────────────────────────────────
export const formatCurrency = (amount, currency = "INR") => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyCompact = (amount) => {
  if (!amount) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000)     return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

// ── Dates ─────────────────────────────────────────────────────────────────
export const formatDate = (date, style = "medium") => {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: style,
    }).format(new Date(date));
  } catch {
    return "—";
  }
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  } catch {
    return "—";
  }
};

export const formatRelativeTime = (date) => {
  if (!date) return "—";
  try {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 0) return "just now";
    const s = Math.floor(diff / 1000);
    if (s < 60)  return "just now";
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)   return `${d}d ago`;
    return formatDate(date);
  } catch {
    return "—";
  }
};

export const formatDuration = (ms) => {
  if (!ms) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
};

// ── Numbers ───────────────────────────────────────────────────────────────
export const formatNumber = (n) => {
  if (n === null || n === undefined) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(decimals)}%`;
};

// ── Bytes ─────────────────────────────────────────────────────────────────
export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

// ── Text ──────────────────────────────────────────────────────────────────
export const truncate = (str, len = 40) => {
  if (!str) return "—";
  return str.length > len ? `${str.slice(0, len)}…` : str;
};

export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
};
