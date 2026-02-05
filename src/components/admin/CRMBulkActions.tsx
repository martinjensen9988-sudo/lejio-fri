import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Trash2, Mail, CheckCircle2 } from 'lucide-react';
import { SalesLead } from '@/hooks/useSalesLeads';
import { useState } from 'react';

interface CRMBulkActionsProps {
  selectedLeads: SalesLead[];
  onStatusChange: (status: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onExport: () => void;
  isLoading?: boolean;
}

export const CRMBulkActions = ({
  selectedLeads,
  onStatusChange,
  onDelete,
  onExport,
  isLoading = false,
}: CRMBulkActionsProps) => {
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  if (selectedLeads.length === 0) {
    return null;
  }

  const handleBulkStatusUpdate = async () => {
    if (bulkStatus) {
      await onStatusChange(bulkStatus);
      setBulkStatus('');
      setShowStatusConfirm(false);
    }
  };

  const handleBulkDelete = async () => {
    await onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Card className="bg-primary/5 border-primary/20 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            {selectedLeads.length} markerede leads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Bulk Status Update */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Opdater Status
              </label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Vælg status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Ny</SelectItem>
                  <SelectItem value="contacted">Kontaktet</SelectItem>
                  <SelectItem value="interested">Interesseret</SelectItem>
                  <SelectItem value="qualified">Kvalificeret</SelectItem>
                  <SelectItem value="lost">Tabt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Handlinger
              </label>
              <Button
                size="sm"
                variant="default"
                disabled={!bulkStatus || isLoading}
                onClick={() => setShowStatusConfirm(true)}
                className="h-9"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Gem Status
              </Button>
            </div>

            {/* Export Button */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Eksport
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={onExport}
                className="h-9"
              >
                <Download className="w-3 h-3 mr-1" />
                CSV Export
              </Button>
            </div>

            {/* Delete Button */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Slet
              </label>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-9"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Slet {selectedLeads.length}
              </Button>
            </div>
          </div>

          {/* Selected Leads Preview */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Markerede leads:
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedLeads.slice(0, 5).map((lead) => (
                <Badge key={lead.id} variant="secondary" className="text-xs">
                  {lead.company_name}
                </Badge>
              ))}
              {selectedLeads.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedLeads.length - 5} mere
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Confirmation Dialog */}
      <Dialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opdater status på {selectedLeads.length} leads?</DialogTitle>
            <DialogDescription>
              Alle markerede leads vil få status: <strong>{bulkStatus}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusConfirm(false)}>
              Afbryd
            </Button>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={isLoading}
            >
              {isLoading ? 'Opdaterer...' : 'Opdater Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slet {selectedLeads.length} leads?</DialogTitle>
            <DialogDescription>
              Denne handling kan ikke fortrydes. Alle markerede leads vil blive permanent slettet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Afbryd
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? 'Sletter...' : 'Slet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
