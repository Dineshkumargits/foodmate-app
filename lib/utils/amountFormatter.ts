// utils/amountFormatter.js

/**
 * Format numeric amounts with currency and locale support.
 * Works in React Native (Expo / CLI) and Node.
 *
 * @param {number|string} value - Amount to format
 * @param {object} options
 * @param {string} [options.currency] - ISO 4217 code like 'INR', 'USD', etc.
 * @param {string} [options.locale] - Locale like 'en-IN', 'en-US', etc.
 * @param {boolean} [options.useGrouping=true] - Add thousand separators
 * @param {number} [options.minimumFractionDigits=0]
 * @param {number} [options.maximumFractionDigits=2]
 * @returns {string} formatted string, e.g. '₹12,34,567.89'
 */
export const formatAmount = (
  value,
  {
    currency = 'INR',
    locale = 'en-IN',
    useGrouping = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = {}
) => {
  if (value === null || value === undefined || value === '') return '₹0';
  const num = Number(value);
  if (isNaN(num)) return '₹0';

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: currency ? 'currency' : 'decimal',
      currency,
      useGrouping,
      minimumFractionDigits,
      maximumFractionDigits,
    });
    return formatter.format(num);
  } catch {
    // Fallback for RN Android (rare older Hermes)
    const fixed = num.toFixed(maximumFractionDigits);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${currency === 'INR' ? '₹' : ''}${parts.join('.')}`;
  }
};
