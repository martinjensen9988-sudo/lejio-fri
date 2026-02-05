import { useState, useEffect, useRef, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2, Bot, User, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { safeStorage } from '@/lib/safeStorage';

interface Message {
  id: string;
  sender_type: 'visitor' | 'ai' | 'admin';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  session_status: string;
  needs_human_support: boolean;
}

export const LiveChatWidget = forwardRef<HTMLDivElement>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLiveChatActive, setIsLiveChatActive] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Defer chat initialization to avoid blocking critical render path
    // Use requestIdleCallback if available, fallback to setTimeout
    const initChat = () => {
      checkLiveChatStatus().catch(console.error);
      loadOrCreateSession().catch(console.error);
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(initChat, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    } else {
      const timeoutId = setTimeout(initChat, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [checkLiveChatStatus, loadOrCreateSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!session?.id) return;

    const channel = supabase
      .channel(`chat-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitor_chat_messages',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_type === 'admin') {
            setMessages((prev) => [...prev, newMessage]);
            // When admin sends a message, update session status to in_progress
            setSession((prev) => prev ? { ...prev, session_status: 'in_progress' } : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  const checkLiveChatStatus = async () => {
    try {
      const { data } = await supabase
        .from('live_chat_settings')
        .select('is_live_chat_active')
        .single();
      setIsLiveChatActive(data?.is_live_chat_active ?? false);
    } catch (error) {
      console.error('Error checking live chat status:', error);
      setIsLiveChatActive(false);
    }
  };

  const loadOrCreateSession = async () => {
    try {
      const storedSessionId = safeStorage.getItem('lejio_chat_session');
      const storedSessionToken = safeStorage.getItem('lejio_chat_token');
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (storedSessionId && storedSessionToken && uuidRegex.test(storedSessionId)) {
        // Use secure Edge Function for session access
        const { data, error } = await supabase.functions.invoke('chat-session', {
          body: { action: 'get', sessionId: storedSessionId, sessionToken: storedSessionToken }
        });
        
        if (!error && data?.session) {
          setSession(data.session as ChatSession);
          loadMessages(storedSessionId, storedSessionToken);
          return;
        }
      }
      
      // If session not found, invalid, or error, clear old session data
      if (storedSessionId) {
        safeStorage.removeItem('lejio_chat_session');
        safeStorage.removeItem('lejio_chat_token');
      }

      // Create new session via secure Edge Function
      const { data, error } = await supabase.functions.invoke('chat-session', {
        body: { action: 'create' }
      });

      if (error || !data?.session) {
        console.error('Failed to create chat session:', error);
        return;
      }

      // Store session ID and token securely
      safeStorage.setItem('lejio_chat_session', data.session.id);
      safeStorage.setItem('lejio_chat_token', data.token);
      setSession(data.session as ChatSession);
      
      // Add welcome message
      const welcomeMsg: Message = {
        id: 'welcome',
        sender_type: 'ai',
        content: 'Hej! 👋 Jeg er LEJIOs AI-assistent. Hvordan kan jeg hjælpe dig i dag? Du kan spørge mig om priser, hvordan platformen fungerer, eller noget helt andet.',
        created_at: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
    } catch (error) {
      console.error('Chat session error:', error);
    }
  };

  const loadMessages = async (sessionId: string, sessionToken?: string) => {
    const token = sessionToken || safeStorage.getItem('lejio_chat_token');
    if (!token) return;

    // Use secure Edge Function for message access
    const { data, error } = await supabase.functions.invoke('chat-session', {
      body: { action: 'messages', sessionId, sessionToken: token }
    });

    if (!error && data?.messages && data.messages.length > 0) {
      setMessages(data.messages as Message[]);
    } else {
      const welcomeMsg: Message = {
        id: 'welcome',
        sender_type: 'ai',
        content: 'Hej! 👋 Jeg er LEJIOs AI-assistent. Hvordan kan jeg hjælpe dig i dag?',
        created_at: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
    }
  };

  const streamChat = async (userMessage: string) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/live-chat-ai`;

    const chatMessages = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.sender_type === 'visitor' ? 'user' : 'assistant',
        content: m.content,
      }));

    chatMessages.push({ role: 'user', content: userMessage });

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: chatMessages }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error('Failed to start stream');
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.sender_type === 'ai' && last.id === 'streaming') {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: fullResponse } : m
                );
              }
              return [
                ...prev,
                {
                  id: 'streaming',
                  sender_type: 'ai',
                  content: fullResponse,
                  created_at: new Date().toISOString(),
                },
              ];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    return fullResponse;
  };

  const handleSend = async () => {
    if (!input.trim() || !session) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender_type: 'visitor',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Save user message via edge function (bypasses RLS)
    const sessionToken = safeStorage.getItem('lejio_chat_token');
    await supabase.functions.invoke('chat-session', {
      body: { action: 'send_message', sessionId: session.id, sessionToken, content: userMessage }
    });

    // If session is already handled by human agent (in_progress or waiting_for_agent), 
    // don't call AI - just save the message
    if (session.session_status === 'in_progress' || session.session_status === 'waiting_for_agent') {
      setIsLoading(false);
      return;
    }

    try {
      const aiResponse = await streamChat(userMessage);

      // Check if AI needs human support
      if (aiResponse.includes('[NEEDS_HUMAN_SUPPORT]')) {
        const cleanResponse = aiResponse.replace('[NEEDS_HUMAN_SUPPORT]', '').trim();
        
        // Update session to need human support via edge function
        const sessionToken = safeStorage.getItem('lejio_chat_token');
        await supabase.functions.invoke('chat-session', {
          body: { action: 'request_human', sessionId: session.id, sessionToken }
        });

        setSession((prev) => prev ? { ...prev, needs_human_support: true, session_status: 'waiting_for_agent' } : prev);

        if (!isLiveChatActive) {
          setShowContactForm(true);
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== 'streaming');
            return [
              ...filtered,
              {
                id: crypto.randomUUID(),
                sender_type: 'ai',
                content: cleanResponse || 'Jeg kan desværre ikke besvare dette spørgsmål. Da vores kundeservice ikke er online lige nu, kan du udfylde kontaktformularen herunder, så vender vi tilbage hurtigst muligt.',
                created_at: new Date().toISOString(),
              },
            ];
          });
        } else {
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== 'streaming');
            return [
              ...filtered,
              {
                id: crypto.randomUUID(),
                sender_type: 'ai',
                content: cleanResponse || 'Jeg sender dig videre til vores kundeservice. Vent venligst, så er der snart en medarbejder klar til at hjælpe dig.',
                created_at: new Date().toISOString(),
              },
            ];
          });
        }
      } else {
        // Update streaming message to final
        setMessages((prev) =>
          prev.map((m) =>
            m.id === 'streaming' ? { ...m, id: crypto.randomUUID() } : m
          )
        );
      }

      // Save AI response to DB
      await supabase.from('visitor_chat_messages').insert({
        session_id: session.id,
        sender_type: 'ai',
        content: aiResponse.replace('[NEEDS_HUMAN_SUPPORT]', '').trim(),
      });
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Der opstod en fejl. Prøv igen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Udfyld venligst alle påkrævede felter');
      return;
    }

    try {
      await supabase.from('contact_submissions').insert({
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone || null,
        message: contactForm.message,
      });

      if (session) {
        await supabase
          .from('visitor_chat_sessions')
          .update({
            visitor_name: contactForm.name,
            visitor_email: contactForm.email,
            visitor_phone: contactForm.phone || null,
          })
          .eq('id', session.id);
      }

      toast.success('Tak for din besked! Vi vender tilbage hurtigst muligt.');
      setShowContactForm(false);
      setContactForm({ name: '', email: '', phone: '', message: '' });

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender_type: 'ai',
          content: '✅ Din besked er sendt! Vi vender tilbage til dig på ' + contactForm.email + ' hurtigst muligt.',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Der opstod en fejl. Prøv igen.');
    }
  };

  const requestHumanSupport = async () => {
    if (!session) return;

    // Update session via edge function (bypasses RLS)
    const sessionToken = safeStorage.getItem('lejio_chat_token');
    await supabase.functions.invoke('chat-session', {
      body: { action: 'request_human', sessionId: session.id, sessionToken }
    });
    
    setSession((prev) => prev ? { ...prev, needs_human_support: true, session_status: 'waiting_for_agent' } : prev);

    if (!isLiveChatActive) {
      setShowContactForm(true);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender_type: 'ai',
          content: 'Vores kundeservice er ikke online lige nu. Udfyld venligst kontaktformularen herunder, så vender vi tilbage hurtigst muligt.',
          created_at: new Date().toISOString(),
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender_type: 'ai',
          content: 'Jeg sender dig videre til vores kundeservice. Vent venligst, så er der snart en medarbejder klar til at hjælpe dig. 🎧',
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  const getSenderIcon = (type: string) => {
    switch (type) {
      case 'visitor':
        return <User className="w-4 h-4" />;
      case 'ai':
        return <Bot className="w-4 h-4" />;
      case 'admin':
        return <Headphones className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getSenderName = (type: string) => {
    switch (type) {
      case 'visitor':
        return 'Dig';
      case 'ai':
        return 'LEJIO AI';
      case 'admin':
        return 'Kundeservice';
      default:
        return '';
    }
  };

  return (
    <div ref={ref} {...props}>
      {/* Chat Button - LEFT SIDE */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${isOpen ? 'hidden' : ''}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window - LEFT SIDE */}
      {isOpen && (
        <Card className="fixed bottom-6 left-6 z-50 w-[380px] h-[550px] flex flex-col shadow-2xl border-2">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <CardTitle className="text-lg font-semibold">LEJIO Support</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            {session?.needs_human_support && isLiveChatActive && (
              <p className="text-xs opacity-90 mt-1">Venter på kundeservice...</p>
            )}
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender_type === 'visitor' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  {getSenderIcon(msg.sender_type)}
                  <span>{getSenderName(msg.sender_type)}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.sender_type === 'visitor'
                      ? 'bg-primary text-primary-foreground'
                      : msg.sender_type === 'admin'
                      ? 'bg-green-100 text-green-900'
                      : 'bg-muted'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />

            {/* Contact Form */}
            {showContactForm && (
              <form onSubmit={handleContactSubmit} className="space-y-3 bg-muted/50 rounded-lg p-3 mt-4">
                <h4 className="font-semibold text-sm">Kontaktformular</h4>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="name" className="text-xs">Navn *</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Dit navn"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="din@email.dk"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs">Telefon</Label>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Evt. telefonnummer"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-xs">Besked *</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                      placeholder="Beskriv hvordan vi kan hjælpe..."
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" className="w-full">
                  Send besked
                </Button>
              </form>
            )}
          </CardContent>

          <div className="p-3 border-t bg-background">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={requestHumanSupport}
                className="text-xs gap-1"
                disabled={session?.needs_human_support}
              >
                <Headphones className="w-3 h-3" />
                Tal med kundeservice
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Skriv en besked..."
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
});

LiveChatWidget.displayName = "LiveChatWidget";
