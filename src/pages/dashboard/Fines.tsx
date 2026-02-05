import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import FinesTab from '@/components/dashboard/FinesTab';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2 } from 'lucide-react';

const FinesPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

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
    <DashboardLayout activeTab="fines">
      <div>
        <h2 className="text-2xl font-bold mb-2">Bøder & Afgifter</h2>
        <p className="text-muted-foreground mb-6">Håndter bøder fra lejere</p>
        <FinesTab />
      </div>
    </DashboardLayout>
  );
};

export default FinesPage;
