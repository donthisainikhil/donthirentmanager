import { useState, useRef, useEffect } from 'react';
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
import { CalendarIcon, Upload, Camera, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tenant } from '@/types';

interface TenantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null;
}

export function TenantFormDialog({ open, onOpenChange, tenant }: TenantFormDialogProps) {
  const { properties, units, addTenant, updateTenant } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phone2: '',
    advancePaid: '',
    monthlyWaterBill: '',
    propertyId: '',
    unitId: '',
    aadharNumber: '',
  });
  const [leaseDate, setLeaseDate] = useState<Date | undefined>(undefined);
  const [aadharFile, setAadharFile] = useState<string | undefined>();
  const [aadharFileName, setAadharFileName] = useState<string | undefined>();
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form data when dialog opens or tenant changes
  useEffect(() => {
    if (open) {
      setFormData({
        firstName: tenant?.firstName || '',
        lastName: tenant?.lastName || '',
        email: tenant?.email || '',
        phone: tenant?.phone || '',
        phone2: tenant?.phone2 || '',
        advancePaid: tenant?.advancePaid?.toString() || '',
        monthlyWaterBill: tenant?.monthlyWaterBill?.toString() || '',
        propertyId: tenant?.propertyId || '',
        unitId: tenant?.unitId || '',
        aadharNumber: tenant?.aadharNumber || '',
      });
      setLeaseDate(tenant?.leaseStartDate ? new Date(tenant.leaseStartDate) : undefined);
      setAadharFile(tenant?.aadharDocument);
      setAadharFileName(tenant?.aadharFileName);
      setProfilePhoto(tenant?.profilePhoto);
    }
  }, [open, tenant]);

  const availableUnits = units.filter(
    u => u.propertyId === formData.propertyId && (!u.isOccupied || u.id === tenant?.unitId)
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAadharFile(reader.result as string);
        setAadharFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Photo size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.unitId || !leaseDate) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!tenant && !aadharFile) {
      toast.error('Please upload Aadhar document');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build tenant data object, excluding undefined values (Firebase doesn't allow undefined)
      const tenantData: Record<string, any> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim(),
        advancePaid: parseFloat(formData.advancePaid) || 0,
        leaseStartDate: leaseDate.toISOString(),
        monthlyWaterBill: parseFloat(formData.monthlyWaterBill) || 0,
        unitId: formData.unitId,
        propertyId: formData.propertyId,
      };

      // Only add optional fields if they have values
      if (formData.phone2?.trim()) {
        tenantData.phone2 = formData.phone2.trim();
      }
      if (formData.aadharNumber?.trim()) {
        tenantData.aadharNumber = formData.aadharNumber.trim();
      }
      if (aadharFile) {
        tenantData.aadharDocument = aadharFile;
        if (aadharFileName) {
          tenantData.aadharFileName = aadharFileName;
        }
      }
      if (profilePhoto) {
        tenantData.profilePhoto = profilePhoto;
      }

      if (tenant) {
        await updateTenant(tenant.id, tenantData);
        toast.success('Tenant updated successfully');
      } else {
        await addTenant(tenantData as any);
        toast.success('Tenant added successfully');
      }

      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save tenant');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Photo */}
          <div className="flex justify-center">
            <div className="relative">
              {profilePhoto ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20">
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full w-8 h-8"
                onClick={() => photoInputRef.current?.click()}
              >
                <Camera className="w-4 h-4" />
              </Button>
              {profilePhoto && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-0 right-0 rounded-full w-6 h-6"
                  onClick={() => setProfilePhoto(undefined)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

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
            <Label htmlFor="aadharNumber">Aadhar Number</Label>
            <Input
              id="aadharNumber"
              value={formData.aadharNumber}
              onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
              placeholder="XXXX XXXX XXXX"
              maxLength={14}
            />
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
            {aadharFile && (
              <div className="mb-2 p-2 border rounded-lg bg-muted">
                {aadharFile.startsWith('data:image') ? (
                  <img src={aadharFile} alt="Aadhar preview" className="max-h-32 mx-auto rounded" />
                ) : (
                  <p className="text-sm text-center text-muted-foreground">{aadharFileName || 'Document uploaded'}</p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-destructive"
                  onClick={() => { setAadharFile(undefined); setAadharFileName(undefined); }}
                >
                  <X className="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
            )}
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (tenant ? 'Update' : 'Add Tenant')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
