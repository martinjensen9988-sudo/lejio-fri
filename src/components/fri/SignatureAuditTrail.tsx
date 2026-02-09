import React from 'react';
import { ContractSignature } from '@/hooks/useDealerListings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Globe, Smartphone, Calendar, Lock } from 'lucide-react';

interface SignatureAuditTrailProps {
  signatures: ContractSignature[];
  loading?: boolean;
}

export function SignatureAuditTrail({ signatures, loading = false }: SignatureAuditTrailProps) {
  if (loading) {
    return <div className="text-center py-8">Indlæser underskrifter...</div>;
  }

  if (!signatures || signatures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Ingen underskrifter endnu</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-center">{signatures.length}</div>
            <div className="text-sm text-center text-gray-600 mt-1">I alt underskrifter</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-center text-green-600">
              {signatures.filter(s => s.isValid).length}
            </div>
            <div className="text-sm text-center text-gray-600 mt-1">Gyldige</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-center text-red-600">
              {signatures.filter(s => !s.isValid).length}
            </div>
            <div className="text-sm text-center text-gray-600 mt-1">Afvist</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {signatures.map((sig) => (
          <Card key={sig.id} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-mono bg-gray-100 px-3 py-1 rounded text-sm font-semibold tracking-wider">
                      {sig.signatureCode}
                    </div>
                    <Badge variant={sig.isValid ? 'default' : 'destructive'}>
                      {sig.isValid ? 'Gyldig' : 'Afvist'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">{sig.customerName}</div>
                    <div>{sig.customerEmail}</div>
                  </div>
                </div>
                {sig.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 pb-4 border-b">
                <div>
                  <div className="text-gray-500 flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4" />
                    Tidspunkt
                  </div>
                  <div className="font-mono">
                    {new Date(sig.signatureTimestamp).toLocaleString('da-DK')}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4" />
                    IP-adresse
                  </div>
                  <div className="font-mono">{sig.ipAddress}</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600 text-xs font-semibold mb-1">BROWSER</div>
                    <div className="font-mono text-xs">{sig.browser}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600 text-xs font-semibold mb-1">OPERATIVSYSTEM</div>
                    <div className="font-mono text-xs">{sig.os}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded md:col-span-2">
                    <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold mb-1">
                      <Smartphone className="w-3 h-3" />
                      ENHED
                    </div>
                    <div className="font-mono text-xs">{sig.device}</div>
                  </div>
                </div>

                {sig.ipCountry || sig.ipCity ? (
                  <div className="bg-blue-50 p-3 rounded text-xs">
                    <div className="text-gray-600 font-semibold mb-1">LOKATION</div>
                    <div className="font-mono">
                      {sig.ipCity && sig.ipCountry
                        ? `${sig.ipCity}, ${sig.ipCountry}`
                        : sig.ipCountry || sig.ipCity || 'Ukendt'}
                    </div>
                  </div>
                ) : null}

                {sig.rejectionReason ? (
                  <div className="bg-red-50 p-3 rounded text-xs border border-red-200">
                    <div className="text-red-700 font-semibold mb-1">ÅRSAG TIL AFVISNING</div>
                    <div>{sig.rejectionReason}</div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
