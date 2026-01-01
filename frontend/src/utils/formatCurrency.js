/**
 * Format a number as Kenyan Shillings (Ksh)
 * @param {number} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: false)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, showDecimals = false) => {
  if (amount === null || amount === undefined) {
    return 'Ksh 0';
  }

  const options = {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  };

  return `Ksh ${amount.toLocaleString('en-KE', options)}`;
};

/**
 * Format a number as a compact Kenyan Shillings string (e.g., "Ksh 1.5M")
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted compact currency string
 */
export const formatCurrencyCompact = (amount) => {
  if (amount === null || amount === undefined) {
    return 'Ksh 0';
  }

  if (amount >= 1000000) {
    return `Ksh ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `Ksh ${(amount / 1000).toFixed(1)}K`;
  }

  return `Ksh ${amount.toLocaleString('en-KE')}`;
};