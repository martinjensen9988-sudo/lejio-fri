import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CRMDeal } from '@/hooks/useCRM';
import { MessageSquare, User, Clock, AtSign } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export interface Comment {
  id: string;
  deal_id: string;
  author_id: string;
  author_name: string;
  content: string;
  mentions?: string[];
  created_at: string;
  updated_at: string;
}

interface TeamCollaborationProps {
  deal: CRMDeal;
  comments: Comment[];
  onAddComment: (content: string, mentions?: string[]) => Promise<void>;
  isLoading?: boolean;
}

export const TeamCollaboration = ({
  deal,
  comments,
  onAddComment,
  isLoading = false,
}: TeamCollaborationProps) => {
  const [newComment, setNewComment] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  // Parse mentions in comment (@username)
  const handleCommentChange = (text: string) => {
    setNewComment(text);
    
    const mentionPattern = /@(\w+)/g;
    const foundMentions = text.match(mentionPattern) || [];
    setMentions(foundMentions.map(m => m.substring(1))); // Remove @

    if (text.includes('@')) {
      setShowMentionMenu(true);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    await onAddComment(newComment, mentions);
    setNewComment('');
    setMentions([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Team Collaboration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments Timeline */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ingen kommentarer endnu
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-border/50 rounded-lg p-3 bg-card/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{comment.author_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(comment.created_at), 'd. MMM HH:mm', {
                          locale: da,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap">{comment.content}</p>

                {/* Mentions as badges */}
                {comment.mentions && comment.mentions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {comment.mentions.map((mention) => (
                      <Badge
                        key={mention}
                        variant="secondary"
                        className="text-xs"
                      >
                        <AtSign className="w-3 h-3 mr-1" />
                        {mention}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <div className="border-t pt-4">
          <label className="text-sm font-semibold block mb-2">
            Tilføj kommentar
          </label>
          <Textarea
            value={newComment}
            onChange={(e) => handleCommentChange(e.target.value)}
            placeholder="Skriv din kommentar... Brug @navn for at nævne teammedlemmer"
            className="min-h-20"
          />

          {/* Mentions UI */}
          {mentions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {mentions.map((mention) => (
                <Badge key={mention} variant="outline" className="text-xs">
                  <AtSign className="w-3 h-3 mr-1" />
                  {mention}
                </Badge>
              ))}
            </div>
          )}

          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isLoading}
            className="mt-3 w-full"
          >
            {isLoading ? 'Sender...' : 'Tilføj Kommentar'}
          </Button>
        </div>

        {/* Assigned Team Member */}
        {deal.assigned_to && (
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Tildelt til
            </p>
            <Badge variant="secondary">{deal.assigned_to}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
