import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { DollarSign, CreditCard, AlertCircle, TrendingUp, Clock, XCircle, BarChart3, Search, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

const statusConfig: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  pending: { dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Afventer' },
  completed: { dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Gennemført' },
  failed: { dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700', label: 'Fejl' },
  refunded: { dot: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Refunderet' },
};

const filterTabs = [
  { key: 'all', label: 'Alle' },
  { key: 'pending', label: 'Afventer' },
  { key: 'completed', label: 'Gennemført' },
  { key: 'failed', label: 'Fejlet' },
];

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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-gray-500">Indlæser betalinger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Betalinger</h1>
          </div>
          <p className="text-sm text-gray-500 ml-[52px]">Administrer lessor abonnement betalinger</p>
        </div>
        <Dialog open={newPaymentDialogOpen} onOpenChange={setNewPaymentDialogOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium shadow-md shadow-violet-200/50 hover:shadow-lg hover:shadow-violet-200/60 transition-all duration-200 hover:-translate-y-0.5">
              <CreditCard className="w-4 h-4" />
              Registrer betaling
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-0 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900">Registrer manuel betaling</DialogTitle>
                  <DialogDescription className="text-sm text-gray-500">Registrer en betaling fra en lessor</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Lessor email</label>
                <Input
                  type="email"
                  placeholder="lessor@example.com"
                  value={newPaymentData.lessorEmail}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, lessorEmail: e.target.value })}
                  className="rounded-xl border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Beløb (DKK)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={newPaymentData.amount}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, amount: e.target.value })}
                  className="rounded-xl border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Betalingsmetode</label>
                <Select value={newPaymentData.method} onValueChange={(value) => setNewPaymentData({ ...newPaymentData, method: value })}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="card">Kort</SelectItem>
                    <SelectItem value="bank_transfer">Bankoverførsel</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Noter (valgfrit)</label>
                <Textarea
                  placeholder="Skriv noter her..."
                  value={newPaymentData.notes}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, notes: e.target.value })}
                  rows={3}
                  className="rounded-xl border-gray-200 focus:border-violet-300 focus:ring-violet-200"
                />
              </div>
              <button
                onClick={handleRecordManualPayment}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium shadow-md shadow-violet-200/50 hover:shadow-lg hover:shadow-violet-200/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registrerer...' : 'Registrer betaling'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              kr. {(stats.total_revenue / 1000).toFixed(1)}k
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200/50">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gennemført</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completed_payments}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-200/50">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Afventer</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending_payments}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200/50">
                <XCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fejlet</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.failed_payments}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200/50">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gennemsnit</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              kr. {stats.avg_payment.toLocaleString('da-DK', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      {stats && stats.monthly_data.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Månedlig revenue</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthly_data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: any) => [`kr. ${value.toLocaleString('da-DK')}`, 'Revenue']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6, fill: '#7c3aed' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tab Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="bg-gray-100/50 p-1 rounded-xl flex gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Søg efter email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 w-64 transition-all duration-200"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
        {filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 border-b border-gray-100">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lessor</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Beløb</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Metode</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dato</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Noter</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const cfg = statusConfig[payment.status] || statusConfig.pending;
                  return (
                    <TableRow key={payment.id} className="hover:bg-violet-50/30 border-b border-gray-50 transition-colors duration-150">
                      <TableCell>
                        <div className="font-medium text-gray-900 text-sm">{payment.lessor_name}</div>
                        <div className="text-xs text-gray-500">{payment.lessor_email}</div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 text-sm">
                        {payment.amount.toLocaleString('da-DK')} kr.
                      </TableCell>
                      <TableCell className="capitalize text-sm text-gray-600">{payment.subscription_type}</TableCell>
                      <TableCell className="capitalize text-sm text-gray-600">{payment.payment_method}</TableCell>
                      <TableCell>
                        <Select value={payment.status} onValueChange={(value) => handleStatusChange(payment.id, value)}>
                          <SelectTrigger className="w-36 rounded-lg border-gray-200 text-sm h-8">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {Object.entries(statusConfig).map(([key, s]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                                  {s.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(payment.created_at), { locale: da })}
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.notes && (
                          <div className="text-xs text-gray-400 truncate max-w-[180px]" title={payment.notes}>
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
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Ingen betalinger fundet</p>
          </div>
        )}
      </div>
    </div>
  );
};
