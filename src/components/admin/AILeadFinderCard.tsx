import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Search, 
  Target, 
  TrendingUp, 
  MapPin, 
  Lightbulb,
  RefreshCw,
  ArrowRight,
  Building2,
  Loader2,
  Brain
} from 'lucide-react';
import { useAILeadFinder, LeadSuggestion } from '@/hooks/useAILeadFinder';
import { SalesLead } from '@/hooks/useSalesLeads';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface AILeadFinderCardProps {
  existingLeads: SalesLead[];
  onSearchClick?: (query: string, location?: string) => void;
}

export function AILeadFinderCard({ existingLeads, onSearchClick }: AILeadFinderCardProps) {
  const navigate = useNavigate();
  const { 
    isLoading, 
    suggestions, 
    lastUpdated,
    findSmartRecommendations, 
    discoverNewLeads 
  } = useAILeadFinder();
  
  const [activeTab, setActiveTab] = useState<'smart' | 'discover'>('discover');

  const handleRefresh = async () => {
    if (activeTab === 'smart' && existingLeads.length > 0) {
      await findSmartRecommendations(existingLeads);
    } else {
      await discoverNewLeads();
    }
  };

  // Auto-load on mount
  useEffect(() => {
    if (suggestions.length === 0) {
      discoverNewLeads();
    }
  }, [suggestions.length, discoverNewLeads]);

  const handleSuggestionClick = (suggestion: LeadSuggestion) => {
    if (onSearchClick) {
      onSearchClick(suggestion.search_query, suggestion.city !== 'Hele Danmark' ? suggestion.city : undefined);
    } else {
      // Navigate to company search with pre-filled query
      navigate(`/admin/sales-ai/company-search?q=${encodeURIComponent(suggestion.search_query)}&location=${encodeURIComponent(suggestion.city || '')}`);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Lead Finder</CardTitle>
              <CardDescription>Automatiske lead-forslag baseret på AI</CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Tab buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeTab === 'discover' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTab('discover');
              discoverNewLeads();
            }}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Find nye leads
          </Button>
          <Button
            variant={activeTab === 'smart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTab('smart');
              if (existingLeads.length > 0) {
                findSmartRecommendations(existingLeads);
              }
            }}
            className="flex-1"
            disabled={existingLeads.length === 0}
          >
            <Target className="w-4 h-4 mr-2" />
            Smarte anbefalinger
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">AI analyserer markedet...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Klik på en af knapperne ovenfor for at få AI-forslag</p>
          </div>
        ) : (
          <>
            {/* Last updated */}
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Sidst opdateret: {format(lastUpdated, 'd. MMM HH:mm', { locale: da })}
              </p>
            )}
            
            {/* Suggestions list */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {suggestions.slice(0, 8).map((suggestion, index) => (
                <div
                  key={index}
                  className="group border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">{suggestion.company_name}</span>
                        <Badge className={`text-xs ${getScoreColor(suggestion.score)}`}>
                          {suggestion.score}/10
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {suggestion.industry}
                        </span>
                        {suggestion.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {suggestion.city}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {suggestion.reason}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Search className="w-4 h-4 mr-1" />
                      Søg
                    </Button>
                  </div>
                  
                  {/* Score progress bar */}
                  <div className="mt-2">
                    <Progress value={suggestion.score * 10} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/admin/sales-ai/company-search')}
              >
                <Search className="w-4 h-4 mr-2" />
                Manuel søgning
              </Button>
              <Button 
                className="flex-1"
                onClick={() => navigate('/admin/crm')}
              >
                Se alle leads
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
