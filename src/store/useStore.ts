import { create } from 'zustand';
import { ref, set as firebaseSet, get as firebaseGet, update as firebaseUpdate, remove, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
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
  loading: boolean;
  initialized: boolean;
  currentUserId: string | null;
  
  // Initialize data from Firebase for a specific user
  initializeData: (userId: string) => void;
  
  // Reset store when user logs out
  resetStore: () => void;
  
  // Property actions
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => Promise<void>;
  updateProperty: (id: string, property: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  
  // Unit actions
  addUnit: (unit: Omit<Unit, 'id'>) => Promise<void>;
  updateUnit: (id: string, unit: Partial<Unit>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  
  // Tenant actions
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt'>) => Promise<void>;
  updateTenant: (id: string, tenant: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  
  // Payment actions
  addPayment: (payment: Omit<RentPayment, 'id' | 'createdAt'>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<RentPayment>) => Promise<void>;
  markPaymentPaid: (id: string, amount: number) => Promise<void>;
  
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Month actions
  setSelectedMonth: (month: string) => void;
  startMonth: (month: string) => Promise<void>;
  closeMonth: (month: string) => Promise<void>;
  
  // Utility actions
  generateMonthlyPayments: (month: string) => Promise<void>;
}

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Helper to convert Firebase object to array
const objectToArray = <T>(obj: Record<string, T> | null): T[] => {
  if (!obj) return [];
  return Object.values(obj);
};

// Store unsubscribe functions
let unsubscribeFunctions: (() => void)[] = [];

export const useStore = create<AppState>()((set, get) => ({
  properties: [],
  units: [],
  tenants: [],
  payments: [],
  expenses: [],
  monthlyStatuses: [],
  selectedMonth: getCurrentMonth(),
  loading: true,
  initialized: false,
  currentUserId: null,
  
  // Reset store when user logs out
  resetStore: () => {
    // Unsubscribe from all Firebase listeners
    unsubscribeFunctions.forEach(unsub => unsub());
    unsubscribeFunctions = [];
    
    set({
      properties: [],
      units: [],
      tenants: [],
      payments: [],
      expenses: [],
      monthlyStatuses: [],
      selectedMonth: getCurrentMonth(),
      loading: true,
      initialized: false,
      currentUserId: null,
    });
  },
  
  // Initialize data from Firebase with realtime listeners for a specific user
  initializeData: (userId: string) => {
    const state = get();
    
    // If already initialized for this user, skip
    if (state.initialized && state.currentUserId === userId) return;
    
    // If switching users, clean up old listeners
    if (state.currentUserId && state.currentUserId !== userId) {
      unsubscribeFunctions.forEach(unsub => unsub());
      unsubscribeFunctions = [];
    }
    
    // User-specific paths
    const basePath = `users/${userId}`;
    
    const propertiesRef = ref(database, `${basePath}/properties`);
    const unitsRef = ref(database, `${basePath}/units`);
    const tenantsRef = ref(database, `${basePath}/tenants`);
    const paymentsRef = ref(database, `${basePath}/payments`);
    const expensesRef = ref(database, `${basePath}/expenses`);
    const monthlyStatusesRef = ref(database, `${basePath}/monthlyStatuses`);
    
    // Listen for properties changes
    const propertiesUnsub = onValue(propertiesRef, (snapshot) => {
      const data = snapshot.val();
      set({ properties: objectToArray(data), loading: false });
    });
    
    // Listen for units changes
    const unitsUnsub = onValue(unitsRef, (snapshot) => {
      const data = snapshot.val();
      set({ units: objectToArray(data) });
    });
    
    // Listen for tenants changes
    const tenantsUnsub = onValue(tenantsRef, (snapshot) => {
      const data = snapshot.val();
      set({ tenants: objectToArray(data) });
    });
    
    // Listen for payments changes
    const paymentsUnsub = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      set({ payments: objectToArray(data) });
    });
    
    // Listen for expenses changes
    const expensesUnsub = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      set({ expenses: objectToArray(data) });
    });
    
    // Listen for monthly statuses changes
    const monthlyStatusesUnsub = onValue(monthlyStatusesRef, (snapshot) => {
      const data = snapshot.val();
      set({ monthlyStatuses: objectToArray(data) });
    });
    
    // Store unsubscribe functions
    unsubscribeFunctions = [
      () => off(propertiesRef),
      () => off(unitsRef),
      () => off(tenantsRef),
      () => off(paymentsRef),
      () => off(expensesRef),
      () => off(monthlyStatusesRef),
    ];
    
    set({ initialized: true, currentUserId: userId });
  },
  
  // Property actions
  addProperty: async (property) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    const id = uuidv4();
    const newProperty: Property = { 
      ...property, 
      id, 
      createdAt: new Date().toISOString() 
    };
    await firebaseSet(ref(database, `users/${userId}/properties/${id}`), newProperty);
  },
  
  updateProperty: async (id, property) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    await firebaseUpdate(ref(database, `users/${userId}/properties/${id}`), property);
  },
  
  deleteProperty: async (id) => {
    const state = get();
    const userId = state.currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    // Delete property
    await remove(ref(database, `users/${userId}/properties/${id}`));
    
    // Delete related units
    const relatedUnits = state.units.filter(u => u.propertyId === id);
    for (const unit of relatedUnits) {
      await remove(ref(database, `users/${userId}/units/${unit.id}`));
    }
    
    // Delete related tenants
    const relatedTenants = state.tenants.filter(t => t.propertyId === id);
    for (const tenant of relatedTenants) {
      await remove(ref(database, `users/${userId}/tenants/${tenant.id}`));
    }
    
    // Delete related payments
    const relatedPayments = state.payments.filter(p => p.propertyId === id);
    for (const payment of relatedPayments) {
      await remove(ref(database, `users/${userId}/payments/${payment.id}`));
    }
    
    // Delete related expenses
    const relatedExpenses = state.expenses.filter(e => e.propertyId === id);
    for (const expense of relatedExpenses) {
      await remove(ref(database, `users/${userId}/expenses/${expense.id}`));
    }
  },
  
  // Unit actions
  addUnit: async (unit) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    const id = uuidv4();
    const newUnit: Unit = { ...unit, id };
    await firebaseSet(ref(database, `users/${userId}/units/${id}`), newUnit);
  },
  
  updateUnit: async (id, unit) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    await firebaseUpdate(ref(database, `users/${userId}/units/${id}`), unit);
  },
  
  deleteUnit: async (id) => {
    const state = get();
    const userId = state.currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    // Delete unit
    await remove(ref(database, `users/${userId}/units/${id}`));
    
    // Delete related tenants
    const relatedTenants = state.tenants.filter(t => t.unitId === id);
    for (const tenant of relatedTenants) {
      await remove(ref(database, `users/${userId}/tenants/${tenant.id}`));
    }
    
    // Delete related payments
    const relatedPayments = state.payments.filter(p => p.unitId === id);
    for (const payment of relatedPayments) {
      await remove(ref(database, `users/${userId}/payments/${payment.id}`));
    }
  },
  
  // Tenant actions
  addTenant: async (tenant) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    const id = uuidv4();
    const newTenant: Tenant = { 
      ...tenant, 
      id, 
      createdAt: new Date().toISOString() 
    };
    
    // Add tenant
    await firebaseSet(ref(database, `users/${userId}/tenants/${id}`), newTenant);
    
    // Update unit to mark as occupied
    await firebaseUpdate(ref(database, `users/${userId}/units/${tenant.unitId}`), {
      isOccupied: true,
      tenantId: id
    });
  },
  
  updateTenant: async (id, tenant) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    await firebaseUpdate(ref(database, `users/${userId}/tenants/${id}`), tenant);
  },
  
  deleteTenant: async (id) => {
    const state = get();
    const userId = state.currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    const tenant = state.tenants.find(t => t.id === id);
    
    if (tenant) {
      // Delete tenant
      await remove(ref(database, `users/${userId}/tenants/${id}`));
      
      // Update unit to mark as vacant
      await firebaseUpdate(ref(database, `users/${userId}/units/${tenant.unitId}`), {
        isOccupied: false,
        tenantId: null
      });
      
      // Delete related payments
      const relatedPayments = state.payments.filter(p => p.tenantId === id);
      for (const payment of relatedPayments) {
        await remove(ref(database, `users/${userId}/payments/${payment.id}`));
      }
    }
  },
  
  // Payment actions
  addPayment: async (payment) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    const id = uuidv4();
    const newPayment: RentPayment = { 
      ...payment, 
      id, 
      createdAt: new Date().toISOString() 
    };
    await firebaseSet(ref(database, `users/${userId}/payments/${id}`), newPayment);
  },
  
  updatePayment: async (id, payment) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    await firebaseUpdate(ref(database, `users/${userId}/payments/${id}`), payment);
  },
  
  markPaymentPaid: async (id, amount) => {
    const state = get();
    const userId = state.currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    const payment = state.payments.find(p => p.id === id);
    
    if (payment) {
      const newPaidAmount = payment.paidAmount + amount;
      const status = newPaidAmount >= payment.totalAmount ? 'paid' : 'partial';
      
      await firebaseUpdate(ref(database, `users/${userId}/payments/${id}`), {
        paidAmount: newPaidAmount,
        paidDate: new Date().toISOString(),
        status
      });
    }
  },
  
  // Expense actions
  addExpense: async (expense) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    const id = uuidv4();
    const newExpense: Expense = { 
      ...expense, 
      id, 
      createdAt: new Date().toISOString() 
    };
    await firebaseSet(ref(database, `users/${userId}/expenses/${id}`), newExpense);
  },
  
  updateExpense: async (id, expense) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    await firebaseUpdate(ref(database, `users/${userId}/expenses/${id}`), expense);
  },
  
  deleteExpense: async (id) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    await remove(ref(database, `users/${userId}/expenses/${id}`));
  },
  
  // Month actions
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  
  startMonth: async (month) => {
    const state = get();
    const userId = state.currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    const existing = state.monthlyStatuses.find(m => m.month === month);
    if (existing?.isStarted) return;
    
    // Generate payments for all occupied units
    await get().generateMonthlyPayments(month);
    
    const newStatus: MonthlyStatus = {
      month,
      isStarted: true,
      isClosed: false,
      startedAt: new Date().toISOString()
    };
    
    await firebaseSet(ref(database, `users/${userId}/monthlyStatuses/${month}`), newStatus);
  },
  
  closeMonth: async (month) => {
    const userId = get().currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    await firebaseUpdate(ref(database, `users/${userId}/monthlyStatuses/${month}`), {
      isClosed: true,
      closedAt: new Date().toISOString()
    });
  },
  
  // Generate monthly payments for all tenants
  generateMonthlyPayments: async (month) => {
    const state = get();
    const userId = state.currentUserId;
    if (!userId) throw new Error('User not authenticated');
    
    const existingPaymentsForMonth = state.payments.filter(p => p.month === month);
    const tenantsWithPayments = new Set(existingPaymentsForMonth.map(p => p.tenantId));
    
    for (const tenant of state.tenants) {
      if (tenantsWithPayments.has(tenant.id)) continue;
      
      const unit = state.units.find(u => u.id === tenant.unitId);
      if (!unit) continue;
      
      const rentAmount = unit.monthlyRent;
      const waterBill = tenant.monthlyWaterBill;
      const totalAmount = rentAmount + waterBill;
      
      // Check if payment is overdue (past current month)
      const currentMonth = getCurrentMonth();
      const status = month < currentMonth ? 'overdue' : 'pending';
      
      const id = uuidv4();
      const newPayment: RentPayment = {
        id,
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
      };
      
      await firebaseSet(ref(database, `users/${userId}/payments/${id}`), newPayment);
    }
  }
}));
