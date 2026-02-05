import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  User,
  Building2,
  Headphones,
  Search,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  is_from_support: boolean;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
}

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string | null;
  is_customer_service: boolean;
  created_at: string;
  updated_at: string;
  participant_one_profile?: {
    full_name: string | null;
    email: string;
    company_name: string | null;
  };
  participant_two_profile?: {
    full_name: string | null;
    email: string;
    company_name: string | null;
  } | null;
  last_message?: Message;
  unread_count?: number;
}

const AdminMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel(`admin-messages-${activeConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // Get all customer service conversations
      const { data: convData, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('is_customer_service', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Enrich with participant info and last message
      const enrichedConversations = await Promise.all(
        (convData || []).map(async (conv) => {
          // Get participant one profile
          const { data: p1Profile } = await supabase
            .from('profiles')
            .select('full_name, email, company_name')
            .eq('id', conv.participant_one)
            .single();

          // Get last message
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count (messages not from support)
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .eq('is_from_support', false);

          return {
            ...conv,
            participant_one_profile: p1Profile,
            last_message: lastMessageData,
            unread_count: count || 0,
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Kunne ikke hente samtaler');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_from_support', false);

      // Refresh to update unread counts
      fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !activeConversation || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation,
          sender_id: user.id,
          content: newMessage.trim(),
          is_from_support: true,
        });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversation);

      setNewMessage('');
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Kunne ikke sende besked');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.participant_one_profile?.email?.toLowerCase().includes(searchLower) ||
      conv.participant_one_profile?.full_name?.toLowerCase().includes(searchLower) ||
      conv.participant_one_profile?.company_name?.toLowerCase().includes(searchLower)
    );
  });

  const activeConv = conversations.find((c) => c.id === activeConversation);
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Kundeservice beskeder
              {totalUnread > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {totalUnread} ulæste
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Besvar henvendelser fra kunder</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchConversations}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Opdater
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-lg overflow-hidden h-[500px] flex">
          {/* Conversations list */}
          <div className="w-80 border-r border-border flex flex-col">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Søg i samtaler..."
                  className="pl-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Indlæser...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Ingen samtaler endnu</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv.id)}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                        activeConversation === conv.id ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {conv.participant_one_profile?.company_name ? (
                              <Building2 className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {conv.participant_one_profile?.company_name ||
                                conv.participant_one_profile?.full_name ||
                                conv.participant_one_profile?.email ||
                                'Ukendt'}
                            </p>
                            {(conv.unread_count ?? 0) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {conv.last_message.is_from_support && 'Du: '}
                              {conv.last_message.content}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(conv.updated_at), 'd. MMM HH:mm', { locale: da })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages area */}
          <div className="flex-1 flex flex-col">
            {activeConversation && activeConv ? (
              <>
                {/* Chat header */}
                <div className="p-3 border-b border-border flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {activeConv.participant_one_profile?.company_name ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {activeConv.participant_one_profile?.company_name ||
                        activeConv.participant_one_profile?.full_name ||
                        activeConv.participant_one_profile?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeConv.participant_one_profile?.email}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Ingen beskeder endnu</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isSupport = message.is_from_support;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-xl px-3 py-2 ${
                                isSupport
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              {message.attachment_url && (
                                <a
                                  href={message.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline block mb-1"
                                >
                                  📎 {message.attachment_name || 'Vedhæftet fil'}
                                </a>
                              )}
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  isSupport ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                }`}
                              >
                                {format(new Date(message.created_at), 'HH:mm', { locale: da })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message input */}
                <div className="p-3 border-t border-border">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Skriv et svar..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button type="submit" disabled={!newMessage.trim() || sending}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Headphones className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Vælg en samtale</p>
                  <p className="text-sm">for at svare på kundehenvendelser</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminMessages;
