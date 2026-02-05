import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import FavoritesTab from '@/components/dashboard/FavoritesTab';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2 } from 'lucide-react';

const FavoritesPage = () => {
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
    <DashboardLayout activeTab="favorites">
      <div>
        <h2 className="text-2xl font-bold mb-2">Favoritter</h2>
        <p className="text-muted-foreground mb-6">Dine favoritlejere</p>
        <FavoritesTab />
      </div>
    </DashboardLayout>
  );
};

export default FavoritesPage;
