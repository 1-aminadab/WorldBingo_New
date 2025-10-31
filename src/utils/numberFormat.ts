/**
 * Format numbers for display - removes decimals and uses K/M notation for large numbers
 * @param value - The number to format
 * @param showDecimals - Whether to show decimals for smaller numbers (default: false)
 * @returns Formatted string
 */
export const formatNumber = (value: number, showDecimals: boolean = false): string => {
  const absValue = Math.abs(value);
  
  if (absValue >= 1000000) {
    // Millions
    const millions = value / 1000000;
    return showDecimals && millions % 1 !== 0 
      ? `${millions.toFixed(1)}M` 
      : `${Math.round(millions)}M`;
  } else if (absValue >= 1000) {
    // Thousands
    const thousands = value / 1000;
    return showDecimals && thousands % 1 !== 0 
      ? `${thousands.toFixed(1)}K` 
      : `${Math.round(thousands)}K`;
  } else {
    // Less than 1000
    return Math.round(value).toString();
  }
};

/**
 * Format currency values - removes decimals and uses K/M notation
 * @param amount - The amount to format
 * @param currency - Currency suffix (default: 'Birr')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'Birr'): string => {
  return `${formatNumber(amount)} ${currency}`;
};

/**
 * Format coin values - removes decimals and uses K/M notation
 * @param amount - The amount to format
 * @returns Formatted coins string
 */
export const formatCoins = (amount: number): string => {
  return `${formatNumber(amount)} Coins`;
};