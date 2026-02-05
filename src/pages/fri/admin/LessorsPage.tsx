import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { ChevronRight, AlertTriangle, CheckCircle2, Pause, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';

export const FriAdminLessorsPage = () => {
  const navigate = useNavigate();
  const { lessors, loading, error, stats, fetchLessors, getLessorStats, suspendLessor, activateLessor, deleteLessor } = useFriAdminLessors();
  const [selectedLessor, setSelectedLessor] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'delete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load stats for all lessors
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
    const badges: { [key: string]: { bg: string; text: string; icon: any } } = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
      trial: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle2 },
      suspended: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Pause },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
    };

    const badge = badges[status] || badges.active;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badge.bg}`}>
        <Icon className="w-4 h-4" />
        <span className={`text-sm font-medium ${badge.text}`}>
          {status === 'trial' ? 'Prøveperiode' : status === 'active' ? 'Aktiv' : status === 'suspended' ? 'Suspenderet' : 'Annulleret'}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Indlæser lessors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lessors</h1>
        <p className="text-gray-600 mt-1">Administrer alle lessors på systemet</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lessors Table */}
      <Card>
        {lessors.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Lessor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Biler</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Oprettet</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessors.map((lessor) => {
                  const lessorStats = stats[lessor.id];
                  return (
                    <TableRow key={lessor.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{lessor.company_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{lessor.email}</TableCell>
                      <TableCell>{getStatusBadge(lessor.subscription_status)}</TableCell>
                      <TableCell className="text-right font-medium">{lessorStats?.total_vehicles || 0}</TableCell>
                      <TableCell className="text-right font-medium">{lessorStats?.total_bookings || 0}</TableCell>
                      <TableCell className="text-right font-medium">
                        kr. {(lessorStats?.total_revenue || 0).toLocaleString('da-DK', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(lessor.created_at), { locale: da, addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/fri/admin/lessors/${lessor.id}`)}
                          className="inline-flex items-center gap-1"
                        >
                          Detaljer
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLessor(lessor.id);
                            setActionType(lessor.subscription_status === 'active' ? 'suspend' : 'activate');
                          }}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          {lessor.subscription_status === 'active' ? 'Suspendér' : 'Aktiver'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600">Ingen lessors fundet</p>
          </div>
        )}
      </Card>

      {/* Action Dialog */}
      <AlertDialog open={!!selectedLessor} onOpenChange={(open) => !open && (setSelectedLessor(null), setActionType(null))}>
        <AlertDialogContent>
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
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isProcessing}
              className={actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isProcessing ? 'Behandler...' : actionType === 'suspend' ? 'Suspendér' : actionType === 'activate' ? 'Aktiver' : 'Slet'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
