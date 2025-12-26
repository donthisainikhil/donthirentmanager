import { create } from 'zustand';
import { ref, set as firebaseSet, get as firebaseGet, update as firebaseUpdate, remove, onValue } from 'firebase/database';
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
  
  // Initialize data from Firebase
  initializeData: () => void;
  
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

// Initial properties data
const initialProperties: Property[] = [
  {
    id: 'prop-1',
    name: 'H.NO:1-10',
    address: 'H.NO: 1-10, Maktha Mahaboobpet, HMT colony, Miyapur, Telangana-500049',
    totalUnits: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-2',
    name: 'H.NO: 1-5/5',
    address: 'H.NO: 1-5/5, Maktha Mahaboobpet, HMT colony, Miyapur, Telangana-500049',
    totalUnits: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-3',
    name: 'H.No: 1-8',
    address: 'H.NO: 1-8, Maktha Mahaboobpet, HMT colony, Miyapur, Telangana-500049',
    totalUnits: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-4',
    name: 'Survey No: 119 Rooms',
    address: 'Survey No:119, Maktha Mahaboobpet, HMT colony, Miyapur, Telangana-500049',
    totalUnits: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-5',
    name: 'Godown',
    address: 'Survey No:119, Maktha Mahaboobpet, HMT colony, Miyapur, Telangana-500049',
    totalUnits: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-6',
    name: 'Janapriya Sheds',
    address: 'Survey No:119, Maktha Mahaboobpet, HMT colony, Miyapur, Telangana-500049',
    totalUnits: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-7',
    name: 'MainRoad Commercial Shops-Plot No:11/D',
    address: 'Plot NO: 11/D, Survey No: 45-51, Maktha Mahaboobpet, HMT colony, Miyapur, Telangana-500049',
    totalUnits: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-8',
    name: 'Amrutha Rao Sheds',
    address: 'Survey No:119, Maktha Mahaboobpet, HMT colony, Miyapur, Telangana-500049',
    totalUnits: 0,
    createdAt: new Date().toISOString()
  }
];

