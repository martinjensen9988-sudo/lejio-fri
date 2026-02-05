import { useState, useEffect } from 'react';
import { useCorporateFleet, type CorporateDepartment } from '@/hooks/useCorporateFleet';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface BudgetData {
  department_id: string;
  department_name: string;
  monthly_budget: number;
  current_spend: number;
  spent_percentage: number;
  invoice_count: number;
  average_invoice: number;
  trend: number; // percentage change from last month
}

interface MonthlyTrend {
  month: string;
  budget: number;
  spent: number;
  balance: number;
}

interface DepartmentAlert {
  department_id: string;
  department_name: string;
  severity: 'warning' | 'critical';
  message: string;
}

const CorporateBudgetDashboard = () => {
  const { departments, invoices, refetch, isLoading } = useCorporateFleet();
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [alerts, setAlerts] = useState<DepartmentAlert[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  useEffect(() => {
    refetch();
    loadBudgetData();
  }, [refetch]);

  const loadBudgetData = async () => {
    setIsLoadingData(true);
    try {
      // Hent alle fakturaer for denne måned
      const currentDate = new Date();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: invoices, error } = await supabase
        .from('corporate_invoices')
        .select('*, department_breakdown')
        .gte('invoice_date', firstDay.toISOString())
        .lte('invoice_date', lastDay.toISOString());

      if (error) throw error;

      // Beregn budgetdata pr. afdeling
      const budgetMap = new Map<string, BudgetData>();

      departments.forEach((dept) => {
        budgetMap.set(dept.id, {
          department_id: dept.id,
          department_name: dept.name,
          monthly_budget: dept.monthly_budget,
          current_spend: 0,
          spent_percentage: 0,
          invoice_count: 0,
          average_invoice: 0,
          trend: 0,
        });
      });

      // Aggreger udgifter fra fakturaer
      if (invoices) {
        invoices.forEach((invoice) => {
          const deptBreakdown = Array.isArray(invoice.department_breakdown) 
            ? invoice.department_breakdown 
            : [];
          
          deptBreakdown.forEach((item: any) => {
            const dept = budgetMap.get(item.department_id);
            if (dept) {
              dept.current_spend += item.amount || 0;
              dept.invoice_count += 1;
            }
          });
        });
      }

      // Beregn procenter og gennemsnit
      const processedData: BudgetData[] = Array.from(budgetMap.values()).map((dept) => ({
        ...dept,
        spent_percentage: (dept.current_spend / dept.monthly_budget) * 100,
        average_invoice: dept.invoice_count > 0 ? dept.current_spend / dept.invoice_count : 0,
      }));

      setBudgetData(processedData);

      // Opret advarsler
      const newAlerts: DepartmentAlert[] = [];
      processedData.forEach((dept) => {
        if (dept.spent_percentage >= 100) {
          newAlerts.push({
            department_id: dept.department_id,
            department_name: dept.department_name,
            severity: 'critical',
            message: `Budget overskredet med ${(dept.spent_percentage - 100).toFixed(1)}%`,
          });
        } else if (dept.spent_percentage >= 80) {
          newAlerts.push({
            department_id: dept.department_id,
            department_name: dept.department_name,
            severity: 'warning',
            message: `${(100 - dept.spent_percentage).toFixed(1)}% af budget tilbage`,
          });
        }
      });

      setAlerts(newAlerts);

      // Generer månedtrend (de sidste 6 måneder)
      const trendData: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('da-DK', { month: 'short', year: '2-digit' });

        const totalBudget = departments.reduce((sum, d) => sum + d.monthly_budget, 0);
        const spent = processedData.reduce((sum, d) => sum + (i === 0 ? d.current_spend : 0), 0);

        trendData.push({
          month,
          budget: totalBudget,
          spent,
          balance: totalBudget - spent,
        });
      }
      setMonthlyTrend(trendData);
    } catch (error) {
      console.error('Error loading budget data:', error);
      toast.error('Kunne ikke indlæse budgetdata');
    } finally {
      setIsLoadingData(false);
    }
  };

  const totalBudget = budgetData.reduce((sum, d) => sum + d.monthly_budget, 0);
  const totalSpent = budgetData.reduce((sum, d) => sum + d.current_spend, 0);
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overBudgetDepts = budgetData.filter((d) => d.spent_percentage > 100).length;

  // Farveomrids til diagrammer
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  if (isLoading) {
    return (
      <AdminDashboardLayout activeTab="corporate">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout activeTab="corporate">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Budget Management</h2>
          <Button onClick={loadBudgetData} disabled={isLoadingData} variant="outline">
            {isLoadingData ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Indlæser...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Opdater
              </>
            )}
          </Button>
        </div>

        {/* Critical Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Alert key={alert.department_id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{alert.department_name}</strong>: {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Samlet Budget</p>
                  <p className="text-3xl font-bold">
                    {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                      totalBudget
                    )}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Brugt i Alt</p>
                  <p className="text-3xl font-bold">
                    {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(totalSpent)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{budgetUtilization.toFixed(1)}% af budget</p>
                </div>
                <TrendingUp className={`w-10 h-10 opacity-20 ${budgetUtilization > 80 ? 'text-red-500' : 'text-green-500'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Restbudget</p>
                  <p className="text-3xl font-bold">
                    {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                      totalBudget - totalSpent
                    )}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Afdelinger Over Budget</p>
                  <p className="text-3xl font-bold">{overBudgetDepts}</p>
                  <p className="text-xs text-muted-foreground mt-1">af {departments.length}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Trend (6 Måneder)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(value as number)
                    }
                  />
                  <Legend />
                  <Line type="monotone" dataKey="budget" stroke="#3b82f6" name="Budget" />
                  <Line type="monotone" dataKey="spent" stroke="#ef4444" name="Brugt" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Utilization Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Fordeling (Denne Måned)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={budgetData.slice(0, 5)}
                    dataKey="current_spend"
                    nameKey="department_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {budgetData.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(value as number)
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Department Budget Table */}
        <Card>
          <CardHeader>
            <CardTitle>Afdeling Budget Oversigt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {budgetData.map((dept) => (
                <div key={dept.department_id} className="space-y-2 pb-4 border-b last:border-b-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{dept.department_name}</h3>
                    <div className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                        dept.current_spend
                      )}{' '}
                      / {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(dept.monthly_budget)}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex gap-2 items-center">
                    <Progress
                      value={Math.min(dept.spent_percentage, 100)}
                      className="flex-1"
                    />
                    <span className={`text-sm font-semibold min-w-fit ${
                      dept.spent_percentage > 100 ? 'text-red-600' :
                      dept.spent_percentage > 80 ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {dept.spent_percentage.toFixed(1)}%
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{dept.invoice_count}</span> fakturaer
                    </div>
                    <div>
                      Gennemsnit: {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                        dept.average_invoice
                      )}
                    </div>
                    {dept.trend !== 0 && (
                      <div className="flex items-center gap-1">
                        {dept.trend > 0 ? (
                          <TrendingUp className="w-4 h-4 text-red-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-500" />
                        )}
                        {Math.abs(dept.trend).toFixed(1)}% vs. sidste måned
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default CorporateBudgetDashboard;
