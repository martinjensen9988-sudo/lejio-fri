import { useFriInvoices, Invoice, CreateInvoiceInput } from '@/hooks/useFriInvoices';
import { useState } from 'react';
import {
  AlertCircle,
  Trash2,
  Edit2,
  Plus,
  FileText,
  Send,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FriInvoiceForm } from './FriInvoiceForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FriInvoiceListProps {
  lessorId: string | null;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-800',
};

const statusLabel: Record<string, string> = {
  draft: 'Kladde',
  sent: 'Sendt',
  paid: 'Betalt',
  overdue: 'Forfalden',
  cancelled: 'Aflyst',
};

export function FriInvoiceList({ lessorId }: FriInvoiceListProps) {
  const {
    invoices,
    loading,
    error,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    updateStatus,
    markAsPaid,
    calculateTotal,
    isOverdue,
    generateInvoiceNumber,
  } = useFriInvoices(lessorId);

  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddInvoice = async (data: CreateInvoiceInput) => {
    try {
      setFormError(null);
      await addInvoice(data);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error adding invoice');
    }
  };

  const handleUpdateInvoice = async (data: CreateInvoiceInput) => {
    try {
      setFormError(null);
      if (!editingInvoice) return;
      await updateInvoice(editingInvoice.id, data);
      setEditingInvoice(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error updating invoice');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      setFormError(null);
      await deleteInvoice(id);
      setDeleteId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error deleting invoice');
    }
  };

  const handleSendInvoice = async (id: string) => {
    try {
      setFormError(null);
      await updateStatus(id, 'sent');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error sending invoice');
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      setFormError(null);
      await markAsPaid(id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error marking as paid');
    }
  };

  if (showForm || editingInvoice) {
    return (
      <FriInvoiceForm
        invoice={editingInvoice}
        generateInvoiceNumber={generateInvoiceNumber}
        onSubmit={editingInvoice ? handleUpdateInvoice : handleAddInvoice}
        onCancel={() => {
          setShowForm(false);
          setEditingInvoice(null);
        }}
      />
    );
  }

  if (loading) {
    return <div className="text-center py-8">Indlæser fakturaer...</div>;
  }

  // Calculate summary stats
  const stats = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + calculateTotal(inv.amount, inv.tax_amount, inv.total_amount), 0),
    paidAmount: invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + calculateTotal(inv.amount, inv.tax_amount, inv.total_amount), 0),
    overdueInvoices: invoices.filter((inv) => isOverdue(inv)).length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Fakturaer</h2>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Ny faktura
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Fejl ved indlæsning</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {formError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{formError}</p>
        </div>
      )}

      {/* Summary Stats */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600">I alt fakturaer</p>
            <p className="text-2xl font-bold text-blue-600">kr. {stats.totalAmount.toLocaleString('da-DK')}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <p className="text-sm text-gray-600">Betalt</p>
            <p className="text-2xl font-bold text-green-600">kr. {stats.paidAmount.toLocaleString('da-DK')}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            <p className="text-sm text-gray-600">Udestående</p>
            <p className="text-2xl font-bold text-orange-600">
              kr. {(stats.totalAmount - stats.paidAmount).toLocaleString('da-DK')}
            </p>
          </div>
          {stats.overdueInvoices > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <p className="text-sm text-gray-600">Forfaldne</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdueInvoices}</p>
            </div>
          )}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Ingen fakturaer endnu</p>
          <Button onClick={() => setShowForm(true)}>Opret første faktura</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const total = calculateTotal(invoice.amount, invoice.tax_amount, invoice.total_amount);
            const overdue = isOverdue(invoice);
            const displayStatus = overdue && invoice.status !== 'paid' ? 'overdue' : invoice.status;

            return (
              <div
                key={invoice.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
                    <Badge className={statusColors[displayStatus]}>
                      {statusLabel[displayStatus]}
                    </Badge>
                    {overdue && invoice.status !== 'paid' && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium">Forfalden</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <p className="text-gray-500">Kunde</p>
                      <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Faktureret</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(invoice.issued_date).toLocaleDateString('da-DK')}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Forfald</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(invoice.due_date).toLocaleDateString('da-DK')}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Beløb</p>
                      <p className="font-semibold text-gray-900">kr. {total.toLocaleString('da-DK')}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Beskrivelse</p>
                      <p className="text-gray-700 truncate">{invoice.description}</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <a href={`mailto:${invoice.customer_email}`} className="text-blue-600 hover:underline">
                      {invoice.customer_email}
                    </a>
                    {invoice.notes && <p className="text-gray-600 italic mt-1">Noter: {invoice.notes}</p>}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {invoice.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendInvoice(invoice.id)}
                        className="text-xs gap-1"
                      >
                        <Send className="w-3 h-3" /> Send
                      </Button>
                    )}
                    {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsPaid(invoice.id)}
                        className="text-xs gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Markér betalt
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingInvoice(invoice)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(invoice.id)}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet faktura?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette denne faktura? Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && handleDeleteInvoice(deleteId)}
            >
              Slet
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
