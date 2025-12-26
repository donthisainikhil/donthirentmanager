import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { Upload, Camera } from 'lucide-react';
import { Expense } from '@/types';

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense;
}

const generateMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = -6; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
};

export function ExpenseFormDialog({ open, onOpenChange, expense }: ExpenseFormDialogProps) {
  const { properties, addExpense, updateExpense, selectedMonth } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    month: expense?.month || selectedMonth,
    propertyId: expense?.propertyId || '',
    personName: expense?.personName || '',
    amount: expense?.amount?.toString() || '',
    purpose: expense?.purpose || '',
    comments: expense?.comments || '',
  });
  const [receiptFile, setReceiptFile] = useState<string | undefined>(expense?.receiptDocument);
  const [receiptFileName, setReceiptFileName] = useState<string | undefined>(expense?.receiptFileName);

  const monthOptions = generateMonthOptions();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptFile(reader.result as string);
        setReceiptFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.month || !formData.personName || !formData.amount || !formData.purpose) {
      toast.error('Please fill all required fields');
      return;
    }

    const expenseData = {
      month: formData.month,
      propertyId: formData.propertyId || undefined,
      personName: formData.personName,
      amount: parseFloat(formData.amount),
      purpose: formData.purpose,
      comments: formData.comments || undefined,
      ...(receiptFile && { receiptDocument: receiptFile, receiptFileName }),
    };

    if (expense) {
      updateExpense(expense.id, expenseData);
      toast.success('Expense updated successfully');
    } else {
      addExpense(expenseData);
      toast.success('Expense added successfully');
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Month *</Label>
            <Select value={formData.month} onValueChange={(value) => setFormData({ ...formData, month: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Property (Optional)</Label>
            <Select
              value={formData.propertyId}
              onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">General Expense</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personName">Person Name *</Label>
            <Input
              id="personName"
              value={formData.personName}
              onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose *</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Receipt</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment');
                    fileInputRef.current.click();
                  }
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
            </div>
            {receiptFileName && (
              <p className="text-sm text-muted-foreground">Selected: {receiptFileName}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{expense ? 'Update' : 'Add Expense'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
