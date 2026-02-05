import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Plus, Search, Shield, Mail, Phone, Building2 } from 'lucide-react';
import { CorporateEmployee, CorporateDepartment } from '@/hooks/useCorporateFleet';
import { useCorporateFleet } from '@/hooks/useCorporateFleet';

interface CorporateEmployeesTabProps {
  employees: CorporateEmployee[];
  departments: CorporateDepartment[];
}

const CorporateEmployeesTab = ({ employees, departments }: CorporateEmployeesTabProps) => {
  const { addEmployee, addDepartment } = useCorporateFleet();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_number: '',
    department_id: '',
    is_admin: false,
  });
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    cost_center_code: '',
    monthly_budget: '',
  });

  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return '-';
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || '-';
  };

  const handleAddEmployee = async () => {
    await addEmployee({
      ...newEmployee,
      department_id: newEmployee.department_id || null,
    });
    setIsAddingEmployee(false);
    setNewEmployee({
      full_name: '',
      email: '',
      phone: '',
      employee_number: '',
      department_id: '',
      is_admin: false,
    });
  };

  const handleAddDepartment = async () => {
    await addDepartment(
      newDepartment.name,
      newDepartment.cost_center_code || undefined,
      newDepartment.monthly_budget ? parseFloat(newDepartment.monthly_budget) : undefined
    );
    setIsAddingDepartment(false);
    setNewDepartment({ name: '', cost_center_code: '', monthly_budget: '' });
  };

  return (
    <div className="space-y-6">
      {/* Departments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Afdelinger
              </CardTitle>
              <CardDescription>
                Organiser medarbejdere og alloker budget per afdeling
              </CardDescription>
            </div>
            <Dialog open={isAddingDepartment} onOpenChange={setIsAddingDepartment}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Ny afdeling
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opret ny afdeling</DialogTitle>
                  <DialogDescription>
                    Tilføj en ny afdeling til virksomheden
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Afdelingsnavn *</Label>
                    <Input
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="F.eks. Salg, IT, Marketing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Center kode</Label>
                    <Input
                      value={newDepartment.cost_center_code}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, cost_center_code: e.target.value }))}
                      placeholder="F.eks. CC-1001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Månedligt budget (kr)</Label>
                    <Input
                      type="number"
                      value={newDepartment.monthly_budget}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, monthly_budget: e.target.value }))}
                      placeholder="F.eks. 50000"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingDepartment(false)}>
                    Annuller
                  </Button>
                  <Button onClick={handleAddDepartment} disabled={!newDepartment.name}>
                    Opret afdeling
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ingen afdelinger oprettet endnu
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <Badge key={dept.id} variant="secondary" className="py-2 px-3">
                  {dept.name}
                  {dept.cost_center_code && (
                    <span className="ml-2 text-muted-foreground">({dept.cost_center_code})</span>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employees Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Medarbejdere
              </CardTitle>
              <CardDescription>
                {employees.length} aktive medarbejdere med adgang til flåden
              </CardDescription>
            </div>
            <Dialog open={isAddingEmployee} onOpenChange={setIsAddingEmployee}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tilføj medarbejder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tilføj ny medarbejder</DialogTitle>
                  <DialogDescription>
                    Giv en medarbejder adgang til virksomhedens flåde
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Fulde navn *</Label>
                    <Input
                      value={newEmployee.full_name}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Navn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@virksomhed.dk"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+45 12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Medarbejdernummer</Label>
                    <Input
                      value={newEmployee.employee_number}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, employee_number: e.target.value }))}
                      placeholder="F.eks. EMP-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Afdeling</Label>
                    <Select
                      value={newEmployee.department_id}
                      onValueChange={(value) => setNewEmployee(prev => ({ ...prev, department_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg afdeling" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingEmployee(false)}>
                    Annuller
                  </Button>
                  <Button 
                    onClick={handleAddEmployee} 
                    disabled={!newEmployee.full_name || !newEmployee.email}
                  >
                    Tilføj medarbejder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Søg efter navn eller email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medarbejder</TableHead>
                  <TableHead>Afdeling</TableHead>
                  <TableHead>Kørekort</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Ingen medarbejdere fundet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {employee.email}
                            </span>
                            {employee.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {employee.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getDepartmentName(employee.department_id)}</TableCell>
                      <TableCell>
                        <Badge variant={employee.driver_license_verified ? 'default' : 'secondary'}>
                          {employee.driver_license_verified ? 'Verificeret' : 'Afventer'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {employee.is_admin ? (
                          <Badge variant="outline" className="gap-1">
                            <Shield className="w-3 h-3" />
                            Admin
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Medarbejder</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Rediger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CorporateEmployeesTab;
