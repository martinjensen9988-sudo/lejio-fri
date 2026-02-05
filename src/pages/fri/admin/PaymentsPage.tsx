import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFriPayments } from '@/hooks/useFriPayments';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

const statusBadges = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Afventer' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Gennemført' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Fejl' },
  refunded: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Refunderet' },
};

export const FriAdminPaymentsPage = () => {
  const { payments, stats, loading, error, fetchPayments, updatePaymentStatus, recordManualPayment } = useFriPayments();
  const [filter, setFilter] = useState('all');
  const [searchEmail, setSearchEmail] = useState('');
  const [newPaymentDialogOpen, setNewPaymentDialogOpen] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState({
    lessorEmail: '',
    amount: '',
    method: 'bank_transfer',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments(filter);
  }, [filter]);

  const filteredPayments = payments.filter(p => {
    if (searchEmail && !p.lessor_email.toLowerCase().includes(searchEmail.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      await updatePaymentStatus(paymentId, newStatus as any);
    } catch (err) {
      console.error('Error updating payment:', err);
    }
  };

  const handleRecordManualPayment = async () => {
    if (!newPaymentData.lessorEmail || !newPaymentData.amount) return;

    try {
      setIsSubmitting(true);
      const lessor = payments.find(p => p.lessor_email === newPaymentData.lessorEmail);
      if (!lessor) {
        alert('Lessor email not found');
        return;
      }

      await recordManualPayment(
        lessor.lessor_id,
        parseFloat(newPaymentData.amount),
        newPaymentData.method,
        newPaymentData.notes
      );

      setNewPaymentData({ lessorEmail: '', amount: '', method: 'bank_transfer', notes: '' });
      setNewPaymentDialogOpen(false);
    } catch (err) {
      console.error('Error recording payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Indlæser betalinger...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Betalinger</h1>
          </div>
          <p className="text-gray-600">Administrer lessor abonnement betalinger</p>
        </div>
        <Dialog open={newPaymentDialogOpen} onOpenChange={setNewPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <CreditCard className="w-4 h-4" />
              Registrer betaling
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrer manuel betaling</DialogTitle>
              <DialogDescription>Registrer en betaling fra en lessor</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Lessor email</label>
                <Input
                  type="email"
                  placeholder="lessor@example.com"
                  value={newPaymentData.lessorEmail}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, lessorEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Beløb (DKK)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={newPaymentData.amount}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Betalingsmetode</label>
                <Select value={newPaymentData.method} onValueChange={(value) => setNewPaymentData({ ...newPaymentData, method: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Kort</SelectItem>
                    <SelectItem value="bank_transfer">Bankoverførsel</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Noter (valgfrit)</label>
                <Textarea
                  placeholder="Skriv noter her..."
                  value={newPaymentData.notes}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Button onClick={handleRecordManualPayment} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Registrerer...' : 'Registrer betaling'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  kr. {(stats.total_revenue / 1000).toFixed(1)}k
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Gennemført</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed_payments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Afventer</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending_payments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Fejlet</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed_payments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Gennemsnit</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  kr. {stats.avg_payment.toLocaleString('da-DK', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Revenue Chart */}
      {stats && stats.monthly_data.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Månedlig revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthly_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `kr. ${value.toLocaleString('da-DK')}`} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <div className="flex gap-2">
          {['all', 'pending', 'completed', 'failed'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {statusBadges[status as keyof typeof statusBadges]?.label}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Søg efter email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Payments Table */}
      <Card>
        {filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Lessor</TableHead>
                  <TableHead>Beløb</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dato</TableHead>
                  <TableHead className="text-right">Handling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const statusBadge = statusBadges[payment.status];
                  return (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{payment.lessor_name}</div>
                        <div className="text-sm text-gray-600">{payment.lessor_email}</div>
                      </TableCell>
                      <TableCell className="font-bold">
                        {payment.amount.toLocaleString('da-DK')} kr.
                      </TableCell>
                      <TableCell className="capitalize text-sm">{payment.subscription_type}</TableCell>
                      <TableCell className="capitalize text-sm">{payment.payment_method}</TableCell>
                      <TableCell>
                        <Select value={payment.status} onValueChange={(value) => handleStatusChange(payment.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusBadges).map(([key, badge]) => (
                              <SelectItem key={key} value={key}>
                                {badge.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(payment.created_at), { locale: da })}
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.notes && (
                          <div className="text-xs text-gray-500 truncate max-w-xs" title={payment.notes}>
                            {payment.notes}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600">Ingen betalinger fundet</p>
          </div>
        )}
      </Card>
    </div>
  );
};
