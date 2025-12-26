import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { UnitType, UNIT_TYPE_LABELS } from '@/types';

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  unit?: { id: string; unitNumber: string; type?: UnitType; monthlyRent: number; propertyId: string };
}

export function UnitFormDialog({ open, onOpenChange, propertyId, unit }: UnitFormDialogProps) {
  const { properties, addUnit, updateUnit } = useStore();
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState<UnitType>('single_room');
  const [monthlyRent, setMonthlyRent] = useState('');

  // Reset form when dialog opens or propertyId/unit changes
  useEffect(() => {
    if (open) {
      setSelectedPropertyId(unit?.propertyId || propertyId || '');
      setUnitNumber(unit?.unitNumber || '');
      setUnitType(unit?.type || 'single_room');
      setMonthlyRent(unit?.monthlyRent?.toString() || '');
    }
  }, [open, propertyId, unit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPropertyId || !unitNumber.trim() || !monthlyRent) {
      toast.error('Please fill all fields');
      return;
    }

    if (unit) {
      updateUnit(unit.id, { unitNumber, type: unitType, monthlyRent: parseFloat(monthlyRent) });
      toast.success('Unit updated successfully');
    } else {
      addUnit({ 
        propertyId: selectedPropertyId, 
        unitNumber, 
        type: unitType,
        monthlyRent: parseFloat(monthlyRent),
        isOccupied: false
      });
      toast.success('Unit added successfully');
    }

    onOpenChange(false);
    setUnitNumber('');
    setUnitType('single_room');
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
              <SelectContent className="bg-background border shadow-lg z-50">
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
            <Label>Unit Type</Label>
            <Select value={unitType} onValueChange={(value) => setUnitType(value as UnitType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit type" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {(Object.keys(UNIT_TYPE_LABELS) as UnitType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {UNIT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
