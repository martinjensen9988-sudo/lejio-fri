import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCorporateFleet } from '@/hooks/useCorporateFleet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Car, 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar,
  MapPin,
  Gauge,
  Leaf,
  CreditCard,
  ArrowRight,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import CorporateFleetTab from '@/components/corporate/CorporateFleetTab';
import CorporateEmployeesTab from '@/components/corporate/CorporateEmployeesTab';
import CorporateBookingsTab from '@/components/corporate/CorporateBookingsTab';
import CorporateInvoicesTab from '@/components/corporate/CorporateInvoicesTab';
import CorporateAnalyticsTab from '@/components/corporate/CorporateAnalyticsTab';
import CorporateBookingDialog from '@/components/corporate/CorporateBookingDialog';

const CorporateDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    corporateAccount,
    departments,
    employees,
    fleetVehicles,
    bookings,
    invoices,
    usageStats,
    isLoading,
    isAdmin,
    currentEmployee,
    getFleetUtilization,
    getTotalMonthlySpend,
    refetch,
  } = useCorporateFleet();

  const [showBookingDialog, setShowBookingDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!corporateAccount) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Ingen virksomhedskonto</CardTitle>
            <CardDescription>
              Du er ikke tilknyttet en virksomhedskonto. Kontakt din administrator eller LEJIO support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Tilbage til forsiden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const utilization = getFleetUtilization();
  const monthlySpend = getTotalMonthlySpend();
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-mint/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold">{corporateAccount.company_name}</h1>
                <p className="text-sm text-muted-foreground">
                  CVR: {corporateAccount.cvr_number}
                  {corporateAccount.ean_number && ` • EAN: ${corporateAccount.ean_number}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setShowBookingDialog(true)} size="sm" className="font-bold shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Book bil
              </Button>
              <Badge variant={corporateAccount.status === 'active' ? 'default' : 'destructive'} className="font-medium">
                {corporateAccount.status === 'active' ? 'Aktiv' : 'Suspenderet'}
              </Badge>
              {currentEmployee && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{currentEmployee.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isAdmin ? 'Administrator' : 'Medarbejder'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Stats Grid - with gradient styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-2 border-border/50 hover:border-primary/30 transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-500/60 flex items-center justify-center shadow-lg">
                  <Car className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Flåde</p>
                  <p className="font-display text-3xl font-black">{fleetVehicles.length}</p>
                  <p className="text-xs text-muted-foreground">køretøjer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-2 border-border/50 hover:border-mint/30 transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mint to-mint/60 flex items-center justify-center shadow-lg">
                  <Gauge className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Udnyttelse</p>
                  <p className="font-display text-3xl font-black">{utilization}%</p>
                  <p className="text-xs text-muted-foreground">sidste 30 dage</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-2 border-border/50 hover:border-lavender/30 transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender to-lavender/60 flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Medarbejdere</p>
                  <p className="font-display text-3xl font-black">{employees.length}</p>
                  <p className="text-xs text-muted-foreground">aktive brugere</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-2 border-border/50 hover:border-accent/30 transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Denne måned</p>
                  <p className="font-display text-3xl font-black">{monthlySpend.toLocaleString('da-DK')} kr</p>
                  <p className="text-xs text-muted-foreground">forbrug</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions for Employees */}
        {fleetVehicles.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Hurtig booking
              </CardTitle>
              <CardDescription>
                Vælg et køretøj fra flåden og book med det samme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fleetVehicles.slice(0, 3).map((vehicle) => (
                  <Card 
                    key={vehicle.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowBookingDialog(true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Car className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Køretøj #{vehicle.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.included_km_per_month} km/md inkl.
                          </p>
                          <p className="text-xs font-medium text-primary">
                            {vehicle.monthly_rate.toLocaleString('da-DK')} kr/md
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue={isAdmin ? "analytics" : "fleet"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="fleet" className="gap-2">
              <Car className="w-4 h-4" />
              <span className="hidden sm:inline">Flåde</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Bookinger</span>
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="employees" className="gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Medarbejdere</span>
                </TabsTrigger>
                <TabsTrigger value="invoices" className="gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Fakturaer</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Analyse</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="fleet">
            <CorporateFleetTab 
              vehicles={fleetVehicles} 
              departments={departments}
              isAdmin={isAdmin}
              corporateAccountId={corporateAccount?.id}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="bookings">
            <CorporateBookingsTab 
              bookings={bookings}
              employees={employees}
              vehicles={fleetVehicles}
              corporateAccountId={corporateAccount?.id}
              currentEmployeeId={currentEmployee?.id}
              currentDepartmentId={currentEmployee?.department_id}
              onRefresh={refetch}
            />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="employees">
                <CorporateEmployeesTab 
                  employees={employees}
                  departments={departments}
                />
              </TabsContent>

              <TabsContent value="invoices">
                <CorporateInvoicesTab 
                  invoices={invoices} 
                  corporateAccountId={corporateAccount?.id}
                  isAdmin={isAdmin}
                  onRefresh={refetch}
                />
              </TabsContent>

              <TabsContent value="analytics">
                <CorporateAnalyticsTab 
                  usageStats={usageStats}
                  departments={departments}
                  bookings={bookings}
                  fleetVehicles={fleetVehicles}
                />
              </TabsContent>
              </>
            )}
          </Tabs>
        </main>

        {/* Booking Dialog */}
        {corporateAccount && currentEmployee && (
          <CorporateBookingDialog
            open={showBookingDialog}
            onOpenChange={setShowBookingDialog}
            fleetVehicles={fleetVehicles}
            corporateAccountId={corporateAccount.id}
            currentEmployeeId={currentEmployee.id}
            departmentId={currentEmployee.department_id}
            onSuccess={refetch}
          />
        )}
      </div>
    );
  };

export default CorporateDashboard;
