import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { DashboardStats, PropertyStats } from '@/types';
import { getCurrentMonth } from '@/lib/formatters';

// Helper to determine if a payment should be considered overdue
const getEffectiveStatus = (payment: { status: string; month: string; paidAmount: number; totalAmount: number }) => {
  const currentMonth = getCurrentMonth();
  // If payment is not fully paid and the month is in the past, it's overdue
  if (payment.paidAmount < payment.totalAmount && payment.month < currentMonth) {
    return 'overdue';
  }
  return payment.status;
};

export const useDashboardStats = (month: string): DashboardStats => {
  const { payments, units, tenants } = useStore();
  
  return useMemo(() => {
    const monthPayments = payments.filter(p => p.month === month);
    const currentMonth = getCurrentMonth();
    
    const totalCollected = monthPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalDue = monthPayments.reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0);
    
    // Calculate overdue - consider both explicit overdue status AND past months with unpaid amounts
    const totalOverdue = monthPayments
      .filter(p => {
        const effectiveStatus = getEffectiveStatus(p);
        return effectiveStatus === 'overdue';
      })
      .reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0);
    
    const paidCount = monthPayments.filter(p => p.status === 'paid').length;
    const pendingCount = monthPayments.filter(p => {
      const effectiveStatus = getEffectiveStatus(p);
      return effectiveStatus === 'pending' || effectiveStatus === 'partial';
    }).length;
    const overdueCount = monthPayments.filter(p => {
      const effectiveStatus = getEffectiveStatus(p);
      return effectiveStatus === 'overdue';
    }).length;
    
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
  }, [payments, units, month]);
};

export const usePropertyStats = (month: string): PropertyStats[] => {
  const { properties, payments, units } = useStore();
  
  return useMemo(() => {
    const currentMonth = getCurrentMonth();
    
    return properties.map(property => {
      const propertyPayments = payments.filter(
        p => p.propertyId === property.id && p.month === month
      );
      const propertyUnits = units.filter(u => u.propertyId === property.id);
      
      const rentCollected = propertyPayments.reduce((sum, p) => sum + p.paidAmount, 0);
      const rentDue = propertyPayments
        .filter(p => {
          const effectiveStatus = getEffectiveStatus(p);
          return effectiveStatus === 'pending' || effectiveStatus === 'partial';
        })
        .reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0);
      const overdueAmount = propertyPayments
        .filter(p => {
          const effectiveStatus = getEffectiveStatus(p);
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
  }, [properties, payments, units, month]);
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
