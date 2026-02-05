import { useState, useEffect } from "react";
import { supabase } from '@/integrations/azure/client';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  booking_id: string | null;
  is_customer_service: boolean;
  created_at: string;
  updated_at: string;
  other_participant?: {
    full_name: string | null;
    email: string;
    company_name: string | null;
  };
  last_message?: Message;
  unread_count?: number;
}

export const useMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (convError) throw convError;

      // Fetch other participant details and last message for each conversation
      const enrichedConversations = await Promise.all(
        (convData || []).map(async (conv) => {
          const otherParticipantId = conv.participant_one === user.id 
            ? conv.participant_two 
            : conv.participant_one;

          let otherParticipant = null;
          if (otherParticipantId && !conv.is_customer_service) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, email, company_name")
              .eq("id", otherParticipantId)
              .single();
            otherParticipant = profileData;
          }

          // Get last message
          const { data: lastMessageData } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id);

          return {
            ...conv,
            other_participant: otherParticipant || (conv.is_customer_service ? { full_name: "LEJIO Kundeservice", email: "hej@lejio.dk", company_name: null } : null),
            last_message: lastMessageData,
            unread_count: count || 0,
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error: unknown) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id);

    } catch (error: unknown) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (
    conversationId: string, 
    content: string,
    attachment?: { url: string; type: string; name: string }
  ) => {
    if (!user || (!content.trim() && !attachment)) return;

    try {
      const messageData: unknown = {
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim() || (attachment ? `📎 ${attachment.name}` : ''),
      };

      if (attachment) {
        messageData.attachment_url = attachment.url;
        messageData.attachment_type = attachment.type;
        messageData.attachment_name = attachment.name;
      }

      const { data, error } = await supabase
        .from("messages")
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Update conversation's updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Send notification to other participant
      const conv = conversations.find(c => c.id === conversationId);
      if (conv && conv.other_participant?.email) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, company_name")
          .eq("id", user.id)
          .single();

        supabase.functions.invoke("send-message-notification", {
          body: {
            recipientEmail: conv.other_participant.email,
            recipientName: conv.other_participant.full_name || conv.other_participant.email,
            senderName: profile?.company_name || profile?.full_name || "En bruger",
            messagePreview: content.trim() || attachment?.name || "",
            conversationId,
          },
        }).catch(console.error);
      }

      return data;
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      toast({
        title: "Fejl",
        description: "Kunne ikke sende besked",
        variant: "destructive",
      });
      return null;
    }
  };

  const uploadAttachment = async (file: File) => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("message-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("message-attachments")
        .getPublicUrl(fileName);

      return {
        url: urlData.publicUrl,
        type: file.type,
        name: file.name,
      };
    } catch (error: unknown) {
      console.error("Error uploading attachment:", error);
      toast({
        title: "Fejl",
        description: "Kunne ikke uploade fil",
        variant: "destructive",
      });
      return null;
    }
  };

  const startConversation = async (otherUserId: string | null, isCustomerService: boolean = false, bookingId?: string) => {
    if (!user) return null;

    try {
      // Check if conversation already exists
      let query = supabase.from("conversations").select("*");
      
      if (isCustomerService) {
        query = query
          .eq("participant_one", user.id)
          .eq("is_customer_service", true);
      } else if (otherUserId) {
        query = query
          .or(`and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        setActiveConversation(existing.id);
        await fetchMessages(existing.id);
        return existing;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          participant_one: user.id,
          participant_two: isCustomerService ? null : otherUserId,
          is_customer_service: isCustomerService,
          booking_id: bookingId || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchConversations();
      setActiveConversation(data.id);
      return data;
    } catch (error: unknown) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Fejl",
        description: "Kunne ikke starte samtale",
        variant: "destructive",
      });
      return null;
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user || !activeConversation) return;

    const channel = supabase
      .channel(`messages-${activeConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
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
  }, [user, activeConversation]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [activeConversation]);

  return {
    conversations,
    messages,
    loading,
    activeConversation,
    setActiveConversation,
    sendMessage,
    uploadAttachment,
    startConversation,
    fetchConversations,
    fetchMessages,
  };
};