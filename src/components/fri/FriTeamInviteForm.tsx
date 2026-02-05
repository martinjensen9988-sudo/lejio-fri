import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { InviteTeamMemberInput } from '@/hooks/useFriTeam';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FriTeamInviteFormProps {
  onSubmit: (data: InviteTeamMemberInput) => Promise<void>;
  onCancel: () => void;
}

export function FriTeamInviteForm({ onSubmit, onCancel }: FriTeamInviteFormProps) {
  const [formData, setFormData] = useState<InviteTeamMemberInput>({
    email: '',
    full_name: '',
    role: 'manager',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">Inviter teammedlem</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tilføj nyt medlem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="medlem@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuldt navn *
              </label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="f.eks. Johan Hansen"
                required
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Rolle</h3>
              <Select value={formData.role} onValueChange={(value: any) =>
                setFormData({ ...formData, role: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div>
                      <p className="font-medium">Administrator</p>
                      <p className="text-xs text-gray-600">Fuld adgang til alle funktioner</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div>
                      <p className="font-medium">Manager</p>
                      <p className="text-xs text-gray-600">Administrer køretøjer, bookinger, fakturaer</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div>
                      <p className="font-medium">Læser</p>
                      <p className="text-xs text-gray-600">Læseadgang til alle data</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                {formData.role === 'admin' && 'Fuld adgang til alle funktioner og kan administrere andre medlemmer.'}
                {formData.role === 'manager' && 'Kan administrere køretøjer, bookinger og fakturaer.'}
                {formData.role === 'viewer' && 'Har kun læseadgang til alle data.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end border-t pt-6">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Annuller
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sender...' : 'Send invitation'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
