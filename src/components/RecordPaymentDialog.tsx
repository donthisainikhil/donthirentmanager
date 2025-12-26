import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import { Unit } from '@/types';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Unit;
  month: string;
}

export function RecordPaymentDialog({ open, onOpenChange, unit, month }: RecordPaymentDialogProps) {
  const { addPayment, tenants, properties } = useStore();
  
  const tenant = tenants.find(t => t.unitId === unit.id);
  const property = properties.find(p => p.id === unit.propertyId);
  
  const waterBill = tenant?.monthlyWaterBill || 0;
  const totalAmount = unit.monthlyRent + waterBill;
  
  const [amount, setAmount] = useState(totalAmount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenant) {
      toast.error('No tenant found for this unit');
      return;
    }
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentAmount > totalAmount) {
      toast.error('Amount cannot exceed total due');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const status = paymentAmount >= totalAmount ? 'paid' : paymentAmount > 0 ? 'partial' : 'pending';
      
      await addPayment({
        tenantId: tenant.id,
        unitId: unit.id,
        propertyId: unit.propertyId,
        month,
        rentAmount: unit.monthlyRent,
        waterBill,
        totalAmount,
        paidAmount: paymentAmount,
        status,
        paidDate: paymentAmount > 0 ? new Date().toISOString() : undefined,
      });
      
      toast.success('Payment recorded successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment for Unit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium">{property?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Unit</span>
              <span className="font-medium">{unit.unitNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tenant</span>
              <span className="font-medium">
                {tenant ? `${tenant.firstName} ${tenant.lastName}` : 'No tenant'}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rent</span>
                <span>{formatCurrency(unit.monthlyRent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Water Bill</span>
                <span>{formatCurrency(waterBill)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t mt-2">
                <span>Total Due</span>
                <span>{formatCurrency(totalAmount)}</span>
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
                max={totalAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter payment amount"
              />
              <p className="text-xs text-muted-foreground">
                Enter 0 to create a pending payment record
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={isSubmitting || !tenant}>
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
