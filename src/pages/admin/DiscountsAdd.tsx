import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Plus, Tag } from 'lucide-react';

const DiscountsAddPage = () => {
  const navigate = useNavigate();
  const { hasAccess, isLoading: authLoading } = useAdminAuth();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: 10,
    max_uses: '',
    valid_until: '',
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    const code = Array.from(array, byte => 
      chars.charAt(byte % chars.length)
    ).join('');
    setFormData(prev => ({ ...prev, code }));
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.discount_value) {
      toast.error('Udfyld alle påkrævede felter');
      return;
    }

    setCreating(true);

    const { error } = await supabase.from('discount_codes').insert({
      code: formData.code.toUpperCase(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      valid_until: formData.valid_until || null,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('Denne kode eksisterer allerede');
      } else {
        toast.error('Kunne ikke oprette rabatkode');
      }
      setCreating(false);
      return;
    }

    toast.success('Rabatkode oprettet!');
    navigate('/admin/discounts');
    setCreating(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    navigate('/admin');
    return null;
  }

  return (
    <AdminDashboardLayout activeTab="discounts">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/discounts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Opret rabatkode</h2>
            <p className="text-muted-foreground">Opret en ny rabatkode som kunder kan bruge</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Rabatkode detaljer
            </CardTitle>
            <CardDescription>
              Udfyld oplysningerne for den nye rabatkode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Kode *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="F.eks. VELKOMMEN20"
                  className="font-mono"
                />
                <Button variant="outline" type="button" onClick={generateRandomCode}>
                  Generer
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="F.eks. Velkomsttilbud til nye kunder"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rabattype *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, discount_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Procent rabat</SelectItem>
                    <SelectItem value="free_months">Gratis måneder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {formData.discount_type === 'percent' ? 'Procent' : 'Antal måneder'} *
                </Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_value: parseInt(e.target.value) || 0 }))}
                  min={1}
                  max={formData.discount_type === 'percent' ? 100 : 12}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max antal brug</Label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                  placeholder="Ubegrænset"
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Udløbsdato</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/admin/discounts')}>
                Annuller
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Opret rabatkode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default DiscountsAddPage;
