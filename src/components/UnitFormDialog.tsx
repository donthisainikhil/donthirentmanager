import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  unit?: { id: string; unitNumber: string; monthlyRent: number; propertyId: string };
}

export function UnitFormDialog({ open, onOpenChange, propertyId, unit }: UnitFormDialogProps) {
  const { properties, addUnit, updateUnit } = useStore();
  const [selectedPropertyId, setSelectedPropertyId] = useState(unit?.propertyId || propertyId || '');
  const [unitNumber, setUnitNumber] = useState(unit?.unitNumber || '');
  const [monthlyRent, setMonthlyRent] = useState(unit?.monthlyRent?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPropertyId || !unitNumber.trim() || !monthlyRent) {
      toast.error('Please fill all fields');
      return;
    }

    if (unit) {
      updateUnit(unit.id, { unitNumber, monthlyRent: parseFloat(monthlyRent) });
      toast.success('Unit updated successfully');
    } else {
      addUnit({ 
        propertyId: selectedPropertyId, 
        unitNumber, 
        monthlyRent: parseFloat(monthlyRent),
        isOccupied: false
      });
      toast.success('Unit added successfully');
    }

    onOpenChange(false);
    setUnitNumber('');
    setMonthlyRent('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{unit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Property</Label>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId} disabled={!!unit}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitNumber">Unit Number</Label>
            <Input
              id="unitNumber"
              placeholder="e.g., A-101"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rent">Monthly Rent (₹)</Label>
            <Input
              id="rent"
              type="number"
              min="0"
              placeholder="e.g., 15000"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{unit ? 'Update' : 'Add Unit'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
