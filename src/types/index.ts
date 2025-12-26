export interface Property {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  createdAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  monthlyRent: number;
  isOccupied: boolean;
  tenantId?: string;
}

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phone2?: string;
  advancePaid: number;
  leaseStartDate: string;
  monthlyWaterBill: number;
  aadharDocument?: string;
  aadharFileName?: string;
  unitId: string;
  propertyId: string;
  createdAt: string;
}

export interface RentPayment {
  id: string;
  tenantId: string;
  unitId: string;
  propertyId: string;
  month: string; // YYYY-MM format
  rentAmount: number;
  waterBill: number;
  totalAmount: number;
  paidAmount: number;
  paidDate?: string;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  createdAt: string;
}

export interface Expense {
  id: string;
  propertyId?: string;
  month: string; // YYYY-MM format
  personName: string;
  amount: number;
  purpose: string;
  comments?: string;
  receiptDocument?: string;
  receiptFileName?: string;
  createdAt: string;
}

export interface MonthlyStatus {
  month: string;
  isStarted: boolean;
  isClosed: boolean;
  startedAt?: string;
  closedAt?: string;
}

export type PaymentStatus = 'paid' | 'partial' | 'pending' | 'overdue';

export interface DashboardStats {
  totalCollected: number;
  totalDue: number;
  totalOverdue: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  totalUnits: number;
  occupiedUnits: number;
}

export interface PropertyStats {
  propertyId: string;
  propertyName: string;
  rentCollected: number;
  rentDue: number;
  overdueAmount: number;
  totalUnits: number;
  occupiedUnits: number;
}
