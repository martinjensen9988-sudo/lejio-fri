import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Invoice, CreateInvoiceInput } from '@/hooks/useFriInvoices';

interface FriInvoiceFormProps {
  invoice?: Invoice | null;
  generateInvoiceNumber: () => string;
  onSubmit: (data: CreateInvoiceInput) => Promise<void>;
  onCancel: () => void;
}

export function FriInvoiceForm({
  invoice,
  generateInvoiceNumber,
  onSubmit,
  onCancel,
}: FriInvoiceFormProps) {
  const [formData, setFormData] = useState<CreateInvoiceInput>({
    invoice_number: invoice?.invoice_number || generateInvoiceNumber(),
    customer_name: invoice?.customer_name || '',
    customer_email: invoice?.customer_email || '',
    amount: invoice?.amount || 0,
    tax_amount: invoice?.tax_amount,
    description: invoice?.description || '',
    issued_date: invoice?.issued_date || new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date || '',
    payment_method: invoice?.payment_method,
    notes: invoice?.notes || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving invoice');
    } finally {
      setLoading(false);
    }
  };

  const total = (formData.amount || 0) + (formData.tax_amount || 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">
          {invoice ? 'Rediger faktura' : 'Opret ny faktura'}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fakturaoplysninger</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fakturanummer *
              </label>
              <Input
                value={formData.invoice_number}
                onChange={(e) =>
                  setFormData({ ...formData, invoice_number: e.target.value })
                }
                placeholder="INV-20260127-0001"
                required
              />
            </div>

            {/* Customer Info */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Kundeoplysninger</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kundenavn *
                  </label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    placeholder="Kunde navn"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_email: e.target.value })
                    }
                    placeholder="kunde@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description & Amount */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Fakturadetaljer</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beskrivelse *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Fx. Biludlejning for juli 2026"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beløb (kr.) *
                    </label>
                    <Input
                      type="number"
                      step="50"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Moms (kr.)
                    </label>
                    <Input
                      type="number"
                      step="10"
                      value={formData.tax_amount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tax_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      I alt
                    </label>
                    <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold">
                      kr. {total.toLocaleString('da-DK')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Datoer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Faktureringsdato *
                  </label>
                  <Input
                    type="date"
                    value={formData.issued_date}
                    onChange={(e) =>
                      setFormData({ ...formData, issued_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forfaldsdato *
                  </label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Øvrig information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Betalingsmetode
                  </label>
                  <Input
                    value={formData.payment_method || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_method: e.target.value })
                    }
                    placeholder="Fx. Bankoverførsel, Kreditkort"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Noter
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Interne noter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end border-t pt-6">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Annuller
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Gemmer...' : 'Gem faktura'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
