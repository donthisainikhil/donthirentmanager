import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  IndianRupee, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Users,
  Play,
  Lock,
  TrendingUp,
  CalendarClock
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useDashboardStats, usePropertyStats, useExpenseStats, getEffectiveStatus } from '@/hooks/useDashboardStats';
import { formatCurrency, formatMonth, getCurrentMonth } from '@/lib/formatters';
import { Layout } from '@/components/Layout';
import { MonthSelector } from '@/components/MonthSelector';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { RentPayment } from '@/types';

// Helper to get carry forward info for overdue payments
const getCarryForwardInfo = (payment: RentPayment, currentMonth: string) => {
  if (payment.paidAmount >= payment.totalAmount) {
    return null;
  }
  
  // If payment month is before current month, show months overdue
  if (payment.month < currentMonth) {
    const [payYear, payMonth] = payment.month.split('-').map(Number);
    const [curYear, curMonth] = currentMonth.split('-').map(Number);
    const monthsDiff = (curYear - payYear) * 12 + (curMonth - payMonth);
    return { type: 'overdue' as const, months: monthsDiff };
  }
  
  return { type: 'current' as const, months: 0 };
};

interface TenantListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  tenantIds: string[];
}

function TenantListDialog({ open, onOpenChange, title, tenantIds }: TenantListDialogProps) {
  const { tenants, units, properties, payments, selectedMonth } = useStore();

  const tenantDetails = tenantIds.map(id => {
    const tenant = tenants.find(t => t.id === id);
    const unit = units.find(u => u.id === tenant?.unitId);
    const property = properties.find(p => p.id === tenant?.propertyId);
    const payment = payments.find(p => p.tenantId === id && p.month === selectedMonth);
    return { tenant, unit, property, payment };
  }).filter(d => d.tenant);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {tenantDetails.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No tenants found</p>
          ) : (
            tenantDetails.map(({ tenant, unit, property, payment }) => (
              <div key={tenant!.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{tenant!.firstName} {tenant!.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    {property?.name} • Unit {unit?.unitNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(payment?.totalAmount || 0)}</p>
                  <Badge variant={payment?.status as any}>
                    {payment?.status || 'N/A'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { 
    selectedMonth, 
    monthlyStatuses, 
    startMonth, 
    closeMonth, 
    payments,
    properties,
    units,
    tenants
  } = useStore();
  
  const currentMonth = getCurrentMonth();
  const stats = useDashboardStats(selectedMonth);
  const propertyStats = usePropertyStats(selectedMonth);
  const expenseStats = useExpenseStats(selectedMonth);
  
  const [showCollectedDialog, setShowCollectedDialog] = useState(false);
  const [showDueDialog, setShowDueDialog] = useState(false);
  
  const monthStatus = monthlyStatuses.find(m => m.month === selectedMonth);
  const monthPayments = payments.filter(p => p.month === selectedMonth);
  
  const paidTenantIds = monthPayments.filter(p => getEffectiveStatus(p, currentMonth) === 'paid').map(p => p.tenantId);
  const pendingTenantIds = monthPayments.filter(p => getEffectiveStatus(p, currentMonth) !== 'paid').map(p => p.tenantId);

  const handleStartMonth = () => {
    startMonth(selectedMonth);
    toast.success(`${formatMonth(selectedMonth)} started successfully`);
  };

  const handleCloseMonth = () => {
    if (stats.pendingCount > 0 || stats.overdueCount > 0) {
      toast.error('Cannot close month with pending payments');
      return;
    }
    closeMonth(selectedMonth);
    toast.success(`${formatMonth(selectedMonth)} closed successfully`);
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Overview for {formatMonth(selectedMonth)}</p>
          </div>
          <MonthSelector />
        </div>

        {/* Month Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            {monthStatus?.isClosed ? (
              <>
                <div className="p-2 bg-success/10 rounded-lg">
                  <Lock className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold">Month Closed</p>
                  <p className="text-sm text-muted-foreground">All transactions finalized</p>
                </div>
              </>
            ) : monthStatus?.isStarted ? (
              <>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Month In Progress</p>
                  <p className="text-sm text-muted-foreground">Collecting rent payments</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold">Month Not Started</p>
                  <p className="text-sm text-muted-foreground">Start to generate payment records</p>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {!monthStatus?.isStarted && (
              <Button onClick={handleStartMonth} className="flex-1 sm:flex-none" variant="gradient">
                <Play className="w-4 h-4 mr-2" />
                Start Month
              </Button>
            )}
            {monthStatus?.isStarted && !monthStatus?.isClosed && (
              <Button 
                onClick={handleCloseMonth} 
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Lock className="w-4 h-4 mr-2" />
                Close Month
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Collected"
            value={formatCurrency(stats.totalCollected)}
            subtitle={`${stats.paidCount} payments received`}
            icon={CheckCircle2}
            variant="success"
            onClick={() => setShowCollectedDialog(true)}
            delay={0}
          />
          <StatCard
            title="Total Due"
            value={formatCurrency(stats.totalDue)}
            subtitle={`${stats.pendingCount + stats.overdueCount} pending`}
            icon={Clock}
            variant="warning"
            onClick={() => setShowDueDialog(true)}
            delay={0.1}
          />
          <StatCard
            title="Total Properties"
            value={properties.length}
            subtitle={`${stats.occupiedUnits}/${stats.totalUnits} units occupied`}
            icon={Building2}
            variant="default"
            delay={0.2}
          />
          <StatCard
            title="Total Tenants"
            value={tenants.length}
            subtitle="Active tenants"
            icon={Users}
            variant="default"
            delay={0.3}
          />
        </div>

        {/* Financial Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-success/10 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Rent Collected</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(expenseStats.totalRentCollected)}</p>
                </div>
                <div className="text-center p-4 bg-danger/10 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-danger">{formatCurrency(expenseStats.totalExpenses)}</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Leftover Balance</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(expenseStats.leftoverBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Property-wise Summary */}
        {propertyStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Property Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {propertyStats.map((stat) => (
                    <div
                      key={stat.propertyId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted rounded-xl gap-4"
                    >
                      <div>
                        <p className="font-semibold">{stat.propertyName}</p>
                        <p className="text-sm text-muted-foreground">
                          {stat.occupiedUnits}/{stat.totalUnits} units occupied
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Collected</p>
                          <p className="font-semibold text-success">{formatCurrency(stat.rentCollected)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Due</p>
                          <p className="font-semibold text-warning">{formatCurrency(stat.rentDue)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Overdue</p>
                          <p className="font-semibold text-danger">{formatCurrency(stat.overdueAmount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Payment Status List */}
        {monthPayments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthPayments.map((payment) => {
                    const tenant = tenants.find(t => t.id === payment.tenantId);
                    const unit = units.find(u => u.id === payment.unitId);
                    const property = properties.find(p => p.id === payment.propertyId);
                    const effectiveStatus = getEffectiveStatus(payment, currentMonth);
                    const carryInfo = getCarryForwardInfo(payment, currentMonth);
                    
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            effectiveStatus === 'paid' ? 'bg-success/10' :
                            effectiveStatus === 'overdue' ? 'bg-danger/10' :
                            'bg-warning/10'
                          }`}>
                            {effectiveStatus === 'paid' ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : effectiveStatus === 'overdue' ? (
                              <AlertCircle className="w-4 h-4 text-danger" />
                            ) : (
                              <Clock className="w-4 h-4 text-warning" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{tenant?.firstName} {tenant?.lastName}</p>
                            <p className="text-sm text-muted-foreground">
                              {property?.name} • Unit {unit?.unitNumber}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="font-semibold">{formatCurrency(payment.totalAmount)}</p>
                          <div className="flex items-center gap-2">
                            {carryInfo?.type === 'overdue' && (
                              <span className="text-xs text-danger flex items-center gap-1">
                                <CalendarClock className="w-3 h-3" />
                                {carryInfo.months === 1 ? '1 month overdue' : `${carryInfo.months} months overdue`}
                              </span>
                            )}
                            <Badge variant={effectiveStatus === 'overdue' ? 'destructive' : effectiveStatus as any}>
                              {effectiveStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {properties.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
            <p className="text-muted-foreground mb-4">Start by adding your first property</p>
            <Button variant="gradient" asChild>
              <a href="/properties">Add Property</a>
            </Button>
          </motion.div>
        )}
      </div>

      {/* Dialogs */}
      <TenantListDialog
        open={showCollectedDialog}
        onOpenChange={setShowCollectedDialog}
        title="Payments Collected"
        tenantIds={paidTenantIds}
      />
      <TenantListDialog
        open={showDueDialog}
        onOpenChange={setShowDueDialog}
        title="Payments Due"
        tenantIds={pendingTenantIds}
      />
    </Layout>
  );
}
