import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, CheckCircle2, Clock, AlertCircle, Filter, Plus, Building2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { MonthSelector } from '@/components/MonthSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentDialog } from '@/components/PaymentDialog';
import { formatCurrency, formatMonth, getCurrentMonth } from '@/lib/formatters';
import { RentPayment, Unit } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import { getEffectiveStatus } from '@/hooks/useDashboardStats';

export default function Payments() {
  const { payments, tenants, units, properties, selectedMonth } = useStore();
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [activeTab, setActiveTab] = useState<string>('payments');
  const currentMonth = getCurrentMonth();

  // Apply effective status to all payments
  const paymentsWithEffectiveStatus = useMemo(() => {
    return payments.map(p => ({
      ...p,
      effectiveStatus: getEffectiveStatus(p, currentMonth)
    }));
  }, [payments, currentMonth]);

  const monthPayments = paymentsWithEffectiveStatus
    .filter(p => p.month === selectedMonth)
    .filter(p => statusFilter === 'all' || p.effectiveStatus === statusFilter);

  const stats = {
    total: monthPayments.length,
    paid: monthPayments.filter(p => p.effectiveStatus === 'paid').length,
    pending: monthPayments.filter(p => p.effectiveStatus === 'pending' || p.effectiveStatus === 'partial').length,
    overdue: monthPayments.filter(p => p.effectiveStatus === 'overdue').length,
  };

  // Get units with their payment status for the selected month
  const unitsWithPaymentStatus = useMemo(() => {
    return units.map(unit => {
      const tenant = tenants.find(t => t.unitId === unit.id);
      const property = properties.find(p => p.id === unit.propertyId);
      const payment = paymentsWithEffectiveStatus.find(p => p.unitId === unit.id && p.month === selectedMonth);
      
      return {
        unit,
        tenant,
        property,
        payment,
        hasPayment: !!payment,
        isPaid: payment?.effectiveStatus === 'paid',
        isOverdue: payment?.effectiveStatus === 'overdue',
      };
    }).filter(item => item.unit.isOccupied); // Only show occupied units
  }, [units, tenants, properties, paymentsWithEffectiveStatus, selectedMonth]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-danger" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Track rent payments for {formatMonth(selectedMonth)}</p>
          </div>
          <MonthSelector />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-success">{stats.paid}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-danger">{stats.overdue}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments">Payment Records</TabsTrigger>
            <TabsTrigger value="units">By Unit</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payments List */}
            <div className="space-y-3">
              {monthPayments.map((payment, index) => {
                const tenant = tenants.find(t => t.id === payment.tenantId);
                const unit = units.find(u => u.id === payment.unitId);
                const property = properties.find(p => p.id === payment.propertyId);
                const remaining = payment.totalAmount - payment.paidAmount;
                const displayStatus = payment.effectiveStatus;

                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card hover onClick={() => displayStatus !== 'paid' && setSelectedPayment(payment)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${
                              displayStatus === 'paid' ? 'bg-success/10' :
                              displayStatus === 'overdue' ? 'bg-danger/10' :
                              'bg-warning/10'
                            }`}>
                              {getStatusIcon(displayStatus)}
                            </div>
                            <div>
                              <p className="font-semibold">{tenant?.firstName} {tenant?.lastName}</p>
                              <p className="text-sm text-muted-foreground">
                                {property?.name} • Unit {unit?.unitNumber}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <p className="font-bold text-lg">{formatCurrency(payment.totalAmount)}</p>
                              <Badge variant={displayStatus as any}>{displayStatus}</Badge>
                            </div>
                            {displayStatus !== 'paid' && (
                              <p className="text-sm text-muted-foreground">
                                Due: {formatCurrency(remaining)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm border-t pt-3">
                          <div className="flex gap-4">
                            <span className="text-muted-foreground">
                              Rent: {formatCurrency(payment.rentAmount)}
                            </span>
                            <span className="text-muted-foreground">
                              Water: {formatCurrency(payment.waterBill)}
                            </span>
                          </div>
                          {displayStatus !== 'paid' && (
                            <Button 
                              size="sm" 
                              variant="success"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPayment(payment);
                              }}
                            >
                              <IndianRupee className="w-3 h-3 mr-1" />
                              Record Payment
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Empty State */}
            {monthPayments.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <IndianRupee className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Payments for {formatMonth(selectedMonth)}</h3>
                <p className="text-muted-foreground">
                  {statusFilter !== 'all' 
                    ? 'No payments match the selected filter'
                    : 'Start the month from Dashboard to generate payment records'}
                </p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            {/* Units List */}
            <div className="space-y-3">
              {unitsWithPaymentStatus.map((item, index) => (
                <motion.div
                  key={item.unit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            item.isPaid ? 'bg-success/10' :
                            item.isOverdue ? 'bg-danger/10' :
                            item.hasPayment ? 'bg-warning/10' :
                            'bg-muted'
                          }`}>
                            {item.isPaid ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : item.isOverdue ? (
                              <AlertCircle className="w-4 h-4 text-danger" />
                            ) : item.hasPayment ? (
                              <Clock className="w-4 h-4 text-warning" />
                            ) : (
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {item.property?.name} - Unit {item.unit.unitNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.tenant ? `${item.tenant.firstName} ${item.tenant.lastName}` : 'No tenant'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(item.unit.monthlyRent)}</p>
                            <p className="text-xs text-muted-foreground">Monthly Rent</p>
                          </div>
                          {item.isPaid ? (
                            <Badge variant="default" className="bg-success">Paid</Badge>
                          ) : item.hasPayment ? (
                            <div className="flex items-center gap-2">
                              {item.isOverdue && (
                                <Badge variant="destructive">Overdue</Badge>
                              )}
                              <Button 
                                size="sm" 
                                variant="success"
                                onClick={() => setSelectedPayment(item.payment!)}
                              >
                                <IndianRupee className="w-3 h-3 mr-1" />
                                Record
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedUnit(item.unit)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Payment
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {unitsWithPaymentStatus.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Occupied Units</h3>
                <p className="text-muted-foreground">
                  Add tenants to your units to track payments
                </p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Dialog for existing payments */}
      {selectedPayment && (
        <PaymentDialog
          open={!!selectedPayment}
          onOpenChange={() => setSelectedPayment(null)}
          payment={selectedPayment}
        />
      )}

      {/* Record Payment Dialog for units without payment record */}
      {selectedUnit && (
        <RecordPaymentDialog
          open={!!selectedUnit}
          onOpenChange={() => setSelectedUnit(null)}
          unit={selectedUnit}
          month={selectedMonth}
        />
      )}
    </Layout>
  );
}
