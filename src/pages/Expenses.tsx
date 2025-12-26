import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Receipt, Pencil, Trash2, FileText, IndianRupee, TrendingDown, Wallet, ZoomIn, ZoomOut, Download, RotateCcw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useExpenseStats } from '@/hooks/useDashboardStats';
import { Layout } from '@/components/Layout';
import { MonthSelector } from '@/components/MonthSelector';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExpenseFormDialog } from '@/components/ExpenseFormDialog';
import { formatCurrency, formatMonth, formatDate } from '@/lib/formatters';
import { Expense } from '@/types';
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

export default function Expenses() {
  const { expenses, properties, selectedMonth, deleteExpense } = useStore();
  const expenseStats = useExpenseStats(selectedMonth);
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewReceipt, setViewReceipt] = useState<{ url: string; name: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  const handleDownload = () => {
    if (!viewReceipt) return;
    const link = document.createElement('a');
    link.href = viewReceipt.url;
    link.download = viewReceipt.name || 'receipt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Receipt downloaded');
  };

  const handleCloseReceipt = () => {
    setViewReceipt(null);
    setZoomLevel(1);
  };

  const monthExpenses = expenses.filter(e => e.month === selectedMonth);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowDialog(true);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteExpense(deleteConfirm);
    toast.success('Expense deleted successfully');
    setDeleteConfirm(null);
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground">Track expenses for {formatMonth(selectedMonth)}</p>
          </div>
          <div className="flex items-center gap-3">
            <MonthSelector />
            <Button onClick={() => { setEditingExpense(null); setShowDialog(true); }} variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Rent Collected"
            value={formatCurrency(expenseStats.totalRentCollected)}
            icon={IndianRupee}
            variant="success"
            delay={0}
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(expenseStats.totalExpenses)}
            subtitle={`${expenseStats.expenseCount} expenses`}
            icon={TrendingDown}
            variant="danger"
            delay={0.1}
          />
          <StatCard
            title="Leftover Balance"
            value={formatCurrency(expenseStats.leftoverBalance)}
            icon={Wallet}
            variant={expenseStats.leftoverBalance >= 0 ? 'success' : 'danger'}
            delay={0.2}
          />
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          {monthExpenses.map((expense, index) => {
            const property = properties.find(p => p.id === expense.propertyId);

            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-danger/10 rounded-xl">
                          <Receipt className="w-5 h-5 text-danger" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{expense.purpose}</h3>
                            {property && (
                              <Badge variant="secondary">{property.name}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Paid to: {expense.personName}
                          </p>
                          {expense.comments && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {expense.comments}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{formatDate(expense.createdAt)}</span>
                            {expense.receiptDocument && (
                              <Badge 
                                variant="success" 
                                className="text-xs cursor-pointer hover:opacity-80"
                                onClick={() => setViewReceipt({ 
                                  url: expense.receiptDocument!, 
                                  name: expense.receiptFileName || 'Receipt' 
                                })}
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                View Receipt
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg text-danger">
                          -{formatCurrency(expense.amount)}
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteConfirm(expense.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {monthExpenses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Expenses for {formatMonth(selectedMonth)}</h3>
            <p className="text-muted-foreground mb-4">Track your property-related expenses here</p>
            <Button variant="gradient" onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </motion.div>
        )}
      </div>

      {/* Dialogs */}
      <ExpenseFormDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setEditingExpense(null);
        }}
        expense={editingExpense || undefined}
      />
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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

      {/* Receipt Viewer Dialog */}
      <Dialog open={!!viewReceipt} onOpenChange={handleCloseReceipt}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewReceipt?.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {/* Toolbar */}
          <div className="flex items-center justify-center gap-2 py-2 border-b">
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoomLevel * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 3}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          {/* Image/PDF Viewer */}
          <div className="flex items-center justify-center overflow-auto max-h-[60vh] bg-muted/30 rounded-lg p-4">
            {viewReceipt?.url.startsWith('data:application/pdf') ? (
              <iframe 
                src={viewReceipt.url} 
                className="w-full h-[55vh] border rounded-lg"
                title="Receipt PDF"
              />
            ) : (
              <img 
                src={viewReceipt?.url} 
                alt="Receipt" 
                className="max-w-full max-h-[55vh] object-contain rounded-lg transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
