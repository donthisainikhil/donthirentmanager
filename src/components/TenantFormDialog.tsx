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
import { CalendarIcon, Upload, Camera, User, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tenant } from '@/types';
import { z } from 'zod';

interface TenantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null;
}

// Validation schema
const tenantSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15, 'Phone is too long')
    .regex(/^[0-9+\-\s]+$/, 'Invalid phone number format'),
  phone2: z.string().optional(),
  advancePaid: z.string().optional(),
  monthlyWaterBill: z.string().optional(),
  propertyId: z.string().min(1, 'Please select a property'),
  unitId: z.string().min(1, 'Please select a unit'),
  aadharNumber: z.string()
    .regex(/^[0-9\s]*$/, 'Aadhar number should contain only digits')
    .optional()
    .or(z.literal('')),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof tenantSchema> | 'leaseDate' | 'aadharDocument', string>>;

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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Reset form when dialog opens/closes
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
      setErrors({});
      setTouched(new Set());
    }
  }, [open, tenant]);

  const availableUnits = units.filter(
    u => u.propertyId === formData.propertyId && (!u.isOccupied || u.id === tenant?.unitId)
  );

  const validateField = (field: string, value: string) => {
    try {
      const partialSchema = tenantSchema.pick({ [field]: true } as any);
      partialSchema.parse({ [field]: value });
      setErrors(prev => ({ ...prev, [field]: undefined }));
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: err.errors[0]?.message }));
      }
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => new Set(prev).add(field));
    validateField(field, formData[field as keyof typeof formData] || '');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched.has(field)) {
      validateField(field, value);
    }
  };

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
        setErrors(prev => ({ ...prev, aadharDocument: undefined }));
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

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {};
    
    // Validate using zod schema
    const result = tenantSchema.safeParse(formData);
    if (!result.success) {
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FieldErrors;
        if (!newErrors[field]) {
          newErrors[field] = err.message;
        }
      });
    }

    // Additional validations
    if (!leaseDate) {
      newErrors.leaseDate = 'Lease start date is required';
    }

    if (!tenant && !aadharFile) {
      newErrors.aadharDocument = 'Aadhar document is required';
    }

    setErrors(newErrors);
    
    // Mark all fields as touched
    setTouched(new Set(Object.keys(formData)));

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const tenantData: Record<string, any> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim(),
        advancePaid: parseFloat(formData.advancePaid) || 0,
        leaseStartDate: leaseDate!.toISOString(),
        monthlyWaterBill: parseFloat(formData.monthlyWaterBill) || 0,
        unitId: formData.unitId,
        propertyId: formData.propertyId,
      };

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

  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    );
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
                onChange={(e) => handleChange('firstName', e.target.value)}
                onBlur={() => handleBlur('firstName')}
                className={cn(errors.firstName && touched.has('firstName') && 'border-destructive')}
              />
              {touched.has('firstName') && <ErrorMessage error={errors.firstName} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                onBlur={() => handleBlur('lastName')}
                className={cn(errors.lastName && touched.has('lastName') && 'border-destructive')}
              />
              {touched.has('lastName') && <ErrorMessage error={errors.lastName} />}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={cn(errors.email && touched.has('email') && 'border-destructive')}
              placeholder="example@email.com"
            />
            {touched.has('email') && <ErrorMessage error={errors.email} />}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={cn(errors.phone && touched.has('phone') && 'border-destructive')}
                placeholder="9876543210"
              />
              {touched.has('phone') && <ErrorMessage error={errors.phone} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone2">Second Phone</Label>
              <Input
                id="phone2"
                value={formData.phone2}
                onChange={(e) => handleChange('phone2', e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Property *</Label>
            <Select
              value={formData.propertyId}
              onValueChange={(value) => {
                handleChange('propertyId', value);
                handleChange('unitId', '');
                setErrors(prev => ({ ...prev, propertyId: undefined }));
              }}
              disabled={!!tenant}
            >
              <SelectTrigger className={cn(errors.propertyId && 'border-destructive')}>
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
            <ErrorMessage error={errors.propertyId} />
          </div>

          <div className="space-y-2">
            <Label>Unit *</Label>
            <Select
              value={formData.unitId}
              onValueChange={(value) => {
                handleChange('unitId', value);
                setErrors(prev => ({ ...prev, unitId: undefined }));
              }}
              disabled={!formData.propertyId || !!tenant}
            >
              <SelectTrigger className={cn(errors.unitId && 'border-destructive')}>
                <SelectValue placeholder={formData.propertyId ? "Select unit" : "Select property first"} />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No available units
                  </div>
                ) : (
                  availableUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unitNumber} - ₹{unit.monthlyRent}/month
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <ErrorMessage error={errors.unitId} />
          </div>

          <div className="space-y-2">
            <Label>Lease Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !leaseDate && "text-muted-foreground",
                    errors.leaseDate && "border-destructive"
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
                  onSelect={(date) => {
                    setLeaseDate(date);
                    setErrors(prev => ({ ...prev, leaseDate: undefined }));
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <ErrorMessage error={errors.leaseDate} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advance">Advance Paid (₹)</Label>
              <Input
                id="advance"
                type="number"
                min="0"
                value={formData.advancePaid}
                onChange={(e) => handleChange('advancePaid', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="water">Monthly Water Bill (₹)</Label>
              <Input
                id="water"
                type="number"
                min="0"
                value={formData.monthlyWaterBill}
                onChange={(e) => handleChange('monthlyWaterBill', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aadharNumber">Aadhar Number</Label>
            <Input
              id="aadharNumber"
              value={formData.aadharNumber}
              onChange={(e) => handleChange('aadharNumber', e.target.value)}
              onBlur={() => handleBlur('aadharNumber')}
              className={cn(errors.aadharNumber && touched.has('aadharNumber') && 'border-destructive')}
              placeholder="XXXX XXXX XXXX"
              maxLength={14}
            />
            {touched.has('aadharNumber') && <ErrorMessage error={errors.aadharNumber} />}
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
            <div className={cn(
              "flex gap-2",
              errors.aadharDocument && "border border-destructive rounded-lg p-2"
            )}>
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
            <ErrorMessage error={errors.aadharDocument} />
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
