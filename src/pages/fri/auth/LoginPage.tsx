import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useFriAuth } from '@/hooks/useFriAuth';
import { Crown } from 'lucide-react';

export function FriLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useFriAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      // Redirect to where they came from or dashboard
      const from = (location.state as any)?.from?.pathname || '/fri/dashboard';
      navigate(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center px-4 py-8 relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_45%)]" />
      
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/fri" className="inline-flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <Crown className="h-6 w-6 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Din platform</h1>
          <p className="text-amber-200/80">Log ind på dit dashboard</p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Log ind</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.dk"
                  required
                  autoComplete="email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
                  Adgangskode
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm p-3">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110" disabled={loading}>
                {loading ? 'Logger ind...' : 'Log ind'}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm text-white/70">
                Har du ikke en konto?{' '}
                <button
                  onClick={() => navigate('/fri/signup')}
                  className="text-amber-300 hover:underline font-medium"
                >
                  Tilmeld dig her
                </button>
              </p>
              <p className="text-sm text-white/70">
                <button
                  onClick={() => alert('Kontakt support: support@yourdomain.com')}
                  className="text-amber-300 hover:underline"
                >
                  Glemt adgangskode?
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
