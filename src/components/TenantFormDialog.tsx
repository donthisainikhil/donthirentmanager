import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon, Upload, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TenantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    phone2?: string;
    advancePaid: number;
    leaseStartDate: string;
    monthlyWaterBill: number;
    unitId: string;
    propertyId: string;
  };
}

export function TenantFormDialog({ open, onOpenChange, tenant }: TenantFormDialogProps) {
  const { properties, units, addTenant, updateTenant } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: tenant?.firstName || '',
    lastName: tenant?.lastName || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    phone2: tenant?.phone2 || '',
    advancePaid: tenant?.advancePaid?.toString() || '',
    monthlyWaterBill: tenant?.monthlyWaterBill?.toString() || '',
    propertyId: tenant?.propertyId || '',
    unitId: tenant?.unitId || '',
  });
  const [leaseDate, setLeaseDate] = useState<Date | undefined>(
    tenant?.leaseStartDate ? new Date(tenant.leaseStartDate) : undefined
  );
  const [aadharFile, setAadharFile] = useState<string | undefined>();
  const [aadharFileName, setAadharFileName] = useState<string | undefined>();

  const availableUnits = units.filter(
    u => u.propertyId === formData.propertyId && (!u.isOccupied || u.id === tenant?.unitId)
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAadharFile(reader.result as string);
        setAadharFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.unitId || !leaseDate) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!tenant && !aadharFile) {
      toast.error('Please upload Aadhar document');
      return;
    }

    const tenantData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      phone2: formData.phone2 || undefined,
      advancePaid: parseFloat(formData.advancePaid) || 0,
      leaseStartDate: leaseDate.toISOString(),
      monthlyWaterBill: parseFloat(formData.monthlyWaterBill) || 0,
      unitId: formData.unitId,
      propertyId: formData.propertyId,
      ...(aadharFile && { aadharDocument: aadharFile, aadharFileName }),
    };

    if (tenant) {
      updateTenant(tenant.id, tenantData);
      toast.success('Tenant updated successfully');
    } else {
      addTenant(tenantData);
      toast.success('Tenant added successfully');
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone2">Second Phone</Label>
              <Input
                id="phone2"
                value={formData.phone2}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Property *</Label>
            <Select
              value={formData.propertyId}
              onValueChange={(value) => setFormData({ ...formData, propertyId: value, unitId: '' })}
              disabled={!!tenant}
            >
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
            <Label>Unit *</Label>
            <Select
              value={formData.unitId}
              onValueChange={(value) => setFormData({ ...formData, unitId: value })}
              disabled={!formData.propertyId || !!tenant}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.unitNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lease Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !leaseDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {leaseDate ? format(leaseDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={leaseDate}
                  onSelect={setLeaseDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advance">Advance Paid (₹)</Label>
              <Input
                id="advance"
                type="number"
                min="0"
                value={formData.advancePaid}
                onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="water">Monthly Water Bill (₹)</Label>
              <Input
                id="water"
                type="number"
                min="0"
                value={formData.monthlyWaterBill}
                onChange={(e) => setFormData({ ...formData, monthlyWaterBill: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Aadhar Document {!tenant && '*'}</Label>
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
            {aadharFileName && (
              <p className="text-sm text-muted-foreground">Selected: {aadharFileName}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{tenant ? 'Update' : 'Add Tenant'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
