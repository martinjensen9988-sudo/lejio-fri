import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Webhook, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const WEBHOOK_URL = 'https://aqzggwewjttbkaqnbmrb.supabase.co/functions/v1/gps-webhook';

const PROVIDER_EXAMPLES = {
  teltonika: {
    label: 'Teltonika',
    example: `{
  "imei": "352656100123456",
  "latitude": 55.6761,
  "longitude": 12.5683,
  "speed": 45,
  "heading": 180,
  "altitude": 12,
  "odometer": 125430,
  "ignition": true,
  "timestamp": "2024-01-15T10:30:00Z"
}`,
  },
  ruptela: {
    label: 'Ruptela',
    example: `{
  "deviceId": "352656100123456",
  "lat": 55.6761,
  "lng": 12.5683,
  "speed": 45,
  "direction": 180,
  "mileage": 125430,
  "ignition": true,
  "datetime": "2024-01-15T10:30:00Z"
}`,
  },
  autopi: {
    label: 'AutoPi',
    example: `{
  "unit_id": "abc123",
  "position": { "lat": 55.6761, "lon": 12.5683, "alt": 12 },
  "speed": 45,
  "track": 180,
  "odometer": 125430,
  "engine": true,
  "utc": "2024-01-15T10:30:00Z"
}`,
  },
  generic: {
    label: 'Generisk',
    example: `{
  "device_id": "my-tracker-001",
  "latitude": 55.6761,
  "longitude": 12.5683,
  "speed": 45,
  "heading": 180,
  "odometer": 125430,
  "ignition": true,
  "timestamp": "2024-01-15T10:30:00Z"
}`,
  },
};

export const GpsWebhookInfo = () => {
  const [copied, setCopied] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<keyof typeof PROVIDER_EXAMPLES>('generic');

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Kopieret til udklipsholder');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="w-5 h-5" />
          Webhook-integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Konfigurer din GPS-udbyder til at sende data til dette endpoint:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-muted rounded-lg text-sm break-all">
              {WEBHOOK_URL}?provider={selectedProvider}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(`${WEBHOOK_URL}?provider=${selectedProvider}`)}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Vælg udbyder:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PROVIDER_EXAMPLES).map(([key, value]) => (
              <Badge
                key={key}
                variant={selectedProvider === key ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedProvider(key as keyof typeof PROVIDER_EXAMPLES)}
              >
                {value.label}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Eksempel på data ({PROVIDER_EXAMPLES[selectedProvider].label}):</p>
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
            {PROVIDER_EXAMPLES[selectedProvider].example}
          </pre>
        </div>

        <div className="p-4 bg-accent/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Understøttede felter:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>device_id/imei</strong> - Enhedens unikke ID (påkrævet)</li>
            <li>• <strong>latitude/lat</strong> - Breddegrad (påkrævet)</li>
            <li>• <strong>longitude/lng/lon</strong> - Længdegrad (påkrævet)</li>
            <li>• <strong>speed</strong> - Hastighed i km/t</li>
            <li>• <strong>heading/direction</strong> - Retning i grader</li>
            <li>• <strong>odometer/mileage</strong> - Km-tæller</li>
            <li>• <strong>ignition/engine</strong> - Tænding status</li>
            <li>• <strong>fuel_level</strong> - Brændstofniveau</li>
            <li>• <strong>battery_level</strong> - Batteriniveau</li>
            <li>• <strong>timestamp/datetime</strong> - Tidspunkt for måling</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
