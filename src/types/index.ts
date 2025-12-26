export interface Property {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  createdAt: string;
}

export type UnitType = 
  | 'single_room' 
  | 'single_bedroom' 
  | 'double_bedroom' 
  | 'three_bedroom' 
  | 'shed' 
  | 'land_lease' 
  | 'commercial_space';

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  single_room: 'Single Room',
  single_bedroom: 'Single Bedroom',
  double_bedroom: 'Double Bedroom',
  three_bedroom: 'Three Bedroom',
  shed: 'Shed',
  land_lease: 'Land Lease',
  commercial_space: 'Commercial Space',
};

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  type: UnitType;
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
  aadharNumber?: string;
  aadharDocument?: string;
  aadharFileName?: string;
  profilePhoto?: string;
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
  paymentMethod?: 'cash' | 'upi'; // Track payment method
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'upi';

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
