import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import { RentPayment } from '@/types';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: RentPayment;
}

export function PaymentDialog({ open, onOpenChange, payment }: PaymentDialogProps) {
  const { markPaymentPaid, tenants, units, properties } = useStore();
  const [amount, setAmount] = useState((payment.totalAmount - payment.paidAmount).toString());

  const tenant = tenants.find(t => t.id === payment.tenantId);
  const unit = units.find(u => u.id === payment.unitId);
  const property = properties.find(p => p.id === payment.propertyId);

  const remainingAmount = payment.totalAmount - payment.paidAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentAmount > remainingAmount) {
      toast.error('Amount cannot exceed remaining balance');
      return;
    }

    markPaymentPaid(payment.id, paymentAmount);
    toast.success('Payment recorded successfully');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tenant</span>
              <span className="font-medium">{tenant?.firstName} {tenant?.lastName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium">{property?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Unit</span>
              <span className="font-medium">{unit?.unitNumber}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rent</span>
                <span>{formatCurrency(payment.rentAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Water Bill</span>
                <span>{formatCurrency(payment.waterBill)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Total</span>
                <span>{formatCurrency(payment.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-success">
                <span>Paid</span>
                <span>{formatCurrency(payment.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-danger">
                <span>Remaining</span>
                <span>{formatCurrency(remainingAmount)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                max={remainingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="success">Record Payment</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
