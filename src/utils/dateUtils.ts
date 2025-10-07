export type FilterPeriod = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'previous_month' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
}

export const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const parseDate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00.000Z');
};

export const getDateRange = (period: FilterPeriod, customRange?: { startDate: Date; endDate: Date }): DateRange => {
  const today = new Date();
  const todayStr = formatDateString(today);

  switch (period) {
    case 'today':
      return {
        startDate: todayStr,
        endDate: todayStr
      };

    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDateString(yesterday);
      return {
        startDate: yesterdayStr,
        endDate: yesterdayStr
      };

    case 'this_week':
      const startOfWeek = new Date(today);
      const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
      startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
      
      return {
        startDate: formatDateString(startOfWeek),
        endDate: todayStr
      };

    case 'this_month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: formatDateString(startOfMonth),
        endDate: todayStr
      };

    case 'previous_month':
      const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
      return {
        startDate: formatDateString(previousMonth),
        endDate: formatDateString(endOfPreviousMonth)
      };

    case 'custom':
      if (!customRange) {
        // Fallback to last 30 days if no custom range provided
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return {
          startDate: formatDateString(thirtyDaysAgo),
          endDate: todayStr
        };
      }
      return {
        startDate: formatDateString(customRange.startDate),
        endDate: formatDateString(customRange.endDate)
      };

    default:
      return {
        startDate: todayStr,
        endDate: todayStr
      };
  }
};

export const getFilterDisplayName = (period: FilterPeriod, customRange?: { startDate: Date; endDate: Date }): string => {
  switch (period) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'this_week':
      return 'This Week';
    case 'this_month':
      return 'This Month';
    case 'previous_month':
      return 'Previous Month';
    case 'custom':
      if (customRange) {
        const start = customRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const end = customRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${start} - ${end}`;
      }
      return 'Custom Range';
    default:
      return 'All Time';
  }
};

export const isDateInRange = (date: string, range: DateRange): boolean => {
  return date >= range.startDate && date <= range.endDate;
};

export const getDaysCount = (range: DateRange): number => {
  const start = parseDate(range.startDate);
  const end = parseDate(range.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
};

export const formatDateForDisplay = (dateString: string): string => {
  const date = parseDate(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateStr = formatDateString(date);
  const todayStr = formatDateString(today);
  const yesterdayStr = formatDateString(yesterday);
  
  if (dateStr === todayStr) {
    return 'Today';
  } else if (dateStr === yesterdayStr) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Helper to get period options for the current context
export const getPeriodOptions = (): Array<{ value: FilterPeriod; label: string; description?: string }> => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
  const currentDate = today.getDate();
  
  // Calculate how many days since Monday (start of week)
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
  const weekLabel = daysSinceMonday === 0 ? 'This Week (1 day)' : `This Week (${daysSinceMonday + 1} days)`;
  
  return [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: weekLabel },
    { value: 'this_month', label: `This Month (${currentDate} days)` },
    { value: 'previous_month', label: 'Previous Month' },
    { value: 'custom', label: 'Custom Range' }
  ];
};