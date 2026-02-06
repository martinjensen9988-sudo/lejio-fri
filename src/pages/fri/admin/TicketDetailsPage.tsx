import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFriAdminTickets, Ticket, TicketMessage } from '@/hooks/useFriAdminTickets';
import { ChevronLeft, Send, AlertCircle, MessageSquare, Tag, Clock, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

const statusBadges = {
  open: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Åben' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'I gang' },
  resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Løst' },
  closed: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Lukket' },
};

const priorityBadges = {
  low: { bg: 'bg-gray-50', text: 'text-gray-600', label: 'Lav' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Mellem' },
  high: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Høj' },
  urgent: { bg: 'bg-red-50', text: 'text-red-600', label: 'Akut' },
};

export const FriAdminTicketDetailsPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { getTicket, getTicketMessages, replyToTicket, updateTicketStatus, updateTicketPriority } = useFriAdminTickets();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) return;

      try {
        setLoading(true);
        const ticketData = await getTicket(ticketId);
        if (ticketData) {
          setTicket(ticketData);
          const messagesData = await getTicketMessages(ticketId);
          setMessages(messagesData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fejl ved indlæsning');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  const handleReply = async () => {
    if (!replyText.trim() || !ticketId) return;

    try {
      setSending(true);
      await replyToTicket(ticketId, replyText);
      setReplyText('');
      const updatedMessages = await getTicketMessages(ticketId);
      setMessages(updatedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved afsendelse');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticketId) return;
    try {
      await updateTicketStatus(ticketId, newStatus as Ticket['status']);
      const updatedTicket = await getTicket(ticketId);
      if (updatedTicket) setTicket(updatedTicket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved opdatering');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticketId) return;
    try {
      await updateTicketPriority(ticketId, newPriority as Ticket['priority']);
      const updatedTicket = await getTicket(ticketId);
      if (updatedTicket) setTicket(updatedTicket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved opdatering');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center animate-pulse">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-400 font-medium">Indlæser ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/fri/admin/support')}
          className="gap-2 text-gray-400 hover:text-gray-700 rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" />
          Tilbage til tickets
        </Button>
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Ticket ikke fundet</AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusBadge = statusBadges[ticket.status];
  const priorityBadge = priorityBadges[ticket.priority];

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => navigate('/fri/admin/support')}
        className="gap-2 text-gray-400 hover:text-gray-700 rounded-xl"
      >
        <ChevronLeft className="w-4 h-4" />
        Tilbage til tickets
      </Button>

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h1 className="text-xl font-bold text-gray-900 mb-4">{ticket.subject}</h1>

            <div className="mb-6">
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </div>

            {/* Lessor Info */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Fra lessor</p>
              <p className="font-semibold text-gray-900">{ticket.lessor_name}</p>
              <p className="text-sm text-gray-400">{ticket.lessor_email}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Beskeder</h3>
            </div>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl ${
                      msg.sender_type === 'admin'
                        ? 'bg-violet-50 border border-violet-100'
                        : 'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm text-gray-900">
                        {msg.sender_type === 'admin' ? 'Admin' : msg.sender_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(msg.created_at), { locale: da, addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-6 text-sm">Ingen beskeder endnu</p>
              )}
            </div>

            {/* Reply Form */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <Textarea
                placeholder="Skriv dit svar her..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sending}
                rows={4}
                className="rounded-xl border-gray-200 focus:border-violet-300 focus:ring-violet-200"
              />
              <Button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md shadow-violet-200"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sender...' : 'Send svar'}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Status</p>
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusBadges).map(([key, badge]) => (
                  <SelectItem key={key} value={key}>
                    {badge.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusBadge.bg}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                <span className={`text-xs font-semibold ${statusBadge.text}`}>{statusBadge.label}</span>
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Prioritet</p>
            <Select value={ticket.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityBadges).map(([key, badge]) => (
                  <SelectItem key={key} value={key}>
                    {badge.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${priorityBadge.bg} ${priorityBadge.text}`}>
                {priorityBadge.label}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Kategori</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 capitalize ml-5">{ticket.category}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Oprettet</p>
                </div>
                <p className="text-sm text-gray-900 ml-5">
                  {new Date(ticket.created_at).toLocaleDateString('da-DK')}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Sidst opdateret</p>
                </div>
                <p className="text-sm text-gray-900 ml-5">
                  {formatDistanceToNow(new Date(ticket.updated_at), { locale: da, addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
