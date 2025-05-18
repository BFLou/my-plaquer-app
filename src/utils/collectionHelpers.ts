// src/features/collections/utils/collectionHelpers.ts
import { Timestamp } from 'firebase/firestore';

export const formatTimeAgo = (dateValue: any): string => {
  // If no date value is provided, return 'recently'
  if (!dateValue) return 'recently';
  
  try {
    let date: Date;
    
    // Case 1: Firebase Timestamp object with toDate method
    if (dateValue && typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    }
    // Case 2: Firebase server timestamp object with seconds & nanoseconds
    else if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      date = new Date(dateValue.seconds * 1000);
    }
    // Case 3: JavaScript Date object
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Case 4: String date 
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    }
    // Case 5: Numeric timestamp (milliseconds)
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    }
    // Default fallback
    else {
      return 'recently';
    }
    
    // Verify the date is valid
    if (!date || isNaN(date.getTime())) {
      return 'recently';
    }
    
    // Calculate the time difference
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Format the output based on the difference
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    
  } catch (error) {
    // If any error occurs during processing, return 'recently'
    return 'recently';
  }
}

// Get the plaque count for a collection (handles array or number)
export const getPlaqueCount = (collection: any): number => {
  if (Array.isArray(collection.plaques)) {
    return collection.plaques.length;
  }
  return typeof collection.plaques === 'number' ? collection.plaques : 0;
}

// Generates a random emoji for collection icons
export const getRandomIcon = (): string => {
  const icons = [
    '🏛️', '🗿', '🎭', '🎨', '📚', '🏆', '🏠', '🏙️', '🏛️', '🗺️', 
    '🌍', '🔍', '⭐', '🌟', '🏛️', '🧠', '📷', '🎵', '🏛️', '🧩'
  ];
  
  return icons[Math.floor(Math.random() * icons.length)];
}

// Generates a random color for collection backgrounds
export const getRandomColor = (): string => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-cyan-500',
    'bg-emerald-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

// Sanitizes collection names for URLs and filenames
export const sanitizeCollectionName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove non-alphanumeric characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with a single hyphen
    .trim();
}

// Truncates text to a specified length with an ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export default {
  formatTimeAgo,
  getPlaqueCount,
  getRandomIcon,
  getRandomColor,
  sanitizeCollectionName,
  truncateText
};