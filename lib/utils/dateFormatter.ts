// utils/dateFormatter.js

/**
 * Format a date safely for React Native / Expo / Web.
 * Supports locale-aware formatting and customizable options.
 *
 * @param {string|number|Date|null|undefined} dateInput - Any valid date input
 * @param {object} options
 * @param {string} [options.locale='en-IN'] - Locale like 'en-IN', 'en-US', etc.
 * @param {object} [options.formatOptions] - Intl.DateTimeFormat options
 * @returns {string} formatted date, e.g. "11 Nov 2025"
 */
export const formatDate = (
  dateInput,
  {
    locale = "en-IN",
    formatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
    } as any,
  } = {}
) => {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  } catch {
    // fallback for weird Android Intl edge cases
    const yyyy = date.getFullYear();
    const mm = `${date.getMonth() + 1}`.padStart(2, "0");
    const dd = `${date.getDate()}`.padStart(2, "0");
    return `${dd}-${mm}-${yyyy}`;
  }
};
