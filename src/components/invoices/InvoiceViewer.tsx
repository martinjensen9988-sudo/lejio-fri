import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoiceGeneration } from '@/hooks/useInvoiceGeneration';
import { useToast } from '@/hooks/use-toast';
import { Download, Mail, Check } from 'lucide-react';

interface InvoiceViewerProps {
  invoiceId: string;
  onClose?: () => void;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  status: string;
  amount_total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  issue_date: string;
  due_date: string;
  created_at: string;
  notes?: string;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ invoiceId, onClose }) => {
  const { toast } = useToast();
  const { sendInvoice, recordPayment, generateInvoicePDF } = useInvoiceGeneration();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, you would fetch the invoice data here
      // For now, this is a placeholder - the actual data would come from useInvoiceGeneration
      toast({
        title: 'Info',
        description: 'Load invoice implementation',
      });
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Failed to load invoice',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    try {
      setIsSending(true);
      await sendInvoice(invoiceId);
      toast({
        title: 'Succes',
        description: 'Invoice sent successfully',
      });
      loadInvoice();
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Failed to send invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        toast({
          title: 'Fejl',
          description: 'Please enter a valid payment amount',
          variant: 'destructive',
        });
        return;
      }

      setIsPaymentProcessing(true);
      await recordPayment(invoiceId, parseFloat(paymentAmount));
      toast({
        title: 'Succes',
        description: 'Payment recorded successfully',
      });
      setPaymentAmount('');
      loadInvoice();
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await generateInvoicePDF(invoiceId);
      toast({
        title: 'Succes',
        description: 'Invoice PDF generated',
      });
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!invoice) {
    return <div className="flex items-center justify-center p-8">Invoice not found</div>;
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    viewed: 'bg-purple-100 text-purple-800',
    partially_paid: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoice {invoice.invoice_number}</CardTitle>
            <p className="text-sm text-gray-500">
              {format(new Date(invoice.created_at), 'PPP', { locale: da })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[invoice.status] || 'bg-gray-100'}`}>
            {invoice.status}
          </span>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Invoice Date</p>
              <p className="font-medium">
                {format(new Date(invoice.issue_date), 'PPP', { locale: da })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-medium">
                {format(new Date(invoice.due_date), 'PPP', { locale: da })}
              </p>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-semibold">{invoice.amount_total.toFixed(2)} {invoice.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid</span>
              <span className="font-semibold text-green-600">{invoice.amount_paid.toFixed(2)} {invoice.currency}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600 font-medium">Remaining</span>
              <span className="font-bold">{invoice.amount_due.toFixed(2)} {invoice.currency}</span>
            </div>
          </div>

          {/* Payment History */}
          {invoice.amount_paid > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Payment Status</p>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="w-4 h-4" />
                {invoice.amount_paid.toFixed(2)} {invoice.currency} paid
              </div>
            </div>
          )}

          {/* Payment Input */}
          {invoice.status !== 'paid' && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Record Payment</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                  step="0.01"
                  min="0"
                  max={invoice.amount_due}
                />
                <Button
                  onClick={handleRecordPayment}
                  disabled={isPaymentProcessing || !paymentAmount}
                >
                  {isPaymentProcessing ? 'Processing...' : 'Record'}
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-blue-50 p-3 rounded text-sm text-gray-700">
              <p className="font-medium mb-1">Notes</p>
              <p>{invoice.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 border-t pt-4">
            {invoice.status === 'draft' && (
              <Button
                onClick={handleSendInvoice}
                disabled={isSending}
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                {isSending ? 'Sending...' : 'Send Invoice'}
              </Button>
            )}
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
