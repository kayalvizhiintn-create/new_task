/**
 * Formats a date string or object into DD/MM/YYYY format.
 * Supports:
 * - 'YYYY-MM-DD' strings (e.g., '2026-06-25') -> formatted directly by splitting to avoid timezone issues.
 * - ISO strings or full date strings (e.g., '2026-06-24T14:26:54.123Z') -> parsed as Date and formatted in local time.
 * - Date objects.
 * 
 * @param {string|Date} dateVal - The date to format
 * @param {string} fallback - The fallback value if the date is invalid or empty
 * @returns {string} The formatted date string, e.g., '25/06/2026'
 */
export const formatDateToDDMMYYYY = (dateVal, fallback = '') => {
  if (!dateVal) return fallback;

  // Handle YYYY-MM-DD string format directly to prevent timezone shift
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // Matches YYYY-MM-DD or YYYY-MM-DD followed by space/time
    const ymdRegex = /^(\d{4})-(\d{2})-(\d{2})(?:[ T]|$)/;
    const match = trimmed.match(ymdRegex);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
  }

  try {
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return fallback;
  }
};
