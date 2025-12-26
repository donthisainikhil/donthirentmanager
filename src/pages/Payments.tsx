import { useState } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, CheckCircle2, Clock, AlertCircle, Filter } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { MonthSelector } from '@/components/MonthSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentDialog } from '@/components/PaymentDialog';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import { RentPayment } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Payments() {
  const { payments, tenants, units, properties, selectedMonth } = useStore();
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const monthPayments = payments
    .filter(p => p.month === selectedMonth)
    .filter(p => statusFilter === 'all' || p.status === statusFilter);

  const stats = {
    total: monthPayments.length,
    paid: monthPayments.filter(p => p.status === 'paid').length,
    pending: monthPayments.filter(p => p.status === 'pending' || p.status === 'partial').length,
    overdue: monthPayments.filter(p => p.status === 'overdue').length,
  };

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

            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card hover onClick={() => payment.status !== 'paid' && setSelectedPayment(payment)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          payment.status === 'paid' ? 'bg-success/10' :
                          payment.status === 'overdue' ? 'bg-danger/10' :
                          'bg-warning/10'
                        }`}>
                          {getStatusIcon(payment.status)}
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
                          <Badge variant={payment.status as any}>{payment.status}</Badge>
                        </div>
                        {payment.status !== 'paid' && (
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
                      {payment.status !== 'paid' && (
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
      </div>

      {/* Payment Dialog */}
      {selectedPayment && (
        <PaymentDialog
          open={!!selectedPayment}
          onOpenChange={() => setSelectedPayment(null)}
          payment={selectedPayment}
        />
      )}
    </Layout>
  );
}
