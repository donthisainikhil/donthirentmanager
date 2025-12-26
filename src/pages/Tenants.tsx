import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Phone, Mail, Building2, Home, Pencil, Trash2, FileText, Eye, X, Image } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TenantFormDialog } from '@/components/TenantFormDialog';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Tenant } from '@/types';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Tenants() {
  const { tenants, units, properties, deleteTenant } = useStore();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);

  const handleEdit = (tenant: Tenant) => {
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
                        {tenant.profilePhoto ? (
                          <div 
                            className="w-12 h-12 rounded-full overflow-hidden cursor-pointer border-2 border-primary/20 hover:border-primary transition-colors"
                            onClick={() => setViewingTenant(tenant)}
                          >
                            <img 
                              src={tenant.profilePhoto} 
                              alt={`${tenant.firstName} ${tenant.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div 
                            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={() => setViewingTenant(tenant)}
                          >
                            <span className="text-lg font-bold text-primary">
                              {tenant.firstName[0]}{tenant.lastName[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{tenant.firstName} {tenant.lastName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Since {formatDate(tenant.leaseStartDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingTenant(tenant)}>
                          <Eye className="w-4 h-4" />
                        </Button>
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
                          <Badge variant="success" className="text-xs cursor-pointer" onClick={() => setViewingTenant(tenant)}>
                            <FileText className="w-3 h-3 mr-1" />
                            View
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

      {/* Add/Edit Tenant Dialog */}
      <TenantFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        tenant={editingTenant}
      />

      {/* View Tenant Profile Dialog */}
      <Dialog open={!!viewingTenant} onOpenChange={() => setViewingTenant(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tenant Profile</DialogTitle>
          </DialogHeader>
          {viewingTenant && (
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="flex justify-center">
                {viewingTenant.profilePhoto ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                    <img 
                      src={viewingTenant.profilePhoto} 
                      alt={`${viewingTenant.firstName} ${viewingTenant.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {viewingTenant.firstName[0]}{viewingTenant.lastName[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Tenant Info */}
              <div className="text-center">
                <h2 className="text-xl font-bold">{viewingTenant.firstName} {viewingTenant.lastName}</h2>
                <p className="text-muted-foreground">{viewingTenant.phone}</p>
                {viewingTenant.email && <p className="text-muted-foreground">{viewingTenant.email}</p>}
              </div>

              {/* Details */}
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Property</span>
                  <span className="font-medium">{properties.find(p => p.id === viewingTenant.propertyId)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unit</span>
                  <span className="font-medium">{units.find(u => u.id === viewingTenant.unitId)?.unitNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lease Start</span>
                  <span className="font-medium">{formatDate(viewingTenant.leaseStartDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Advance Paid</span>
                  <span className="font-medium">{formatCurrency(viewingTenant.advancePaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Water Bill</span>
                  <span className="font-medium">{formatCurrency(viewingTenant.monthlyWaterBill)}</span>
                </div>
                {viewingTenant.aadharNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Aadhar Number</span>
                    <span className="font-medium">{viewingTenant.aadharNumber}</span>
                  </div>
                )}
              </div>

              {/* Aadhar Document */}
              {viewingTenant.aadharDocument && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Aadhar Document
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    {viewingTenant.aadharDocument.startsWith('data:image') ? (
                      <img 
                        src={viewingTenant.aadharDocument} 
                        alt="Aadhar Document"
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="p-4 bg-muted text-center">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{viewingTenant.aadharFileName || 'Document'}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = viewingTenant.aadharDocument!;
                            link.download = viewingTenant.aadharFileName || 'aadhar-document';
                            link.click();
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
