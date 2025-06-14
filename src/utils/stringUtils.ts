// src/utils/stringUtils.ts
/**
 * Capitalizes the first letter of each word in a string
 * @param text String to capitalize
 * @returns Capitalized string
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return '';

  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
