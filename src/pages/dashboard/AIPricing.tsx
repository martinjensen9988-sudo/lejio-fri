import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/useVehicles';
import { AIPriceSuggestions } from '@/components/dashboard/AIPriceSuggestions';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2 } from 'lucide-react';

const AIPricingPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { vehicles, updateVehicle } = useVehicles();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout activeTab="ai-pricing">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Prissætning</h2>
        <p className="text-muted-foreground mb-6">Intelligente prisanbefalinger</p>
        <AIPriceSuggestions vehicles={vehicles} onApplyPrice={async (id, updates) => updateVehicle(id, updates)} />
      </div>
    </DashboardLayout>
  );
};

export default AIPricingPage;
