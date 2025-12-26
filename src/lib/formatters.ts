import { format, parse, addMonths, subMonths } from 'date-fns';

export const formatMonth = (monthStr: string): string => {
  const date = parse(monthStr, 'yyyy-MM', new Date());
  return format(date, 'MMMM yyyy');
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), 'dd MMM yyyy');
};

export const getNextMonth = (monthStr: string): string => {
  const date = parse(monthStr, 'yyyy-MM', new Date());
  return format(addMonths(date, 1), 'yyyy-MM');
};

export const getPrevMonth = (monthStr: string): string => {
  const date = parse(monthStr, 'yyyy-MM', new Date());
  return format(subMonths(date, 1), 'yyyy-MM');
};

export const getCurrentMonth = (): string => {
  return format(new Date(), 'yyyy-MM');
};

export const isMonthOverdue = (monthStr: string): boolean => {
  const currentMonth = getCurrentMonth();
  return monthStr < currentMonth;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return 'bg-success text-success-foreground';
    case 'partial':
      return 'bg-warning text-warning-foreground';
    case 'pending':
      return 'bg-muted text-muted-foreground';
    case 'overdue':
      return 'bg-danger text-danger-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};
