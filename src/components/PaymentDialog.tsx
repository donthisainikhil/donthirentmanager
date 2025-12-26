import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import { RentPayment, PaymentMethod } from '@/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Banknote, Smartphone, Wallet } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: RentPayment;
}

export function PaymentDialog({ open, onOpenChange, payment }: PaymentDialogProps) {
  const { markPaymentPaid, tenants, units, properties } = useStore();
  
  const tenant = tenants.find(t => t.id === payment.tenantId);
  const unit = units.find(u => u.id === payment.unitId);
  const property = properties.find(p => p.id === payment.propertyId);

  const remainingAmount = payment.totalAmount - payment.paidAmount;
  const advanceAvailable = tenant?.advancePaid || 0;

  const [amount, setAmount] = useState(remainingAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [useAdvance, setUseAdvance] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('0');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const remaining = payment.totalAmount - payment.paidAmount;
      setAmount(remaining.toString());
      setPaymentMethod('cash');
      setUseAdvance(false);
      setAdvanceAmount('0');
    }
  }, [open, payment]);

  // Calculate how much advance to use
  const advanceToUse = useAdvance ? Math.min(parseFloat(advanceAmount) || 0, advanceAvailable, remainingAmount) : 0;
  const directPaymentNeeded = Math.max(0, remainingAmount - advanceToUse);

  const handleAdvanceToggle = (checked: boolean) => {
    setUseAdvance(checked);
    if (checked) {
      // Default to using full advance or remaining amount, whichever is smaller
      const defaultAdvance = Math.min(advanceAvailable, remainingAmount);
      setAdvanceAmount(defaultAdvance.toString());
      setAmount(Math.max(0, remainingAmount - defaultAdvance).toString());
    } else {
      setAdvanceAmount('0');
      setAmount(remainingAmount.toString());
    }
  };

  const handleAdvanceAmountChange = (value: string) => {
    const advAmt = Math.min(parseFloat(value) || 0, advanceAvailable, remainingAmount);
    setAdvanceAmount(advAmt.toString());
    setAmount(Math.max(0, remainingAmount - advAmt).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount) || 0;
    const advanceUsed = useAdvance ? (parseFloat(advanceAmount) || 0) : 0;
    const totalPaying = paymentAmount + advanceUsed;
    
    if (totalPaying <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (totalPaying > remainingAmount) {
      toast.error('Total amount cannot exceed remaining balance');
      return;
    }

    if (advanceUsed > advanceAvailable) {
      toast.error('Advance amount exceeds available balance');
      return;
    }

    markPaymentPaid(payment.id, paymentAmount, paymentMethod, advanceUsed);
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

          {/* Advance Balance Section */}
          {advanceAvailable > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="font-medium">Advance Available</span>
                </div>
                <span className="font-bold text-primary">{formatCurrency(advanceAvailable)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="useAdvance" 
                  checked={useAdvance}
                  onCheckedChange={handleAdvanceToggle}
                />
                <Label htmlFor="useAdvance" className="text-sm cursor-pointer">
                  Use advance for this payment
                </Label>
              </div>
              {useAdvance && (
                <div className="space-y-2">
                  <Label htmlFor="advanceAmount" className="text-sm">Amount to deduct from advance</Label>
                  <Input
                    id="advanceAmount"
                    type="number"
                    min="0"
                    max={Math.min(advanceAvailable, remainingAmount)}
                    value={advanceAmount}
                    onChange={(e) => handleAdvanceAmountChange(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {useAdvance ? 'Additional Payment Amount (₹)' : 'Payment Amount (₹)'}
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                max={remainingAmount - advanceToUse}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {useAdvance && advanceToUse > 0 && (
                <p className="text-xs text-muted-foreground">
                  From advance: {formatCurrency(advanceToUse)} + Direct: {formatCurrency(parseFloat(amount) || 0)} = Total: {formatCurrency(advanceToUse + (parseFloat(amount) || 0))}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Payment Method {useAdvance && advanceToUse > 0 && parseFloat(amount) === 0 && '(for advance)'}</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="cash"
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  }`}
                >
                  <RadioGroupItem value="cash" id="cash" />
                  <Banknote className="w-5 h-5 text-success" />
                  <span className="font-medium">Cash</span>
                </Label>
                <Label
                  htmlFor="upi"
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  }`}
                >
                  <RadioGroupItem value="upi" id="upi" />
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span className="font-medium">UPI</span>
                </Label>
              </RadioGroup>
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
