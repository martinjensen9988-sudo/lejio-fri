import { useState, useEffect } from 'react';
import { useCorporateFleet, type CorporateEmployee, type CorporateDepartment } from '@/hooks/useCorporateFleet';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface EmployeeForm {
  full_name: string;
  email: string;
  phone: string;
  employee_number: string;
  department_id: string;
  is_admin: boolean;
}

const CorporateEmployeeAdmin = () => {
  const { employees, departments, corporateAccount, refetch, isLoading } = useCorporateFleet();
  const [filteredEmployees, setFilteredEmployees] = useState<CorporateEmployee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<CorporateEmployee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<EmployeeForm>({
    full_name: '',
    email: '',
    phone: '',
    employee_number: '',
    department_id: '',
    is_admin: false,
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    applyFilters();
  }, [employees, searchQuery, filterDepartment, filterStatus]);

  const applyFilters = () => {
    let filtered = employees;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.full_name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.employee_number?.toLowerCase().includes(q)
      );
    }

    if (filterDepartment && filterDepartment !== 'all') {
      filtered = filtered.filter((e) => e.department_id === filterDepartment);
    }

    if (filterStatus === 'active') {
      filtered = filtered.filter((e) => e.is_active);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((e) => !e.is_active);
    }

    setFilteredEmployees(filtered);
  };

  const handleEdit = (employee: CorporateEmployee) => {
    setSelectedEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone || '',
      employee_number: employee.employee_number || '',
      department_id: employee.department_id || '',
      is_admin: employee.is_admin,
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedEmployee(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      employee_number: '',
      department_id: '',
      is_admin: false,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.email) {
      toast.error('Navn og email er påkrævet');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedEmployee) {
        // Update existing
        const { error } = await supabase
          .from('corporate_employees')
          .update({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            employee_number: formData.employee_number || null,
            department_id: formData.department_id || null,
            is_admin: formData.is_admin,
          })
          .eq('id', selectedEmployee.id);

        if (error) throw error;
        toast.success('Medarbejder opdateret');
      } else {
        // Create new
        const { error } = await supabase
          .from('corporate_employees')
          .insert({
            corporate_account_id: corporateAccount?.id || '',
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            employee_number: formData.employee_number || null,
            department_id: formData.department_id || null,
            is_admin: formData.is_admin,
            is_active: true,
          });

        if (error) throw error;
        toast.success('Medarbejder oprettet');
      }

      await refetch();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Kunne ikke gemme medarbejder');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('corporate_employees')
        .update({ is_active: false })
        .eq('id', selectedEmployee.id);

      if (error) throw error;
      toast.success('Medarbejder deaktiveret');
      await refetch();
      setIsDeleteAlertOpen(false);
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Kunne ikke slette medarbejder');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAdmin = async (employee: CorporateEmployee) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('corporate_employees')
        .update({ is_admin: !employee.is_admin })
        .eq('id', employee.id);

      if (error) throw error;
      toast.success(
        employee.is_admin ? 'Admin-rettigheder fjernet' : 'Admin-rettigheder tildelt'
      );
      await refetch();
    } catch (error) {
      console.error('Error toggling admin:', error);
      toast.error('Kunne ikke opdatere admin-status');
    } finally {
      setIsSaving(false);
    }
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return '-';
    return departments.find((d) => d.id === deptId)?.name || 'Ukendt';
  };

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
        {/* Overskrift */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Medarbejder Administration</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="w-4 h-4 mr-2" />
                Ny Medarbejder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedEmployee ? 'Rediger Medarbejder' : 'Opret Ny Medarbejder'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Fuldt Navn *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+45 12 34 56 78"
                  />
                </div>
                <div>
                  <Label htmlFor="employee_number">Medarbejder Nummer</Label>
                  <Input
                    id="employee_number"
                    value={formData.employee_number}
                    onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                    placeholder="EMP-001"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Afdeling</Label>
                  <Select value={formData.department_id} onValueChange={(val) => 
                    setFormData({ ...formData, department_id: val })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg afdeling" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ingen afdeling</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_admin"
                    checked={formData.is_admin}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_admin: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_admin" className="cursor-pointer">
                    Giv admin-rettigheder
                  </Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gemmer...
                      </>
                    ) : (
                      'Gem'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Annuller
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistik kort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Medarbejdere</p>
                  <p className="text-3xl font-bold">{employees.filter((e) => e.is_active).length}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admin-brugere</p>
                  <p className="text-3xl font-bold">{employees.filter((e) => e.is_admin).length}</p>
                </div>
                <Shield className="w-10 h-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Med kørekort bekræftelse</p>
                  <p className="text-3xl font-bold">
                    {employees.filter((e) => e.driver_license_verified).length}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtre og tabel */}
        <Card>
          <CardHeader>
            <CardTitle>Medarbejdere</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Input
                placeholder="Søg efter navn, email eller medarbejder nummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[200px]"
              />
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer afdeling" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle afdelinger</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(val) => 
                setFilterStatus(val as 'all' | 'active' | 'inactive')
              }>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="active">Aktive</SelectItem>
                  <SelectItem value="inactive">Inaktive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabel */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Medarbejder Nr.</TableHead>
                    <TableHead>Afdeling</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rettigheder</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Ingen medarbejdere matcher søgningen
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.full_name}</TableCell>
                        <TableCell className="text-sm">{employee.email}</TableCell>
                        <TableCell className="text-sm">{employee.employee_number || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {getDepartmentName(employee.department_id)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                            {employee.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {employee.is_admin && (
                              <Badge variant="outline" className="bg-purple-50">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {employee.driver_license_verified && (
                              <Badge variant="outline" className="bg-green-50">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Godkendt
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(employee)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleAdmin(employee)}
                              title={employee.is_admin ? 'Fjern admin' : 'Giv admin'}
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setIsDeleteAlertOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredEmployees.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Viser {filteredEmployees.length} af {employees.length} medarbejdere
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bekræftelse af sletning */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
          <AlertDialogDescription>
            Denne handling vil deaktivere medarbejdere "{selectedEmployee?.full_name}". De vil ikke længere kunne leje biler.
          </AlertDialogDescription>
          <div className="flex gap-3">
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSaving}
              className="bg-destructive"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sletter...
                </>
              ) : (
                'Deaktiver'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AdminDashboardLayout>
  );
};

export default CorporateEmployeeAdmin;
