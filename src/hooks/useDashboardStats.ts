import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { DashboardStats, PropertyStats, RentPayment } from '@/types';
import { getCurrentMonth } from '@/lib/formatters';

// Helper to determine if a payment is overdue
// Overdue = unpaid balance from previous months (not current month)
export const getEffectiveStatus = (payment: RentPayment, currentMonth: string): RentPayment['status'] => {
  // If fully paid, status is paid
  if (payment.paidAmount >= payment.totalAmount) {
    return 'paid';
  }
  
  // If payment month is before current month, it's overdue
  if (payment.month < currentMonth) {
    return 'overdue';
  }
  
  // Current month with partial payment
  if (payment.paidAmount > 0 && payment.paidAmount < payment.totalAmount) {
    return 'partial';
  }
  
  // Current month with no payment
  return 'pending';
};

export const useDashboardStats = (month: string): DashboardStats => {
  const { payments, units, tenants } = useStore();
  const currentMonth = getCurrentMonth();
  
  return useMemo(() => {
    const monthPayments = payments.filter(p => p.month === month);
    
    const totalCollected = monthPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalDue = monthPayments.reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0);
    
    // Calculate overdue - payments from previous months with unpaid balance
    const totalOverdue = monthPayments
      .filter(p => {
        const effectiveStatus = getEffectiveStatus(p, currentMonth);
        return effectiveStatus === 'overdue';
      })
      .reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0);
    
    const paidCount = monthPayments.filter(p => getEffectiveStatus(p, currentMonth) === 'paid').length;
    const pendingCount = monthPayments.filter(p => {
      const effectiveStatus = getEffectiveStatus(p, currentMonth);
      return effectiveStatus === 'pending' || effectiveStatus === 'partial';
    }).length;
    const overdueCount = monthPayments.filter(p => getEffectiveStatus(p, currentMonth) === 'overdue').length;
    
    const totalUnits = units.length;
    const occupiedUnits = units.filter(u => u.isOccupied).length;
    
    return {
      totalCollected,
      totalDue,
      totalOverdue,
      paidCount,
      pendingCount,
      overdueCount,
      totalUnits,
      occupiedUnits
    };
  }, [payments, units, month, currentMonth]);
};

export const usePropertyStats = (month: string): PropertyStats[] => {
  const { properties, payments, units } = useStore();
  const currentMonth = getCurrentMonth();
  
  return useMemo(() => {
    return properties.map(property => {
      const propertyPayments = payments.filter(
        p => p.propertyId === property.id && p.month === month
      );
      const propertyUnits = units.filter(u => u.propertyId === property.id);
      
      const rentCollected = propertyPayments.reduce((sum, p) => sum + p.paidAmount, 0);
      
      // Calculate due (pending/partial - current month only)
      const rentDue = propertyPayments
        .filter(p => {
          const effectiveStatus = getEffectiveStatus(p, currentMonth);
          return effectiveStatus === 'pending' || effectiveStatus === 'partial';
        })
        .reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0);
      
      // Calculate overdue (from previous months)
      const overdueAmount = propertyPayments
        .filter(p => {
          const effectiveStatus = getEffectiveStatus(p, currentMonth);
          return effectiveStatus === 'overdue';
        })
        .reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0);
      
      return {
        propertyId: property.id,
        propertyName: property.name,
        rentCollected,
        rentDue,
        overdueAmount,
        totalUnits: propertyUnits.length,
        occupiedUnits: propertyUnits.filter(u => u.isOccupied).length
      };
    });
  }, [properties, payments, units, month, currentMonth]);
};

export const useExpenseStats = (month: string) => {
  const { expenses, payments } = useStore();
  
  return useMemo(() => {
    const monthExpenses = expenses.filter(e => e.month === month);
    const monthPayments = payments.filter(p => p.month === month);
    
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRentCollected = monthPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const leftoverBalance = totalRentCollected - totalExpenses;
    
    return {
      totalExpenses,
      totalRentCollected,
      leftoverBalance,
      expenseCount: monthExpenses.length
    };
  }, [expenses, payments, month]);
};
