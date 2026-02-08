import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFriApiKeys } from '@/hooks/useFriApiKeys';
import { useFriAuthContext } from '@/providers/FriAuthProvider';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Eye, EyeOff, Plus, Trash2, AlertTriangle, Key, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';

export const FriApiKeysPage = () => {
  const navigate = useNavigate();
  const { user } = useFriAuthContext();
  const lessorId = user?.lessor_id || user?.id || '';
  const { apiKeys, loading, error, fetchApiKeys, createApiKey, deleteApiKey, revokeApiKey, activateApiKey } = useFriApiKeys();
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyData, setNewKeyData] = useState<any>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);
  const [deleteConfirmKeyId, setDeleteConfirmKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (!lessorId) return;
    fetchApiKeys(lessorId);
  }, [lessorId]);

  const isAuthError = useMemo(() => {
    return !!error && (error.includes('401') || error.toLowerCase().includes('not authenticated'));
  }, [error]);

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      const result = await createApiKey(lessorId, newKeyName);
      if (result) {
        setNewKeyData(result);
        setNewKeyName('');
        await fetchApiKeys(lessorId);
      }
    } catch (err) {
      console.error('Error creating API key:', err);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(key);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      await deleteApiKey(keyId);
      setDeleteConfirmKeyId(null);
    } catch (err) {
      console.error('Error deleting key:', err);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeApiKey(keyId);
    } catch (err) {
      console.error('Error revoking key:', err);
    }
  };

  const handleActivateKey = async (keyId: string) => {
    try {
      await activateApiKey(keyId);
    } catch (err) {
      console.error('Error activating key:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Indlæser API keys...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
          </div>
          <p className="text-gray-600">Administrer dine API nøgler til integrationer</p>
        </div>
        <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Ny API nøgle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opret ny API nøgle</DialogTitle>
              <DialogDescription>
                Giv din API nøgle et navn for nemt at identificere den senere
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="f.eks. 'Production API'"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
              <Button onClick={handleCreateApiKey} disabled={!newKeyName.trim()} className="w-full">
                Opret nøgle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            {isAuthError && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-700"
                onClick={() => navigate('/login')}
              >
                Log ind igen
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* New Key Created Dialog */}
      {newKeyData && (
        <Dialog open={!!newKeyData} onOpenChange={() => setNewKeyData(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API nøgle oprettet! 🎉</DialogTitle>
              <DialogDescription>
                Gem denne nøgle på et sikkert sted. Du vil ikke kunne se den igen.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm break-all">
                <code className="text-green-400">{newKeyData.full_key}</code>
              </div>
              <Button
                onClick={() => handleCopyKey(newKeyData.full_key)}
                className="w-full gap-2"
              >
                <Copy className="w-4 h-4" />
                {copiedKeyId === newKeyData.full_key ? 'Kopieret!' : 'Kopier nøgle'}
              </Button>
              <p className="text-xs text-gray-600">
                Brug denne nøgle til at godkende dine API anmodninger. 
                <br />
                <strong>Gem den på et sikkert sted!</strong>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* API Keys List */}
      <div className="space-y-3">
        {apiKeys.length > 0 ? (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      apiKey.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {apiKey.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                      {apiKey.key}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyKey(apiKey.key)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500">
                    Oprettet {formatDistanceToNow(new Date(apiKey.created_at), { locale: da, addSuffix: true })}
                    {apiKey.last_used_at && (
                      <> • Sidst brugt {formatDistanceToNow(new Date(apiKey.last_used_at), { locale: da, addSuffix: true })}</>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {apiKey.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeKey(apiKey.id)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      Tilbakekald
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActivateKey(apiKey.id)}
                    >
                      Aktiver
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialog open={deleteConfirmKeyId === apiKey.id} onOpenChange={(open) => {
                      if (!open) setDeleteConfirmKeyId(null);
                    }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmKeyId(apiKey.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Slet API nøgle?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Dette kan ikke fortrydes. Alle integrationer bruger denne nøgle vil ikke længere fungere.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex justify-end gap-3">
                          <AlertDialogCancel>Annuller</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteKey(apiKey.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Slet
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Ingen API nøgler endnu</p>
            <p className="text-sm text-gray-500 mt-1">Opret din første nøgle for at komme i gang</p>
          </Card>
        )}
      </div>

      {/* Documentation */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📚 API Documentation</h3>
        <p className="text-sm text-blue-800 mb-3">
          Brug dine API nøgler til at godkende anmodninger. Inkluder den i Authorization header:
        </p>
        <code className="block text-xs bg-blue-900 text-blue-100 p-3 rounded font-mono mb-3">
          Authorization: Bearer sk_live_xxxxx
        </code>
        <p className="text-xs text-blue-800">
          Se fuld dokumentation på <a href="#" className="underline">api.ditdomæne.dk/docs</a>
        </p>
      </Card>
    </div>
  );
};
