import { differenceInDays, format, isToday } from 'date-fns';

export const getDaysUntil = (targetDate: string): number => {
  const target = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  return differenceInDays(target, today);
};

export const getCountdownText = (targetDate: string): string => {
  const days = getDaysUntil(targetDate);
  const target = new Date(targetDate);
  
  if (isToday(target)) {
    return 'Today';
  }
  
  if (days < 0) {
    return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`;
  }
  
  if (days === 0) {
    return 'Today';
  }
  
  if (days === 1) {
    return 'Tomorrow';
  }
  
  return `${days} day${days !== 1 ? 's' : ''} remaining`;
};

export const formatDate = (date: string): string => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const getCountdownColor = (targetDate: string): string => {
  const days = getDaysUntil(targetDate);
  
  if (days < 0) {
    return '#ef4444'; // red for overdue
  }
  
  if (days <= 7) {
    return '#f59e0b'; // amber for urgent
  }
  
  if (days <= 30) {
    return '#3b82f6'; // blue for approaching
  }
  
  return '#10b981'; // green for good
};





