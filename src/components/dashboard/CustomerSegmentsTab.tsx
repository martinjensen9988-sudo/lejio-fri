import { useState, useEffect } from 'react';
import { useCustomerSegments } from '@/hooks/useCustomerSegments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Crown, 
  Star, 
  RefreshCw,
  Search,
  StickyNote,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

const CustomerSegmentsTab = () => {
  const { 
    customers, 
    isLoading, 
    updateSegment, 
    addNote,
    syncFromBookings,
    getVipCustomers,
    getLoyalCustomers,
    getReturningCustomers
  } = useCustomerSegments();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    await syncFromBookings();
    setSyncing(false);
    toast.success('Kundedata synkroniseret');
  };

  const handleSegmentChange = async (customerId: string, newSegment: string) => {
    await updateSegment(customerId, newSegment);
    toast.success('Kundesegment opdateret');
  };

  const handleSaveNote = async (customerId: string) => {
    await addNote(customerId, noteText);
    setEditingNote(null);
    setNoteText('');
    toast.success('Note gemt');
  };

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case 'vip':
        return (
          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
            <Crown className="w-3 h-3 mr-1" />
            VIP
          </Badge>
        );
      case 'loyal':
        return (
          <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">
            <Star className="w-3 h-3 mr-1" />
            Loyal
          </Badge>
        );
      case 'returning':
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
            <RefreshCw className="w-3 h-3 mr-1" />
            Tilbagevendende
          </Badge>
        );
      default:
        return <Badge variant="outline">Ny</Badge>;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchQuery || 
      customer.renter_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.renter_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSegment = selectedSegment === 'all' || customer.segment === selectedSegment;
    
    return matchesSearch && matchesSegment;
  });

  const vipCount = getVipCustomers().length;
  const loyalCount = getLoyalCustomers().length;
  const returningCount = getReturningCustomers().length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-sm text-muted-foreground">Total kunder</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vipCount}</p>
                <p className="text-sm text-muted-foreground">VIP kunder</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loyalCount}</p>
                <p className="text-sm text-muted-foreground">Loyale kunder</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {customers.reduce((sum, c) => sum + c.total_revenue, 0).toLocaleString('da-DK')}
                </p>
                <p className="text-sm text-muted-foreground">Total omsætning</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søg efter navn eller email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSegment} onValueChange={setSelectedSegment}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Alle segmenter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle segmenter</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="loyal">Loyal</SelectItem>
            <SelectItem value="returning">Tilbagevendende</SelectItem>
            <SelectItem value="new">Ny</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Synkroniser
        </Button>
      </div>

      {/* Customer Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Kunde</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Bookinger</TableHead>
              <TableHead>Omsætning</TableHead>
              <TableHead>Sidste booking</TableHead>
              <TableHead className="text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Ingen kunder fundet
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{customer.renter_name || 'Ukendt'}</p>
                      <p className="text-sm text-muted-foreground">{customer.renter_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={customer.segment}
                      onValueChange={(value) => handleSegmentChange(customer.id, value)}
                    >
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Ny</SelectItem>
                        <SelectItem value="returning">Tilbagevendende</SelectItem>
                        <SelectItem value="loyal">Loyal</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-semibold">{customer.total_bookings}</TableCell>
                  <TableCell className="font-semibold">
                    {customer.total_revenue.toLocaleString('da-DK')} kr
                  </TableCell>
                  <TableCell>
                    {customer.last_booking_at 
                      ? format(new Date(customer.last_booking_at), 'dd. MMM yyyy', { locale: da })
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog open={editingNote === customer.id} onOpenChange={(open) => {
                      if (!open) setEditingNote(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingNote(customer.id);
                            setNoteText(customer.notes || '');
                          }}
                        >
                          <StickyNote className={`w-4 h-4 ${customer.notes ? 'text-yellow-600' : ''}`} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Note til {customer.renter_name || customer.renter_email}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Skriv en note om denne kunde..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={4}
                          />
                          <Button onClick={() => handleSaveNote(customer.id)} className="w-full">
                            Gem note
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CustomerSegmentsTab;