// Helper to convert Firebase object to array
const objectToArray = <T>(obj: Record<string, T> | null): T[] => {
  if (!obj) return [];
  return Object.values(obj);
};

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
  
  // Initialize data from Firebase with realtime listeners
  initializeData: () => {
    const state = get();
    if (state.initialized) return;
    
    // Set up realtime listeners for all collections
    const propertiesRef = ref(database, 'properties');
    const unitsRef = ref(database, 'units');
    const tenantsRef = ref(database, 'tenants');
    const paymentsRef = ref(database, 'payments');
    const expensesRef = ref(database, 'expenses');
    const monthlyStatusesRef = ref(database, 'monthlyStatuses');
    
    // Initialize properties with defaults if empty
    firebaseGet(propertiesRef).then((snapshot) => {
      if (!snapshot.exists()) {
        // Set initial properties
        const propertiesObj: Record<string, Property> = {};
        initialProperties.forEach(prop => {
          propertiesObj[prop.id] = prop;
        });
        firebaseSet(propertiesRef, propertiesObj);
      }
    });
    
    // Listen for properties changes
    onValue(propertiesRef, (snapshot) => {
      const data = snapshot.val();
      set({ properties: objectToArray(data), loading: false });
    });
    
    // Listen for units changes
    onValue(unitsRef, (snapshot) => {
      const data = snapshot.val();
      set({ units: objectToArray(data) });
    });
    
    // Listen for tenants changes
    onValue(tenantsRef, (snapshot) => {
      const data = snapshot.val();
      set({ tenants: objectToArray(data) });
    });
    
    // Listen for payments changes
    onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      set({ payments: objectToArray(data) });
    });
    
    // Listen for expenses changes
    onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      set({ expenses: objectToArray(data) });
    });
    
    // Listen for monthly statuses changes
    onValue(monthlyStatusesRef, (snapshot) => {
      const data = snapshot.val();
      set({ monthlyStatuses: objectToArray(data) });
    });
    
    set({ initialized: true });
  },
  
  // Property actions
  addProperty: async (property) => {
    const id = uuidv4();
    const newProperty: Property = { 
      ...property, 
      id, 
      createdAt: new Date().toISOString() 
    };
    await firebaseSet(ref(database, `properties/${id}`), newProperty);
  },
  
  updateProperty: async (id, property) => {
    await firebaseUpdate(ref(database, `properties/${id}`), property);
  },
  
  deleteProperty: async (id) => {
    const state = get();
    
    // Delete property
    await remove(ref(database, `properties/${id}`));
    
    // Delete related units
    const relatedUnits = state.units.filter(u => u.propertyId === id);
    for (const unit of relatedUnits) {
      await remove(ref(database, `units/${unit.id}`));
    }
    
    // Delete related tenants
    const relatedTenants = state.tenants.filter(t => t.propertyId === id);
    for (const tenant of relatedTenants) {
      await remove(ref(database, `tenants/${tenant.id}`));
    }
    
    // Delete related payments
    const relatedPayments = state.payments.filter(p => p.propertyId === id);
    for (const payment of relatedPayments) {
      await remove(ref(database, `payments/${payment.id}`));
    }
    
    // Delete related expenses
    const relatedExpenses = state.expenses.filter(e => e.propertyId === id);
    for (const expense of relatedExpenses) {
      await remove(ref(database, `expenses/${expense.id}`));
    }
  },
  
  // Unit actions
  addUnit: async (unit) => {
    const id = uuidv4();
    const newUnit: Unit = { ...unit, id };
    await firebaseSet(ref(database, `units/${id}`), newUnit);
  },
  
  updateUnit: async (id, unit) => {
    await firebaseUpdate(ref(database, `units/${id}`), unit);
  },
  
  deleteUnit: async (id) => {
    const state = get();
    
    // Delete unit
    await remove(ref(database, `units/${id}`));
    
    // Delete related tenants
    const relatedTenants = state.tenants.filter(t => t.unitId === id);
    for (const tenant of relatedTenants) {
      await remove(ref(database, `tenants/${tenant.id}`));
    }
    
    // Delete related payments
    const relatedPayments = state.payments.filter(p => p.unitId === id);
    for (const payment of relatedPayments) {
      await remove(ref(database, `payments/${payment.id}`));
    }
  },
  
  // Tenant actions
  addTenant: async (tenant) => {
    const id = uuidv4();
    const newTenant: Tenant = { 
      ...tenant, 
      id, 
      createdAt: new Date().toISOString() 
    };
    
    // Add tenant
    await firebaseSet(ref(database, `tenants/${id}`), newTenant);
    
    // Update unit to mark as occupied
    await firebaseUpdate(ref(database, `units/${tenant.unitId}`), {
      isOccupied: true,
      tenantId: id
    });
  },
  
  updateTenant: async (id, tenant) => {
    await firebaseUpdate(ref(database, `tenants/${id}`), tenant);
  },
  
  deleteTenant: async (id) => {
    const state = get();
    const tenant = state.tenants.find(t => t.id === id);
    
    if (tenant) {
      // Delete tenant
      await remove(ref(database, `tenants/${id}`));
      
      // Update unit to mark as vacant
      await firebaseUpdate(ref(database, `units/${tenant.unitId}`), {
        isOccupied: false,
        tenantId: null
      });
      
      // Delete related payments
      const relatedPayments = state.payments.filter(p => p.tenantId === id);
      for (const payment of relatedPayments) {
        await remove(ref(database, `payments/${payment.id}`));
      }
    }
  },
  
  // Payment actions
  addPayment: async (payment) => {
    const id = uuidv4();
    const newPayment: RentPayment = { 
      ...payment, 
      id, 
      createdAt: new Date().toISOString() 
    };
    await firebaseSet(ref(database, `payments/${id}`), newPayment);
  },
  
  updatePayment: async (id, payment) => {
    await firebaseUpdate(ref(database, `payments/${id}`), payment);
  },
  
  markPaymentPaid: async (id, amount) => {
    const state = get();
    const payment = state.payments.find(p => p.id === id);
    
    if (payment) {
      const newPaidAmount = payment.paidAmount + amount;
      const status = newPaidAmount >= payment.totalAmount ? 'paid' : 'partial';
      
      await firebaseUpdate(ref(database, `payments/${id}`), {
        paidAmount: newPaidAmount,
        paidDate: new Date().toISOString(),
        status
      });
    }
  },
  
  // Expense actions
  addExpense: async (expense) => {
    const id = uuidv4();
    const newExpense: Expense = { 
      ...expense, 
      id, 
      createdAt: new Date().toISOString() 
    };
    await firebaseSet(ref(database, `expenses/${id}`), newExpense);
  },
  
  updateExpense: async (id, expense) => {
    await firebaseUpdate(ref(database, `expenses/${id}`), expense);
  },
  
  deleteExpense: async (id) => {
    await remove(ref(database, `expenses/${id}`));
  },
  
  // Month actions
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  
  startMonth: async (month) => {
    const state = get();
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
    
    await firebaseSet(ref(database, `monthlyStatuses/${month}`), newStatus);
  },
  
  closeMonth: async (month) => {
    await firebaseUpdate(ref(database, `monthlyStatuses/${month}`), {
      isClosed: true,
      closedAt: new Date().toISOString()
    });
  },
  
  // Generate monthly payments for all tenants
  generateMonthlyPayments: async (month) => {
    const state = get();
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
      
      await firebaseSet(ref(database, `payments/${id}`), newPayment);
    }
  }
}));
