import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Tag, Percent, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminDiscountCodes = () => {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching discount codes:', error);
    } else {
      setCodes(data || []);
    }
    setLoading(false);
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('discount_codes')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast.error('Kunne ikke opdatere rabatkode');
      return;
    }

    fetchCodes();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Kunne ikke slette rabatkode');
      return;
    }

    toast.success('Rabatkode slettet');
    fetchCodes();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rabatkoder</CardTitle>
            <CardDescription>Opret og administrer rabatkoder til kunder</CardDescription>
          </div>
          <Button onClick={() => navigate('/admin/discounts/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Opret rabatkode
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {codes.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Ingen rabatkoder</h3>
            <p className="text-muted-foreground mb-4">Opret din første rabatkode</p>
            <Button onClick={() => navigate('/admin/discounts/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Opret rabatkode
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Værdi</TableHead>
                <TableHead>Brug</TableHead>
                <TableHead>Udløber</TableHead>
                <TableHead>Aktiv</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <div>
                      <p className="font-mono font-bold">{code.code}</p>
                      {code.description && (
                        <p className="text-sm text-muted-foreground">{code.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {code.discount_type === 'percent' ? (
                        <><Percent className="w-3 h-3 mr-1" /> Procent</>
                      ) : (
                        <><Gift className="w-3 h-3 mr-1" /> Gratis måneder</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {code.discount_type === 'percent' 
                      ? `${code.discount_value}%`
                      : `${code.discount_value} mdr.`}
                  </TableCell>
                  <TableCell>
                    {code.current_uses} / {code.max_uses || '∞'}
                  </TableCell>
                  <TableCell>
                    {code.valid_until 
                      ? format(new Date(code.valid_until), 'dd. MMM yyyy', { locale: da })
                      : 'Ingen'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={code.is_active}
                      onCheckedChange={() => handleToggleActive(code.id, code.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(code.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDiscountCodes;
