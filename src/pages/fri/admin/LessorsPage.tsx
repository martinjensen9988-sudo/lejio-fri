import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFriAdminLessors } from '@/hooks/useFriAdminLessors';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { ChevronRight, AlertTriangle, CheckCircle2, Pause, Users, Sparkles, ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';

export const FriAdminLessorsPage = () => {
  const navigate = useNavigate();
  const { lessors, loading, error, stats, fetchLessors, getLessorStats, suspendLessor, activateLessor, deleteLessor } = useFriAdminLessors();
  const [selectedLessor, setSelectedLessor] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'delete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    lessors.forEach(lessor => {
      if (!stats[lessor.id]) {
        getLessorStats(lessor.id);
      }
    });
  }, [lessors, stats, getLessorStats]);

  const handleAction = async () => {
    if (!selectedLessor || !actionType) return;

    setIsProcessing(true);
    try {
      switch (actionType) {
        case 'suspend':
          await suspendLessor(selectedLessor);
          break;
        case 'activate':
          await activateLessor(selectedLessor);
          break;
        case 'delete':
          await deleteLessor(selectedLessor);
          break;
      }
      setSelectedLessor(null);
      setActionType(null);
    } catch (err) {
      console.error(`Failed to ${actionType} lessor:`, err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string; dot: string; label: string } } = {
      active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Aktiv' },
      trial: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Prøveperiode' },
      suspended: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Suspenderet' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Annulleret' },
    };

    const badge = badges[status] || badges.active;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badge.bg}`}>
        <div className={`w-2 h-2 rounded-full ${badge.dot}`} />
        <span className={`text-xs font-semibold ${badge.text}`}>
          {badge.label}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-400 font-medium">Indlæser lessors...</p>
        </div>
      </div>
    );
  }

  const totalActive = lessors.filter(l => l.subscription_status === 'active' || l.subscription_status === 'trial').length;
  const totalSuspended = lessors.filter(l => l.subscription_status === 'suspended').length;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-200">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brown-900">Lessors</h1>
            <p className="text-gray-400 text-sm">Administrer alle lessors på platformen</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 rounded-xl">
            <span className="text-sm font-semibold text-emerald-700">{totalActive} aktive</span>
          </div>
          {totalSuspended > 0 && (
            <div className="px-4 py-2 bg-amber-50 rounded-xl">
              <span className="text-sm font-semibold text-amber-700">{totalSuspended} suspenderet</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lessors Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {lessors.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 border-b border-gray-100">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lessor</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Biler</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Bookings</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Oprettet</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessors.map((lessor) => {
                  const lessorStats = stats[lessor.id];
                  return (
                    <TableRow key={lessor.id} className="hover:bg-violet-50/30 transition-colors border-b border-gray-50">
                      <TableCell className="font-semibold text-brown-900">{lessor.company_name}</TableCell>
                      <TableCell className="text-sm text-gray-500">{lessor.email}</TableCell>
                      <TableCell>{getStatusBadge(lessor.subscription_status)}</TableCell>
                      <TableCell className="text-right font-semibold text-gray-700">{lessorStats?.total_vehicles || 0}</TableCell>
                      <TableCell className="text-right font-semibold text-gray-700">{lessorStats?.total_bookings || 0}</TableCell>
                      <TableCell className="text-right font-semibold text-gray-700">
                        kr. {(lessorStats?.total_revenue || 0).toLocaleString('da-DK', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {formatDistanceToNow(new Date(lessor.created_at), { locale: da, addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/fri/admin/lessors/${lessor.id}`)}
                            className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg gap-1"
                          >
                            Detaljer
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLessor(lessor.id);
                              setActionType(lessor.subscription_status === 'active' ? 'suspend' : 'activate');
                            }}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                          >
                            {lessor.subscription_status === 'active' ? 'Suspendér' : 'Aktiver'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">Ingen lessors fundet</p>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <AlertDialog open={!!selectedLessor} onOpenChange={(open) => !open && (setSelectedLessor(null), setActionType(null))}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'suspend' ? 'Suspendér lessor?' : actionType === 'activate' ? 'Aktiver lessor?' : 'Slet lessor?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'suspend'
                ? 'Lessoren vil ikke kunne logge ind og få adgang til deres dashboard. Data bevares.'
                : actionType === 'activate'
                  ? 'Lessoren får adgang til deres dashboard igen.'
                  : 'Dette kan ikke fortrydes. Alle data vil blive slettet.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel className="rounded-xl">Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isProcessing}
              className={`rounded-xl ${actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'}`}
            >
              {isProcessing ? 'Behandler...' : actionType === 'suspend' ? 'Suspendér' : actionType === 'activate' ? 'Aktiver' : 'Slet'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
