import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CRMDeal, CRM_STAGES } from '@/hooks/useCRM';
import { 
  MoreHorizontal, 
  Search, 
  ArrowUpDown, 
  Building2,
  Phone,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface AdminCRMTableProps {
  deals: CRMDeal[];
  onUpdateStage: (dealId: string, stage: string) => Promise<void>;
  onEditDeal: (deal: CRMDeal) => void;
  onDeleteDeal: (dealId: string) => Promise<void>;
  onViewDeal: (deal: CRMDeal) => void;
}

export const AdminCRMTable = ({
  deals,
  onUpdateStage,
  onEditDeal,
  onDeleteDeal,
  onViewDeal,
}: AdminCRMTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'created_at' | 'value' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getStageInfo = (stageId: string) => {
    return CRM_STAGES.find(s => s.id === stageId) || CRM_STAGES[0];
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const toggleSort = (field: 'created_at' | 'value' | 'title') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredDeals = deals
    .filter(deal => {
      const matchesSearch = 
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStage = stageFilter === 'all' || deal.stage === stageFilter;
      
      return matchesSearch && matchesStage;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'value':
          comparison = (a.value || 0) - (b.value || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søg i deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alle stadier" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">Alle stadier</SelectItem>
            {CRM_STAGES.map(stage => (
              <SelectItem key={stage.id} value={stage.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  {stage.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Deal
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead>Virksomhed</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead>Stadie</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('value')}
              >
                <div className="flex items-center gap-1">
                  Værdi
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead>Sandsynlighed</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Oprettet
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchTerm || stageFilter !== 'all' 
                    ? 'Ingen deals matcher dine filtre' 
                    : 'Ingen deals endnu'}
                </TableCell>
              </TableRow>
            ) : (
              filteredDeals.map((deal) => {
                const stageInfo = getStageInfo(deal.stage);
                return (
                  <TableRow key={deal.id} className="hover:bg-muted/50">
                    <TableCell>
                      <button 
                        className="font-medium hover:text-primary text-left"
                        onClick={() => onViewDeal(deal)}
                      >
                        {deal.title}
                      </button>
                      {deal.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {deal.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {deal.company_name && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{deal.company_name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {deal.contact_name && (
                        <div className="space-y-1">
                          <p className="text-sm">{deal.contact_name}</p>
                          <div className="flex items-center gap-2">
                            {deal.contact_phone && (
                              <a 
                                href={`tel:${deal.contact_phone}`}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            )}
                            {deal.contact_email && (
                              <a 
                                href={`mailto:${deal.contact_email}`}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <Mail className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={deal.stage} 
                        onValueChange={(value) => onUpdateStage(deal.id, value)}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${stageInfo.color}`} />
                            <span className="text-sm">{stageInfo.label}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {CRM_STAGES.map(stage => (
                            <SelectItem key={stage.id} value={stage.id}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                                {stage.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        {formatValue(deal.value || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{deal.probability}%</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(deal.created_at), 'd. MMM yyyy', { locale: da })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => onViewDeal(deal)}>
                            Se detaljer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditDeal(deal)}>
                            Rediger
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteDeal(deal.id)}
                            className="text-destructive"
                          >
                            Slet
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Viser {filteredDeals.length} af {deals.length} deals</span>
        <span>
          Total værdi: {formatValue(filteredDeals.reduce((sum, d) => sum + (d.value || 0), 0))}
        </span>
      </div>
    </div>
  );
};
