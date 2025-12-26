import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: { id: string; name: string; address: string; totalUnits: number };
}

export function PropertyFormDialog({ open, onOpenChange, property }: PropertyFormDialogProps) {
  const { addProperty, updateProperty } = useStore();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [totalUnits, setTotalUnits] = useState('');

  // Sync form data when dialog opens or property changes
  useEffect(() => {
    if (open) {
      setName(property?.name || '');
      setAddress(property?.address || '');
      setTotalUnits(property?.totalUnits?.toString() || '');
    }
  }, [open, property]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !address.trim() || !totalUnits) {
      toast.error('Please fill all fields');
      return;
    }

    if (property) {
      updateProperty(property.id, { name, address, totalUnits: parseInt(totalUnits) });
      toast.success('Property updated successfully');
    } else {
      addProperty({ name, address, totalUnits: parseInt(totalUnits) });
      toast.success('Property added successfully');
    }

    onOpenChange(false);
    setName('');
    setAddress('');
    setTotalUnits('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'Add New Property'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Property Name</Label>
            <Input
              id="name"
              placeholder="e.g., Sunset Apartments"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="e.g., 123 Main Street, City"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="units">Total Units</Label>
            <Input
              id="units"
              type="number"
              min="1"
              placeholder="e.g., 10"
              value={totalUnits}
              onChange={(e) => setTotalUnits(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{property ? 'Update' : 'Add Property'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
