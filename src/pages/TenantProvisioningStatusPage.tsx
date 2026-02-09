import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Clock, AlertTriangle, Loader2, Copy, Shield } from 'lucide-react';

interface ProvisioningStep {
  name: string;
  minProgress: number;
  maxProgress: number;
  icon: React.ReactNode;
  completed: boolean;
}

export function TenantProvisioningStatusPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const steps: ProvisioningStep[] = [
    {
      name: 'Initializing',
      minProgress: 0,
      maxProgress: 5,
      icon: <Clock className="w-4 h-4" />,
      completed: status?.provisioning?.progressPercent >= 5
    },
    {
      name: 'Setting up database',
      minProgress: 5,
      maxProgress: 40,
      icon: <Shield className="w-4 h-4" />,
      completed: status?.provisioning?.progressPercent >= 40
    },
    {
      name: 'Migrating data',
      minProgress: 40,
      maxProgress: 60,
      icon: <Loader2 className="w-4 h-4" />,
      completed: status?.provisioning?.progressPercent >= 60
    },
    {
      name: 'Verifying setup',
      minProgress: 60,
      maxProgress: 90,
      icon: <Clock className="w-4 h-4" />,
      completed: status?.provisioning?.progressPercent >= 90
    },
    {
      name: 'Complete',
      minProgress: 90,
      maxProgress: 100,
      icon: <CheckCircle2 className="w-4 h-4" />,
      completed: status?.provisioning?.progressPercent === 100
    }
  ];

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `/api/CheckTenantProvisioningStatus?tenant_id=${tenantId}`
        );
        if (!response.ok) throw new Error('Failed to fetch status');
        const data = await response.json();
        setStatus(data);
        setError(null);

        // Stop polling when complete
        if (data.provisioning?.status === 'completed' || data.provisioning?.progressPercent === 100) {
          setTimeout(() => {
            // Redirect to actual tenant URL
            window.location.href = `https://${data.tenant.domain}`;
          }, 2000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Poll every 3 seconds
    const interval = setInterval(() => {
      fetchStatus();
      setPollCount(c => c + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [tenantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Henter provisioning status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = status?.provisioning?.progressPercent || 0;
  const isComplete = status?.readyForUse || progress === 100;
  const isFailed = status?.provisioning?.status === 'failed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 Din LEJIO FRI er på vej!
          </h1>
          <p className="text-lg text-gray-600">
            {status?.tenant?.name} bliver sat up nu...
          </p>
        </div>

        {/* Main Status Card */}
        <Card className="mb-6 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <span>Opsætning i gang</span>
              <Badge variant={isComplete ? 'default' : 'secondary'}>
                {progress}%
              </Badge>
            </CardTitle>
            <CardDescription className="text-blue-100">
              Status: {status?.provisioning?.step || 'Initializing'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Error Alert */}
            {isFailed && (
              <Alert className="mb-6 bg-red-50 border-red-300">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Fejl ved opsætning:</strong> {status?.provisioning?.errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Progress Bar */}
            <div className="mb-6">
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-gray-600 mt-2">
                {isComplete ? '✓ Fuldført!' : `${progress}% færdig`}
              </p>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-full ${
                    step.completed 
                      ? 'bg-green-100 text-green-600' 
                      : progress >= step.minProgress
                      ? 'bg-blue-100 text-blue-600 animate-pulse'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : progress >= step.minProgress ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{step.name}</div>
                    <div className="text-sm text-gray-500">
                      {step.minProgress}% - {step.maxProgress}%
                    </div>
                  </div>
                  {step.completed && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tenant Info Card */}
        {status?.tenant && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Din domæne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-mono text-lg font-semibold text-blue-600 break-all">
                  {status.tenant.domain}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {isComplete ? (
                    <span className="text-green-600 font-medium">
                      ✓ Klar til brug! Du omdirigeres om få sekunder...
                    </span>
                  ) : (
                    'Du får automatisk adgang når opsætningen er færdig'
                  )}
                </p>
              </div>

              {/* Copy Domain Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://${status.tenant.domain}`);
                  alert('Kopi kopieret!');
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 font-medium transition"
              >
                <Copy className="w-4 h-4" />
                Kopier domæne
              </button>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ℹ️ Hvad sker der?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              ✓ Vi overfører dine data fra trial-serveren til din egen dedikerede server
            </p>
            <p>
              ✓ Databasen konfigureres med fuld isolation af dine oplysninger
            </p>
            <p>
              ✓ Din unikke domæne {status?.tenant?.domain} bliver acktiveret
            </p>
            <p>
              ✓ Du får fuld adgang til alle LEJIO FRI features
            </p>
            <p className="text-gray-600 italic">
              Normalt tager dette 5-10 minutter. Du kan vente her eller vende tilbage senere.
            </p>
          </CardContent>
        </Card>

        {/* Auto-reload notice */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Auto-opdateres hvert 3. sekund... ({pollCount})
        </p>
      </div>
    </div>
  );
}
