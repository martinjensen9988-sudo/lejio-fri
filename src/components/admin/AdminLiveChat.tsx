import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Send, Loader2, User, Bot, CheckCircle2, Clock, Mail, Phone, AlertCircle, Users, Eye } from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { useVisitorPresence } from '@/hooks/useVisitorPresence';
import { toast } from 'sonner';
interface ChatSession {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  session_status: string;
  needs_human_support: boolean;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const AdminLiveChat = () => {
  const { user } = useAuth();
  const { visitors, visitorCount } = useVisitorPresence({ isAdmin: true });
  const [isLiveChatActive, setIsLiveChatActive] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLiveChatSettings();
    fetchSessions();
    fetchContactSubmissions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Subscribe to new sessions
    const sessionsChannel = supabase
      .channel('admin-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitor_chat_sessions',
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
    };
  }, []);

  useEffect(() => {
    if (!selectedSession?.id) return;

    const messagesChannel = supabase
      .channel(`admin-chat-${selectedSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitor_chat_messages',
          filter: `session_id=eq.${selectedSession.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedSession?.id]);

  const fetchLiveChatSettings = async () => {
    const { data } = await supabase
      .from('live_chat_settings')
      .select('is_live_chat_active')
      .single();
    setIsLiveChatActive(data?.is_live_chat_active ?? false);
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('visitor_chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });
    setSessions((data as ChatSession[]) || []);
  };

  const fetchContactSubmissions = async () => {
    const { data } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    setContactSubmissions((data as ContactSubmission[]) || []);
  };

  const fetchMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('visitor_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    setMessages((data as ChatMessage[]) || []);
  };

  const toggleLiveChat = async () => {
    const newValue = !isLiveChatActive;
    const { error } = await supabase
      .from('live_chat_settings')
      .update({ is_live_chat_active: newValue, updated_by: user?.id })
      .eq('id', '00000000-0000-0000-0000-000000000001');

    if (error) {
      toast.error('Kunne ikke ændre live chat status');
    } else {
      setIsLiveChatActive(newValue);
      toast.success(newValue ? 'Live chat er nu aktiv' : 'Live chat er nu deaktiveret');
    }
  };

  const selectSession = (session: ChatSession) => {
    setSelectedSession(session);
    fetchMessages(session.id);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedSession || !user) return;

    setIsLoading(true);
    try {
      await supabase.from('visitor_chat_messages').insert({
        session_id: selectedSession.id,
        sender_type: 'admin',
        content: input.trim(),
      });

      await supabase
        .from('visitor_chat_sessions')
        .update({ session_status: 'in_progress', assigned_admin_id: user.id })
        .eq('id', selectedSession.id);

      setInput('');
    } catch (error) {
      toast.error('Kunne ikke sende besked');
    } finally {
      setIsLoading(false);
    }
  };

  const markContactAsHandled = async (id: string) => {
    await supabase
      .from('contact_submissions')
      .update({ status: 'handled', responded_at: new Date().toISOString(), responded_by: user?.id })
      .eq('id', id);
    fetchContactSubmissions();
    toast.success('Markeret som håndteret');
  };

  const waitingSessions = sessions.filter((s) => s.needs_human_support && s.session_status === 'waiting_for_agent');
  const activeSessions = sessions.filter((s) => s.session_status === 'in_progress');
  const pendingContacts = contactSubmissions.filter((c) => c.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Live Visitors Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Besøgende lige nu</p>
                <p className="text-3xl font-bold text-primary">{visitorCount}</p>
              </div>
            </div>
            {visitorCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Se detaljer
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-2 p-1">
                    <p className="font-semibold text-sm">Aktive besøgende:</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {visitors.map((v, i) => (
                        <div key={v.visitorId} className="text-xs flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="truncate max-w-[150px]">{v.page}</span>
                          <span className="text-muted-foreground">
                            ({Math.floor((Date.now() - new Date(v.enteredAt).getTime()) / 60000)}m)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Chat Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Live Chat Indstillinger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="live-chat-toggle" className="font-medium">
                Live Chat Aktiv
              </Label>
              <p className="text-sm text-muted-foreground">
                Når deaktiveret vises en kontaktformular i stedet for live chat
              </p>
            </div>
            <Switch
              id="live-chat-toggle"
              checked={isLiveChatActive}
              onCheckedChange={toggleLiveChat}
            />
          </div>
          <div className="mt-4 flex gap-4">
            <Badge variant={isLiveChatActive ? 'default' : 'secondary'}>
              {isLiveChatActive ? 'Online' : 'Offline'}
            </Badge>
            {waitingSessions.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                {waitingSessions.length} venter
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="live-chat">
        <TabsList>
          <TabsTrigger value="live-chat" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Live Chat
            {waitingSessions.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {waitingSessions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2">
            <Mail className="w-4 h-4" />
            Kontaktformularer
            {pendingContacts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {pendingContacts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live-chat" className="mt-4">
          <div className="grid grid-cols-3 gap-4 h-[600px]">
            {/* Sessions List */}
            <Card className="col-span-1">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Chat-sessioner</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[530px]">
                <CardContent className="space-y-2 pt-0">
                  {waitingSessions.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-destructive">Venter på svar</p>
                      {waitingSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => selectSession(session)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors border-2 border-destructive bg-destructive/5 hover:bg-destructive/10 ${
                            selectedSession?.id === session.id ? 'ring-2 ring-primary' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium text-sm truncate">
                              {session.visitor_name || 'Besøgende'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(session.created_at).toLocaleString('da-DK')}
                          </p>
                        </div>
                      ))}
                      <Separator className="my-2" />
                    </>
                  )}

                  {activeSessions.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-green-600">Aktive</p>
                      {activeSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => selectSession(session)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors border hover:bg-muted ${
                            selectedSession?.id === session.id ? 'ring-2 ring-primary bg-muted' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium text-sm truncate">
                              {session.visitor_name || 'Besøgende'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(session.updated_at).toLocaleString('da-DK')}
                          </p>
                        </div>
                      ))}
                    </>
                  )}

                  {waitingSessions.length === 0 && activeSessions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Ingen aktive chats
                    </p>
                  )}
                </CardContent>
              </ScrollArea>
            </Card>

            {/* Chat Window */}
            <Card className="col-span-2 flex flex-col">
              {selectedSession ? (
                <>
                  <CardHeader className="py-3 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">
                          {selectedSession.visitor_name || 'Besøgende'}
                        </CardTitle>
                        <div className="flex gap-2 mt-1">
                          {selectedSession.visitor_email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {selectedSession.visitor_email}
                            </span>
                          )}
                          {selectedSession.visitor_phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {selectedSession.visitor_phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={selectedSession.session_status === 'in_progress' ? 'default' : 'secondary'}>
                        {selectedSession.session_status === 'in_progress' ? 'I gang' : 'Venter'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                              msg.sender_type === 'admin'
                                ? 'bg-primary text-primary-foreground'
                                : msg.sender_type === 'ai'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                              {msg.sender_type === 'visitor' && <User className="w-3 h-3" />}
                              {msg.sender_type === 'ai' && <Bot className="w-3 h-3" />}
                              {msg.sender_type === 'admin' && <CheckCircle2 className="w-3 h-3" />}
                              <span>
                                {msg.sender_type === 'visitor' ? 'Besøgende' : msg.sender_type === 'ai' ? 'AI' : 'Dig'}
                              </span>
                            </div>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Skriv en besked..."
                        disabled={isLoading}
                      />
                      <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <p className="text-muted-foreground">Vælg en chat for at starte</p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Kontaktformularer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contactSubmissions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Ingen kontaktformularer</p>
                ) : (
                  contactSubmissions.map((contact) => (
                    <div key={contact.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{contact.name}</h4>
                            <Badge variant={contact.status === 'pending' ? 'destructive' : 'secondary'}>
                              {contact.status === 'pending' ? 'Afventer' : 'Håndteret'}
                            </Badge>
                          </div>
                          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </span>
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(contact.created_at).toLocaleString('da-DK')}
                            </span>
                          </div>
                        </div>
                        {contact.status === 'pending' && (
                          <Button size="sm" onClick={() => markContactAsHandled(contact.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Markér som håndteret
                          </Button>
                        )}
                      </div>
                      <p className="mt-3 text-sm bg-muted p-3 rounded">{contact.message}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
