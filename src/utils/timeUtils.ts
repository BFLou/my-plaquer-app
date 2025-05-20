// src/utils/timeUtils.ts

/**
 * Format time ago from a date string, Timestamp, or Date object
 * Handles Firestore timestamp objects properly
 */
export function formatTimeAgo(dateValue: any): string {
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

// You can add other time-related utility functions here