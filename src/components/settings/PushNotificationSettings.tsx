import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Loader2, AlertTriangle, Smartphone } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNativePushNotifications } from '@/hooks/useNativePushNotifications';
import { Capacitor } from '@capacitor/core';

const PushNotificationSettings = () => {
  const isNative = Capacitor.isNativePlatform();
  
  // Use native push for Android/iOS, web push for browser
  const webPush = usePushNotifications();
  const nativePush = useNativePushNotifications();

  const {
    isSupported,
    isLoading,
    permission,
  } = webPush;

  const isSubscribed = isNative ? nativePush.isRegistered : webPush.isSubscribed;
  const loading = isNative ? nativePush.isLoading : isLoading;

  const handleToggle = async () => {
    if (isNative) {
      if (nativePush.isRegistered) {
        await nativePush.unregister();
      } else {
        await nativePush.register();
      }
    } else {
      if (webPush.isSubscribed) {
        await webPush.unsubscribe();
      } else {
        await webPush.subscribe();
      }
    }
  };

  // Native app always supports push notifications
  if (!isNative && !isSupported) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-yellow" />
            Push notifikationer
          </CardTitle>
          <CardDescription>
            Din browser understøtter ikke push notifikationer.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          Push notifikationer
          {isNative && (
            <span className="ml-auto">
              <Smartphone className="w-4 h-4 text-mint" />
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {isNative 
            ? 'Få native notifikationer direkte på din enhed.'
            : 'Få besked om nye bookinger, beskeder og vigtige opdateringer.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notifications" className="flex flex-col gap-1">
            <span className="font-medium">Aktiver push notifikationer</span>
            <span className="text-sm text-muted-foreground">
              {isSubscribed 
                ? 'Du modtager notifikationer på denne enhed' 
                : 'Aktivér for at modtage notifikationer'}
            </span>
          </Label>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <Switch
              id="push-notifications"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          </div>
        </div>

        {!isNative && permission === 'denied' && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
            <p className="text-destructive font-medium">Notifikationer er blokeret</p>
            <p className="text-muted-foreground mt-1">
              Du har blokeret notifikationer i din browser. Gå til browserens indstillinger for at ændre dette.
            </p>
          </div>
        )}

        {nativePush.error && isNative && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
            <p className="text-destructive font-medium">Fejl</p>
            <p className="text-muted-foreground mt-1">{nativePush.error}</p>
          </div>
        )}

        {isSubscribed && (
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground">Du modtager notifikationer for:</p>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mint" />
                Nye booking-forespørgsler
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mint" />
                Booking-bekræftelser
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mint" />
                Nye beskeder
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mint" />
                Kontrakt-underskrifter
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationSettings;
