import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFriAuth } from '@/hooks/useFriAuth';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Din platform</h1>
          <p className="text-gray-600">Log ind på dit dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Log ind</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded text-red-800 text-sm p-3">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logger ind...' : 'Log ind'}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm text-gray-600">
                Har du ikke en konto?{' '}
                <button
                  onClick={() => navigate('/fri/signup')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Tilmeld dig her
                </button>
              </p>
              <p className="text-sm text-gray-600">
                <button
                  onClick={() => alert('Kontakt support: support@yourdomain.com')}
                  className="text-blue-600 hover:underline"
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
