import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, User, Save } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  subscription_status: string;
  subscription_tier: string | null;
  fleet_plan: string | null;
  manual_activation: boolean;
}

const UserEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasAccess, isLoading: authLoading } = useAdminAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    subscription_status: '',
    subscription_tier: '',
    fleet_plan: '',
    manual_activation: false,
  });

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Kunne ikke hente bruger');
      navigate('/admin/users');
      return;
    }

    setUser(data);
    setEditForm({
      subscription_status: data.subscription_status,
      subscription_tier: data.subscription_tier || 'free',
      fleet_plan: data.fleet_plan || '',
      manual_activation: data.manual_activation,
    });
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const updateData: unknown = {
      subscription_status: editForm.subscription_status,
      subscription_tier: editForm.subscription_tier,
      manual_activation: editForm.manual_activation,
    };

    if (editForm.fleet_plan && editForm.fleet_plan !== 'none') {
      updateData.fleet_plan = editForm.fleet_plan;
    } else {
      updateData.fleet_plan = null;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      toast.error('Kunne ikke opdatere bruger');
    } else {
      toast.success('Bruger opdateret');
      navigate('/admin/users');
    }
    setSaving(false);
  };

  if (authLoading || loading) {
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

  if (!user) {
    return null;
  }

  return (
    <AdminDashboardLayout activeTab="users">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Rediger bruger</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Brugeroplysninger
            </CardTitle>
            <CardDescription>
              Rediger abonnement og adgang for {user.full_name || user.company_name || user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Abonnement status</Label>
              <Select
                value={editForm.subscription_status}
                onValueChange={(v) => setEditForm(prev => ({ ...prev, subscription_status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Prøveperiode</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="cancelled">Annulleret</SelectItem>
                  <SelectItem value="expired">Udløbet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Abonnement niveau</Label>
              <Select
                value={editForm.subscription_tier}
                onValueChange={(v) => setEditForm(prev => ({ ...prev, subscription_tier: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratis</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fleet plan</Label>
              <Select
                value={editForm.fleet_plan || 'none'}
                onValueChange={(v) => setEditForm(prev => ({ ...prev, fleet_plan: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen</SelectItem>
                  <SelectItem value="fleet_basic">Fleet Basic</SelectItem>
                  <SelectItem value="fleet_premium">Fleet Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Manuel aktivering</Label>
                <p className="text-sm text-muted-foreground">
                  Tillad adgang uden betaling
                </p>
              </div>
              <Switch
                checked={editForm.manual_activation}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, manual_activation: checked }))}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/admin/users')}>
                Annuller
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Gem ændringer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default UserEditPage;
