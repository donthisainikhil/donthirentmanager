import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  Property, 
  Unit, 
  Tenant, 
  RentPayment, 
  Expense, 
  MonthlyStatus 
} from '@/types';

interface AppState {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  payments: RentPayment[];
  expenses: Expense[];
  monthlyStatuses: MonthlyStatus[];
  selectedMonth: string;
  
  // Property actions
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  
  // Unit actions
  addUnit: (unit: Omit<Unit, 'id'>) => void;
  updateUnit: (id: string, unit: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;
  
  // Tenant actions
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt'>) => void;
  updateTenant: (id: string, tenant: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  
  // Payment actions
  addPayment: (payment: Omit<RentPayment, 'id' | 'createdAt'>) => void;
  updatePayment: (id: string, payment: Partial<RentPayment>) => void;
  markPaymentPaid: (id: string, amount: number) => void;
  
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  // Month actions
  setSelectedMonth: (month: string) => void;
  startMonth: (month: string) => void;
  closeMonth: (month: string) => void;
  
  // Utility actions
  generateMonthlyPayments: (month: string) => void;
}

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      properties: [],
      units: [],
      tenants: [],
      payments: [],
      expenses: [],
      monthlyStatuses: [],
      selectedMonth: getCurrentMonth(),
      
      // Property actions
      addProperty: (property) => set((state) => ({
        properties: [...state.properties, { 
          ...property, 
          id: uuidv4(), 
          createdAt: new Date().toISOString() 
        }]
      })),
      
      updateProperty: (id, property) => set((state) => ({
        properties: state.properties.map((p) => 
          p.id === id ? { ...p, ...property } : p
        )
      })),
      
      deleteProperty: (id) => set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
        units: state.units.filter((u) => u.propertyId !== id),
        tenants: state.tenants.filter((t) => t.propertyId !== id),
        payments: state.payments.filter((p) => p.propertyId !== id),
        expenses: state.expenses.filter((e) => e.propertyId !== id)
      })),
      
      // Unit actions
      addUnit: (unit) => set((state) => ({
        units: [...state.units, { ...unit, id: uuidv4() }]
      })),
      
      updateUnit: (id, unit) => set((state) => ({
        units: state.units.map((u) => 
          u.id === id ? { ...u, ...unit } : u
        )
      })),
      
      deleteUnit: (id) => set((state) => {
        const unit = state.units.find(u => u.id === id);
        return {
          units: state.units.filter((u) => u.id !== id),
          tenants: state.tenants.filter((t) => t.unitId !== id),
          payments: state.payments.filter((p) => p.unitId !== id)
        };
      }),
      
      // Tenant actions
      addTenant: (tenant) => set((state) => {
        const newTenant = { 
          ...tenant, 
          id: uuidv4(), 
          createdAt: new Date().toISOString() 
        };
        return {
          tenants: [...state.tenants, newTenant],
          units: state.units.map((u) => 
            u.id === tenant.unitId 
              ? { ...u, isOccupied: true, tenantId: newTenant.id } 
              : u
          )
        };
      }),
      
      updateTenant: (id, tenant) => set((state) => ({
        tenants: state.tenants.map((t) => 
          t.id === id ? { ...t, ...tenant } : t
        )
      })),
      
      deleteTenant: (id) => set((state) => {
        const tenant = state.tenants.find(t => t.id === id);
        return {
          tenants: state.tenants.filter((t) => t.id !== id),
          units: state.units.map((u) => 
            u.id === tenant?.unitId 
              ? { ...u, isOccupied: false, tenantId: undefined } 
              : u
          ),
          payments: state.payments.filter((p) => p.tenantId !== id)
        };
      }),
      
      // Payment actions
      addPayment: (payment) => set((state) => ({
        payments: [...state.payments, { 
          ...payment, 
          id: uuidv4(), 
          createdAt: new Date().toISOString() 
        }]
      })),
      
      updatePayment: (id, payment) => set((state) => ({
        payments: state.payments.map((p) => 
          p.id === id ? { ...p, ...payment } : p
        )
      })),
      
      markPaymentPaid: (id, amount) => set((state) => ({
        payments: state.payments.map((p) => {
          if (p.id !== id) return p;
          const newPaidAmount = p.paidAmount + amount;
          const status = newPaidAmount >= p.totalAmount ? 'paid' : 'partial';
          return {
            ...p,
            paidAmount: newPaidAmount,
            paidDate: new Date().toISOString(),
            status
          };
        })
      })),
      
      // Expense actions
      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, { 
          ...expense, 
          id: uuidv4(), 
          createdAt: new Date().toISOString() 
        }]
      })),
      
      updateExpense: (id, expense) => set((state) => ({
        expenses: state.expenses.map((e) => 
          e.id === id ? { ...e, ...expense } : e
        )
      })),
      
      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id)
      })),
      
      // Month actions
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      
      startMonth: (month) => set((state) => {
        const existing = state.monthlyStatuses.find(m => m.month === month);
        if (existing?.isStarted) return state;
        
        // Generate payments for all occupied units
        get().generateMonthlyPayments(month);
        
        const newStatus: MonthlyStatus = {
          month,
          isStarted: true,
          isClosed: false,
          startedAt: new Date().toISOString()
        };
        
        return {
          monthlyStatuses: existing 
            ? state.monthlyStatuses.map(m => m.month === month ? newStatus : m)
            : [...state.monthlyStatuses, newStatus]
        };
      }),
      
      closeMonth: (month) => set((state) => ({
        monthlyStatuses: state.monthlyStatuses.map(m => 
          m.month === month 
            ? { ...m, isClosed: true, closedAt: new Date().toISOString() }
            : m
        )
      })),
      
      // Generate monthly payments for all tenants
      generateMonthlyPayments: (month) => set((state) => {
        const existingPaymentsForMonth = state.payments.filter(p => p.month === month);
        const tenantsWithPayments = new Set(existingPaymentsForMonth.map(p => p.tenantId));
        
        const newPayments: RentPayment[] = [];
        
        state.tenants.forEach(tenant => {
          if (tenantsWithPayments.has(tenant.id)) return;
          
          const unit = state.units.find(u => u.id === tenant.unitId);
          if (!unit) return;
          
          const rentAmount = unit.monthlyRent;
          const waterBill = tenant.monthlyWaterBill;
          const totalAmount = rentAmount + waterBill;
          
          // Check if payment is overdue (past current month)
          const currentMonth = getCurrentMonth();
          const status = month < currentMonth ? 'overdue' : 'pending';
          
          newPayments.push({
            id: uuidv4(),
            tenantId: tenant.id,
            unitId: unit.id,
            propertyId: unit.propertyId,
            month,
            rentAmount,
            waterBill,
            totalAmount,
            paidAmount: 0,
            status,
            createdAt: new Date().toISOString()
          });
        });
        
        return {
          payments: [...state.payments, ...newPayments]
        };
      })
    }),
    {
      name: 'donthi-rents-storage',
    }
  )
);
