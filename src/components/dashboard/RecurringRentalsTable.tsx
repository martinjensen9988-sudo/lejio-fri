import { useState } from 'react';
import { useRecurringRentals, RecurringRental } from '@/hooks/useRecurringRentals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Repeat, MoreHorizontal, Pause, Play, X, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';

const RecurringRentalsTable = () => {
  const { recurringRentals, isLoading, pauseRecurringRental, resumeRecurringRental, cancelRecurringRental, refetch } = useRecurringRentals();
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; rental: RecurringRental | null }>({ open: false, rental: null });

  const getStatusBadge = (status: RecurringRental['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Aktiv</Badge>;
      case 'paused':
        return <Badge variant="secondary">Pauset</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulleret</Badge>;
      case 'expired':
        return <Badge variant="outline">Udløbet</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(value);
  };

  const handleCancel = async () => {
    if (cancelDialog.rental) {
      await cancelRecurringRental(cancelDialog.rental.id);
      setCancelDialog({ open: false, rental: null });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  const activeRentals = recurringRentals.filter(r => r.status === 'active');
  const otherRentals = recurringRentals.filter(r => r.status !== 'active');

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            Gentagne lejeaftaler
          </CardTitle>
          <CardDescription>
            Administrer automatisk fornyede månedlige lejeaftaler
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Opdater
        </Button>
      </CardHeader>
      <CardContent>
        {recurringRentals.length === 0 ? (
          <div className="text-center py-12">
            <Repeat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">Ingen gentagne lejeaftaler</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Når du opretter en booking med månedlig betaling, kan du gøre den til en gentagen lejeaftale der automatisk fornyes.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Rentals */}
            {activeRentals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Aktive ({activeRentals.length})</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Køretøj</TableHead>
                      <TableHead>Lejer</TableHead>
                      <TableHead>Månedlig pris</TableHead>
                      <TableHead>Næste fakturering</TableHead>
                      <TableHead>Fornyelser</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRentals.map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {rental.vehicle?.make} {rental.vehicle?.model}
                            </p>
                            <p className="text-sm text-muted-foreground">{rental.vehicle?.registration}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rental.renter_name || 'Ikke angivet'}</p>
                            <p className="text-sm text-muted-foreground">{rental.renter_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(rental.monthly_price)}</TableCell>
                        <TableCell>
                          {format(parseISO(rental.next_billing_date), 'd. MMM yyyy', { locale: da })}
                        </TableCell>
                        <TableCell>{rental.total_renewals}</TableCell>
                        <TableCell>{getStatusBadge(rental.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => pauseRecurringRental(rental.id)}>
                                <Pause className="w-4 h-4 mr-2" />
                                Sæt på pause
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setCancelDialog({ open: true, rental })}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Annuller
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Other Rentals */}
            {otherRentals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Historik ({otherRentals.length})</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Køretøj</TableHead>
                      <TableHead>Lejer</TableHead>
                      <TableHead>Månedlig pris</TableHead>
                      <TableHead>Fornyelser</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otherRentals.map((rental) => (
                      <TableRow key={rental.id} className="opacity-70">
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {rental.vehicle?.make} {rental.vehicle?.model}
                            </p>
                            <p className="text-sm text-muted-foreground">{rental.vehicle?.registration}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rental.renter_name || 'Ikke angivet'}</p>
                            <p className="text-sm text-muted-foreground">{rental.renter_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(rental.monthly_price)}</TableCell>
                        <TableCell>{rental.total_renewals}</TableCell>
                        <TableCell>{getStatusBadge(rental.status)}</TableCell>
                        <TableCell className="text-right">
                          {rental.status === 'paused' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => resumeRecurringRental(rental.id)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Genoptag
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, rental: cancelDialog.rental })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuller lejeaftale</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil annullere denne gentagne lejeaftale? 
              {cancelDialog.rental && (
                <span className="block mt-2 font-medium">
                  {cancelDialog.rental.vehicle?.make} {cancelDialog.rental.vehicle?.model} - {cancelDialog.rental.renter_name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fortryd</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Annuller lejeaftale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default RecurringRentalsTable;
