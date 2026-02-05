import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CRMDeal, CRM_STAGES } from '@/hooks/useCRM';
import { 
  MoreVertical, 
  Phone, 
  Mail, 
  Building2, 
  DollarSign,
  GripVertical,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface AdminCRMPipelineProps {
  deals: CRMDeal[];
  onUpdateStage: (dealId: string, stage: string) => Promise<void>;
  onEditDeal: (deal: CRMDeal) => void;
  onDeleteDeal: (dealId: string) => Promise<void>;
  onViewDeal: (deal: CRMDeal) => void;
  onCallDeal?: (deal: CRMDeal) => void;
  onEmailDeal?: (deal: CRMDeal) => void;
  isCallingInProgress?: boolean;
}

export const AdminCRMPipeline = ({
  deals,
  onUpdateStage,
  onEditDeal,
  onDeleteDeal,
  onViewDeal,
  onCallDeal,
  onEmailDeal,
  isCallingInProgress,
}: AdminCRMPipelineProps) => {
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const handleDragStart = (dealId: string) => {
    setDraggedDeal(dealId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (stageId: string) => {
    if (draggedDeal) {
      await onUpdateStage(draggedDeal, stageId);
    }
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStageDeals = (stageId: string) => {
    return deals.filter(deal => deal.stage === stageId);
  };

  const getStageTotal = (stageId: string) => {
    return getStageDeals(stageId).reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
      {CRM_STAGES.map((stage) => (
        <div
          key={stage.id}
          className={`flex-shrink-0 w-72 bg-muted/30 rounded-lg transition-colors ${
            dragOverStage === stage.id ? 'bg-primary/10 ring-2 ring-primary' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, stage.id)}
          onDragLeave={handleDragLeave}
          onDrop={() => handleDrop(stage.id)}
        >
          <div className="p-3 border-b bg-muted/50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {getStageDeals(stage.id).length}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatValue(getStageTotal(stage.id))}
            </p>
          </div>

          <div className="p-2 space-y-2 min-h-[400px]">
            {getStageDeals(stage.id).map((deal) => (
              <Card
                key={deal.id}
                draggable
                onDragStart={() => handleDragStart(deal.id)}
                className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                  draggedDeal === deal.id ? 'opacity-50 scale-95' : ''
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-medium text-sm truncate cursor-pointer hover:text-primary"
                          onClick={() => onViewDeal(deal)}
                        >
                          {deal.title}
                        </h4>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => onViewDeal(deal)}>
                          Se detaljer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditDeal(deal)}>
                          Rediger
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteDeal(deal.id)}
                          className="text-destructive"
                        >
                          Slet
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {deal.company_name && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{deal.company_name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-1">
                    <DollarSign className="w-3 h-3 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {formatValue(deal.value || 0)}
                    </span>
                  </div>

                  {deal.expected_close_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Forventet: {format(new Date(deal.expected_close_date), 'd. MMM', { locale: da })}
                    </p>
                  )}

                  {/* Communication buttons */}
                  <div className="flex items-center gap-2 mt-2">
                    {deal.contact_phone && onCallDeal && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCallDeal(deal);
                        }}
                        disabled={isCallingInProgress}
                        title="Ring op"
                      >
                        {isCallingInProgress ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Phone className="w-3 h-3 text-green-600" />
                        )}
                      </Button>
                    )}
                    {deal.contact_email && onEmailDeal && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEmailDeal(deal);
                        }}
                        title="Send email"
                      >
                        <Mail className="w-3 h-3 text-blue-600" />
                      </Button>
                    )}
                    {deal.probability > 0 && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        {deal.probability}%
                      </Badge>
                    )}
                  </div>

                  {/* Quick stage navigation */}
                  {stage.id !== 'won' && stage.id !== 'lost' && (
                    <div className="flex gap-1 mt-2 pt-2 border-t">
                      {CRM_STAGES.filter(s => 
                        CRM_STAGES.findIndex(x => x.id === s.id) > CRM_STAGES.findIndex(x => x.id === stage.id)
                      ).slice(0, 2).map(nextStage => (
                        <Button
                          key={nextStage.id}
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs flex-1"
                          onClick={() => onUpdateStage(deal.id, nextStage.id)}
                        >
                          <ChevronRight className="w-3 h-3 mr-1" />
                          {nextStage.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {getStageDeals(stage.id).length === 0 && (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                Træk deals hertil
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
