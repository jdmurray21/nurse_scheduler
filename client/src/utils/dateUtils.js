// Generate dates for the 3-week period (09/17/2024 - 10/07/2024)
export const SCHEDULE_START_DATE = new Date(Date.UTC(2024, 8, 17)); // September 17, 2024
export const SCHEDULE_END_DATE = new Date(Date.UTC(2024, 9, 7));   // October 7, 2024

export const generateScheduleDates = () => {
  const dates = [];
  
  // Generate dates from 2024-09-17 to 2024-10-07 (inclusive) using UTC
  const startDate = SCHEDULE_START_DATE;
  const endDate = SCHEDULE_END_DATE;
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  
  return dates;
};

// Format date for display using UTC
export const formatDate = (date) => {
  const month = date.toLocaleDateString('en-US', { 
    month: 'short',
    timeZone: 'UTC'
  });
  const day = date.getUTCDate();
  return `${month} ${day}`;
};

// Format date for API comparison using UTC
export const formatDateForAPI = (date) => {
  // Handle both Date objects and date strings
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    throw new Error('Invalid date format');
  }
  
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if two dates are the same
export const isSameDate = (date1, date2) => {
  // Handle both Date objects and date strings
  let date1Str, date2Str;
  
  if (typeof date1 === 'string') {
    date1Str = date1;
  } else if (date1 instanceof Date) {
    date1Str = formatDateForAPI(date1);
  } else {
    console.error('Invalid date1:', date1);
    return false;
  }
  
  if (typeof date2 === 'string') {
    date2Str = date2;
  } else if (date2 instanceof Date) {
    date2Str = formatDateForAPI(date2);
  } else {
    console.error('Invalid date2:', date2);
    return false;
  }
  
  return date1Str === date2Str;
};

// Get day of week using UTC
export const getDayOfWeek = (date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    timeZone: 'UTC'
  });
};

// Format date range for display (e.g., "September 17, 2024 - October 7, 2024")
export const formatDateRange = (startDate, endDate) => {
  const startFormatted = startDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
  
  const endFormatted = endDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
  
  return `${startFormatted} - ${endFormatted}`;
}; 