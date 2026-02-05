import { useState } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Flag } from 'lucide-react';

interface ReportLessorModalProps {
  open: boolean;
  onClose: () => void;
  lessorId: string;
  lessorName?: string;
  bookingId?: string;
}

const REPORT_REASONS = [
  { value: 'poor_vehicle_condition', label: 'Dårlig køretøjsstand' },
  { value: 'misleading_description', label: 'Vildledende beskrivelse' },
  { value: 'unprofessional_behavior', label: 'Uprofessionel opførsel' },
  { value: 'overcharging', label: 'Overopkrævning' },
  { value: 'cancellation_issues', label: 'Afbestillingsproblemer' },
  { value: 'safety_concerns', label: 'Sikkerhedsproblemer' },
  { value: 'other', label: 'Andet' },
];

const ReportLessorModal = ({ 
  open, 
  onClose, 
  lessorId, 
  lessorName,
  bookingId 
}: ReportLessorModalProps) => {
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
      onClose();
      setFormData({
        reporter_name: '',
        reporter_email: '',
        reporter_phone: '',
        reason: '',
        description: '',
        severity: 3,
      });
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Rapportér udlejer
          </DialogTitle>
          <DialogDescription>
            {lessorName 
              ? `Rapportér et problem med ${lessorName}`
              : 'Rapportér et problem med en udlejer'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuller
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Indsend rapport
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportLessorModal;
