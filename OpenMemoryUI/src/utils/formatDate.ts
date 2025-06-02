import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Formats a timestamp for display in the UI
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }

  // If within the last week, show relative time
  const now = new Date();
  const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  
  if (diffInDays < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  // Otherwise show the date
  return format(date, 'MMM d, yyyy');
}

/**
 * Formats a date for form inputs
 */
export function formatDateForInput(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd');
}

/**
 * Gets a relative time string
 */
export function getRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}