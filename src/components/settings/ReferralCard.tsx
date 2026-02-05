import { useState } from 'react';
import { useReferral } from '@/hooks/useReferral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Gift, 
  Copy, 
  Share2, 
  Users, 
  Wallet, 
  Check,
  ExternalLink 
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const ReferralCard = () => {
  const { 
    referralCode, 
    redemptions, 
    isLoading, 
    copyCodeToClipboard, 
    getShareUrl,
    applyReferralCode 
  } = useReferral();
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [applying, setApplying] = useState(false);

  const handleCopy = () => {
    copyCodeToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bliv lejer hos LEJIO',
          text: 'Få 500 kr. rabat på din første måneds leje med min henvisningskode!',
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, copy instead
        copyCodeToClipboard();
      }
    } else {
      copyCodeToClipboard();
    }
  };

  const handleApplyCode = async () => {
    if (!inputCode.trim()) return;
    
    setApplying(true);
    await applyReferralCode(inputCode.trim());
    setApplying(false);
    setInputCode('');
  };

  if (isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Henvisningsprogram
        </CardTitle>
        <CardDescription>
          Giv en ven 500 kr. rabat og få selv 500 kr. i kredit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Your Code */}
        {referralCode && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Din henvisningskode</h4>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted/50 border border-border rounded-lg px-4 py-3 font-mono text-lg font-bold tracking-wider">
                {referralCode.code}
              </div>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Del din kode med venner og familie. De får 500 kr. rabat på deres første måneds leje.
            </p>
          </div>
        )}

        {/* Stats */}
        {referralCode && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/30 rounded-xl p-3 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{referralCode.total_referrals}</p>
              <p className="text-xs text-muted-foreground">Henvisninger</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3 text-center">
              <Wallet className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <p className="text-xl font-bold">{referralCode.available_credit} kr</p>
              <p className="text-xs text-muted-foreground">Tilgængelig</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3 text-center">
              <Gift className="w-5 h-5 mx-auto mb-1 text-accent" />
              <p className="text-xl font-bold">{referralCode.total_credit_earned} kr</p>
              <p className="text-xs text-muted-foreground">Total optjent</p>
            </div>
          </div>
        )}

        {/* Apply Code (for users who received a referral) */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="font-medium text-sm">Har du en henvisningskode?</h4>
          <div className="flex gap-2">
            <Input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="LEJIO-XXXXXX"
              className="font-mono uppercase"
            />
            <Button 
              onClick={handleApplyCode} 
              disabled={!inputCode.trim() || applying}
            >
              {applying ? 'Anvender...' : 'Anvend'}
            </Button>
          </div>
        </div>

        {/* Recent Referrals */}
        {redemptions.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="font-medium text-sm">Seneste henvisninger</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {redemptions.slice(0, 5).map(redemption => (
                <div 
                  key={redemption.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      {format(new Date(redemption.created_at), 'dd. MMM yyyy', { locale: da })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={redemption.status === 'completed' ? 'default' : 'secondary'}>
                      {redemption.status === 'completed' ? '+500 kr' : 'Afventer'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Sådan virker det
          </h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Del din personlige henvisningskode med venner</li>
            <li>De får 500 kr. rabat på deres første måneds leje</li>
            <li>Når de gennemfører deres første booking, får du 500 kr. i kredit</li>
            <li>Brug din kredit på din næste leje</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
