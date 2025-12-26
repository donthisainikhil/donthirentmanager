import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import { PaymentMethod } from '@/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Banknote, Smartphone } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdvancePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
}

export function AdvancePaymentDialog({ open, onOpenChange, month }: AdvancePaymentDialogProps) {
  const { addPayment, tenants, units, properties } = useStore();
  
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);
  const selectedUnit = units.find(u => u.id === selectedTenant?.unitId);
  const selectedProperty = properties.find(p => p.id === selectedTenant?.propertyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTenantId) {
      toast.error('Please select a tenant');
      return;
    }
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedTenant || !selectedUnit) {
      toast.error('Invalid tenant or unit');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create an advance payment record
      // This is recorded as a paid payment for the selected month
      await addPayment({
        tenantId: selectedTenant.id,
        unitId: selectedUnit.id,
        propertyId: selectedUnit.propertyId,
        month,
        rentAmount: 0, // Advance payments don't have rent breakdown
        waterBill: 0,
        totalAmount: paymentAmount,
        paidAmount: paymentAmount,
        status: 'paid',
        paidDate: new Date().toISOString(),
        paymentMethod,
      });
      
      toast.success('Advance payment recorded successfully');
      onOpenChange(false);
      // Reset form
      setSelectedTenantId('');
      setAmount('');
      setPaymentMethod('cash');
    } catch (error) {
      toast.error('Failed to record advance payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedTenantId('');
    setAmount('');
    setPaymentMethod('cash');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Advance Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant">Select Tenant</Label>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => {
                    const unit = units.find(u => u.id === tenant.unitId);
                    const property = properties.find(p => p.id === tenant.propertyId);
                    return (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.firstName} {tenant.lastName} - {property?.name} (Unit {unit?.unitNumber})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedTenant && selectedUnit && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tenant</span>
                  <span className="font-medium">{selectedTenant.firstName} {selectedTenant.lastName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Property</span>
                  <span className="font-medium">{selectedProperty?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unit</span>
                  <span className="font-medium">{selectedUnit.unitNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Advance</span>
                  <span className="font-medium">{formatCurrency(selectedTenant.advancePaid)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Advance Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter advance amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="advance-cash"
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  }`}
                >
                  <RadioGroupItem value="cash" id="advance-cash" />
                  <Banknote className="w-5 h-5 text-success" />
                  <span className="font-medium">Cash</span>
                </Label>
                <Label
                  htmlFor="advance-upi"
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  }`}
                >
                  <RadioGroupItem value="upi" id="advance-upi" />
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span className="font-medium">UPI</span>
                </Label>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={isSubmitting || !selectedTenantId}>
                {isSubmitting ? 'Recording...' : 'Record Advance'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}