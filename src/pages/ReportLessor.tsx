import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Loader2, Flag } from 'lucide-react';

const REPORT_REASONS = [
  { value: 'poor_vehicle_condition', label: 'Dårlig køretøjsstand' },
  { value: 'misleading_description', label: 'Vildledende beskrivelse' },
  { value: 'unprofessional_behavior', label: 'Uprofessionel opførsel' },
  { value: 'overcharging', label: 'Overopkrævning' },
  { value: 'cancellation_issues', label: 'Afbestillingsproblemer' },
  { value: 'safety_concerns', label: 'Sikkerhedsproblemer' },
  { value: 'other', label: 'Andet' },
];

const ReportLessorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const lessorId = searchParams.get('lessorId') || '';
  const lessorName = searchParams.get('lessorName') || '';
  const bookingId = searchParams.get('bookingId') || undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reporter_name: '',
    reporter_email: '',
    reporter_phone: '',
    reason: '',
    description: '',
    severity: 3,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reporter_email || !formData.reason || !formData.description) {
      toast.error('Udfyld venligst alle påkrævede felter');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('lessor_reports')
      .insert({
        lessor_id: lessorId,
        booking_id: bookingId || null,
        reporter_name: formData.reporter_name || null,
        reporter_email: formData.reporter_email,
        reporter_phone: formData.reporter_phone || null,
        reason: formData.reason,
        description: formData.description,
        severity: formData.severity,
      });

    if (error) {
      console.error('Error creating report:', error);
      toast.error('Kunne ikke oprette rapport');
    } else {
      toast.success('Rapport indsendt - vi gennemgår den hurtigst muligt');
      navigate(-1);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbage
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <Flag className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <CardTitle>Rapportér udlejer</CardTitle>
                <CardDescription>
                  {lessorName 
                    ? `Rapportér et problem med ${lessorName}`
                    : 'Rapportér et problem med en udlejer'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dit navn</Label>
                  <Input
                    value={formData.reporter_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, reporter_name: e.target.value }))}
                    placeholder="Fulde navn"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Din e-mail *</Label>
                  <Input
                    type="email"
                    required
                    value={formData.reporter_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, reporter_email: e.target.value }))}
                    placeholder="din@email.dk"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dit telefonnummer</Label>
                <Input
                  type="tel"
                  value={formData.reporter_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, reporter_phone: e.target.value }))}
                  placeholder="+45 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <Label>Årsag til rapporten *</Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg årsag" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_REASONS.map(reason => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Alvorlighed: {formData.severity}/5</Label>
                <Slider
                  value={[formData.severity]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, severity: value }))}
                  min={1}
                  max={5}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mindre</span>
                  <span>Kritisk</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse af problemet *</Label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beskriv hvad der skete, og hvorfor du rapporterer udlejeren..."
                  rows={4}
                />
              </div>

              <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                <p>
                  Din rapport vil blive gennemgået af LEJIO's team. Vi kontakter dig via e-mail 
                  hvis vi har brug for yderligere oplysninger.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                  Annuller
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Indsend rapport
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportLessorPage;
