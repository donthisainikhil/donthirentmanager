import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Phone, Mail, Building2, Home, Pencil, Trash2, FileText } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TenantFormDialog } from '@/components/TenantFormDialog';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Tenants() {
  const { tenants, units, properties, deleteTenant } = useStore();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (tenant: any) => {
    setEditingTenant(tenant);
    setShowDialog(true);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteTenant(deleteConfirm);
    toast.success('Tenant removed successfully');
    setDeleteConfirm(null);
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Tenants</h1>
            <p className="text-muted-foreground">Manage your tenant information</p>
          </div>
          <Button 
            onClick={() => { setEditingTenant(null); setShowDialog(true); }} 
            variant="gradient"
            disabled={units.filter(u => !u.isOccupied).length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        </div>

        {units.filter(u => !u.isOccupied).length === 0 && properties.length > 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-sm text-warning">
            All units are currently occupied. Add more units to add new tenants.
          </div>
        )}

        {/* Tenants List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tenants.map((tenant, index) => {
            const unit = units.find(u => u.id === tenant.unitId);
            const property = properties.find(p => p.id === tenant.propertyId);

            return (
              <motion.div
                key={tenant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {tenant.firstName[0]}{tenant.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{tenant.firstName} {tenant.lastName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Since {formatDate(tenant.leaseStartDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tenant)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteConfirm(tenant.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{tenant.phone}</span>
                        {tenant.phone2 && <span>• {tenant.phone2}</span>}
                      </div>
                      {tenant.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>{tenant.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>{property?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Home className="w-4 h-4" />
                        <span>Unit {unit?.unitNumber}</span>
                        <Badge variant="secondary">{formatCurrency(unit?.monthlyRent || 0)}/month</Badge>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Advance</p>
                        <p className="font-semibold">{formatCurrency(tenant.advancePaid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Water Bill</p>
                        <p className="font-semibold">{formatCurrency(tenant.monthlyWaterBill)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Aadhar</p>
                        {tenant.aadharDocument ? (
                          <Badge variant="success" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Missing</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {tenants.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Tenants Yet</h3>
            <p className="text-muted-foreground mb-4">
              {properties.length === 0 
                ? 'Add properties and units first, then add tenants'
                : 'Add your first tenant to start tracking rent'}
            </p>
            {properties.length > 0 && units.filter(u => !u.isOccupied).length > 0 && (
              <Button variant="gradient" onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tenant
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Dialogs */}
      <TenantFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        tenant={editingTenant}
      />
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the tenant and mark the unit as vacant. Payment history will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
