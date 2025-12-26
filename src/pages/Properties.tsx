import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, MapPin, Home, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PropertyFormDialog } from '@/components/PropertyFormDialog';
import { UnitFormDialog } from '@/components/UnitFormDialog';
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

export default function Properties() {
  const { properties, units, deleteProperty, deleteUnit } = useStore();
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'property' | 'unit'; id: string } | null>(null);

  const handleAddUnit = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setEditingUnit(null);
    setShowUnitDialog(true);
  };

  const handleEditProperty = (property: any) => {
    setEditingProperty(property);
    setShowPropertyDialog(true);
  };

  const handleEditUnit = (unit: any) => {
    setEditingUnit(unit);
    setShowUnitDialog(true);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    
    if (deleteConfirm.type === 'property') {
      deleteProperty(deleteConfirm.id);
      toast.success('Property deleted successfully');
    } else {
      deleteUnit(deleteConfirm.id);
      toast.success('Unit deleted successfully');
    }
    setDeleteConfirm(null);
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Properties</h1>
            <p className="text-muted-foreground">Manage your rental properties and units</p>
          </div>
          <Button onClick={() => { setEditingProperty(null); setShowPropertyDialog(true); }} variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Properties List */}
        <div className="space-y-6">
          {properties.map((property, index) => {
            const propertyUnits = units.filter(u => u.propertyId === property.id);
            const occupiedCount = propertyUnits.filter(u => u.isOccupied).length;

            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="mb-1">{property.name}</CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {property.address}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">
                            {propertyUnits.length} units
                          </Badge>
                          <Badge variant={occupiedCount === propertyUnits.length ? 'success' : 'warning'}>
                            {occupiedCount}/{propertyUnits.length} occupied
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditProperty(property)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDeleteConfirm({ type: 'property', id: property.id })}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Units</h4>
                      <Button size="sm" variant="outline" onClick={() => handleAddUnit(property.id)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Unit
                      </Button>
                    </div>
                    {propertyUnits.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No units added yet
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {propertyUnits.map((unit) => (
                          <div
                            key={unit.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Home className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{unit.unitNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  ₹{unit.monthlyRent.toLocaleString()}/month
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={unit.isOccupied ? 'success' : 'secondary'}>
                                {unit.isOccupied ? 'Occupied' : 'Vacant'}
                              </Badge>
                              <Button variant="ghost" size="icon" onClick={() => handleEditUnit(unit)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setDeleteConfirm({ type: 'unit', id: unit.id })}
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {properties.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
            <p className="text-muted-foreground mb-4">Add your first property to get started</p>
            <Button variant="gradient" onClick={() => setShowPropertyDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </motion.div>
        )}
      </div>

      {/* Dialogs */}
      <PropertyFormDialog
        open={showPropertyDialog}
        onOpenChange={setShowPropertyDialog}
        property={editingProperty}
      />
      <UnitFormDialog
        open={showUnitDialog}
        onOpenChange={setShowUnitDialog}
        propertyId={selectedPropertyId}
        unit={editingUnit}
      />
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteConfirm?.type} and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
