import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  Headphones,
  User,
  Building2,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Languages,
  Loader2
} from "lucide-react";
import { supabase } from '@/integrations/azure/client';
import { toast } from "sonner";
import { format } from "date-fns";
import { da } from "date-fns/locale";

const Messages = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    conversations,
    messages,
    loading,
    activeConversation,
    setActiveConversation,
    sendMessage,
    uploadAttachment,
    startConversation,
  } = useMessages();

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translateMessage = async (messageId: string, content: string) => {
    if (translatedMessages[messageId]) {
      // Toggle off translation
      setTranslatedMessages(prev => {
        const copy = { ...prev };
        delete copy[messageId];
        return copy;
      });
      return;
    }

    setTranslatingId(messageId);
    try {
      const { data, error } = await supabase.functions.invoke('translate-message', {
        body: { 
          message_id: messageId,
          message_content: content, 
          target_language: 'da' 
        }
      });

      if (error) throw error;

      if (data?.translated_content) {
        setTranslatedMessages(prev => ({
          ...prev,
          [messageId]: data.translated_content
        }));
        toast.success(`Oversat fra ${data.original_language || 'ukendt sprog'}`);
      }
    } catch (err) {
      console.error('Translation error:', err);
      toast.error('Kunne ikke oversætte besked');
    } finally {
      setTranslatingId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!activeConversation || (!newMessage.trim() && !selectedFile) || sending) return;

    setSending(true);
    
    let attachment = undefined;
    if (selectedFile) {
      setUploading(true);
      attachment = await uploadAttachment(selectedFile);
      setUploading(false);
    }

    await sendMessage(activeConversation, newMessage, attachment || undefined);
    setNewMessage("");
    setSelectedFile(null);
    setSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Filen er for stor. Maks 10 MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const isImageFile = (type?: string | null) => type?.startsWith('image/');

  const getAttachmentIcon = (type?: string | null) => {
    if (isImageFile(type)) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const handleStartCustomerServiceChat = async () => {
    await startConversation(null, true);
  };

  const activeConv = conversations.find((c) => c.id === activeConversation);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-24 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Indlæser...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Beskeder
            </h1>
            <Button
              onClick={handleStartCustomerServiceChat}
              variant="outline"
              size="sm"
              className="gap-2 w-full sm:w-auto"
            >
              <Headphones className="w-4 h-4" />
              Kontakt kundeservice
            </Button>
          </div>

          <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden h-[calc(100vh-180px)] sm:h-[600px] flex">
            {/* Conversations list */}
            <div className={`w-full md:w-80 border-r border-border flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-border">
                <h2 className="font-medium text-foreground">Samtaler</h2>
              </div>
              <ScrollArea className="flex-1">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Ingen samtaler endnu</p>
                    <p className="text-sm mt-1">Start en samtale med kundeservice</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setActiveConversation(conv.id)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          activeConversation === conv.id ? "bg-muted/50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className={conv.is_customer_service ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}>
                              {conv.is_customer_service ? (
                                <Headphones className="w-5 h-5" />
                              ) : conv.other_participant?.company_name ? (
                                <Building2 className="w-5 h-5" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-foreground truncate">
                                {conv.is_customer_service
                                  ? "LEJIO Kundeservice"
                                  : conv.other_participant?.company_name ||
                                    conv.other_participant?.full_name ||
                                    conv.other_participant?.email ||
                                    "Ukendt bruger"}
                              </p>
                              {(conv.unread_count ?? 0) > 0 && (
                                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                            {conv.last_message && (
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {conv.last_message.content}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(conv.updated_at), "d. MMM HH:mm", { locale: da })}
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
            <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
              {activeConversation && activeConv ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-border flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-2 hover:bg-muted rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={activeConv.is_customer_service ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}>
                        {activeConv.is_customer_service ? (
                          <Headphones className="w-5 h-5" />
                        ) : activeConv.other_participant?.company_name ? (
                          <Building2 className="w-5 h-5" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {activeConv.is_customer_service
                          ? "LEJIO Kundeservice"
                          : activeConv.other_participant?.company_name ||
                            activeConv.other_participant?.full_name ||
                            activeConv.other_participant?.email}
                      </p>
                      {activeConv.is_customer_service && (
                        <p className="text-xs text-muted-foreground">
                          Vi svarer hurtigst muligt
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Ingen beskeder endnu</p>
                          <p className="text-sm">Skriv en besked for at starte samtalen</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isOwn = message.sender_id === user?.id;
                          const isTranslated = !!translatedMessages[message.id];
                          const displayContent = isTranslated 
                            ? translatedMessages[message.id] 
                            : message.content;
                          
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                  isOwn
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                }`}
                              >
                                {message.attachment_url && (
                                  <div className="mb-2">
                                    {isImageFile(message.attachment_type) ? (
                                      <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
                                        <img 
                                          src={message.attachment_url} 
                                          alt={message.attachment_name || "Billede"} 
                                          className="max-w-full rounded-lg max-h-48 object-cover"
                                        />
                                      </a>
                                    ) : (
                                      <a 
                                        href={message.attachment_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 p-2 rounded-lg ${
                                          isOwn ? "bg-primary-foreground/10" : "bg-background"
                                        }`}
                                      >
                                        {getAttachmentIcon(message.attachment_type)}
                                        <span className="text-sm truncate">{message.attachment_name || "Fil"}</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                                {displayContent && !displayContent.startsWith('📎 ') && (
                                  <p className="whitespace-pre-wrap break-words">
                                    {displayContent}
                                    {isTranslated && (
                                      <span className="block text-xs opacity-70 mt-1 italic">
                                        (Oversat)
                                      </span>
                                    )}
                                  </p>
                                )}
                                <div className={`flex items-center justify-between gap-2 mt-1`}>
                                  <p
                                    className={`text-xs ${
                                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                    }`}
                                  >
                                    {format(new Date(message.created_at), "HH:mm", { locale: da })}
                                  </p>
                                  {!isOwn && message.content && (
                                    <button
                                      onClick={() => translateMessage(message.id, message.content)}
                                      disabled={translatingId === message.id}
                                      className={`text-xs flex items-center gap-1 hover:opacity-80 transition-opacity ${
                                        isTranslated ? "text-primary" : "text-muted-foreground"
                                      }`}
                                    >
                                      {translatingId === message.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Languages className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message input */}
                  <div className="p-4 border-t border-border">
                    {selectedFile && (
                      <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {getAttachmentIcon(selectedFile.type)}
                          <span className="text-sm truncate">{selectedFile.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedFile(null)}
                          className="shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending || uploading}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Skriv en besked..."
                        className="flex-1"
                        disabled={sending || uploading}
                      />
                      <Button type="submit" disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Vælg en samtale</p>
                    <p className="text-sm">Eller start en ny samtale med kundeservice</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;