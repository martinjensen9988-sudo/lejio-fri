import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFriAdminTickets, Ticket, TicketMessage } from '@/hooks/useFriAdminTickets';
import { ChevronLeft, Send, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

const statusBadges = {
  open: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Åben' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'I gang' },
  resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Løst' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Lukket' },
};

const priorityBadges = {
  low: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Lav' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Mellem' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Høj' },
  urgent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Akut' },
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

      // Reload messages
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
        <div className="text-gray-500">Indlæser...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/fri/admin/support')}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Tilbage til tickets
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Ticket ikke fundet</AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusBadge = statusBadges[ticket.status];
  const priorityBadge = priorityBadges[ticket.priority];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => navigate('/fri/admin/support')}
        className="gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Tilbage til tickets
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{ticket.subject}</h1>

            <div className="space-y-4 mb-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            {/* Lessor Info */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Fra lessor</p>
              <p className="font-medium text-gray-900">{ticket.lessor_name}</p>
              <p className="text-sm text-gray-600">{ticket.lessor_email}</p>
            </div>
          </Card>

          {/* Messages */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Beskeder</h3>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.sender_type === 'admin'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">
                        {msg.sender_type === 'admin' ? '👤 Admin' : '👤 ' + msg.sender_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDistanceToNow(new Date(msg.created_at), { locale: da, addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-4">Ingen beskeder endnu</p>
              )}
            </div>

            {/* Reply Form */}
            <div className="border-t pt-4 space-y-3">
              <Textarea
                placeholder="Skriv dit svar her..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sending}
                rows={4}
              />
              <Button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className="w-full gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sender...' : 'Send svar'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-3">Status</p>
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
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
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                {statusBadge.label}
              </span>
            </div>
          </Card>

          {/* Priority */}
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-3">Prioritet</p>
            <Select value={ticket.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger>
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
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${priorityBadge.bg} ${priorityBadge.text}`}>
                {priorityBadge.label}
              </span>
            </div>
          </Card>

          {/* Info */}
          <Card className="p-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Kategori</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{ticket.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Oprettet</p>
                <p className="text-sm text-gray-900">
                  {new Date(ticket.created_at).toLocaleDateString('da-DK')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Sidst opdateret</p>
                <p className="text-sm text-gray-900">
                  {formatDistanceToNow(new Date(ticket.updated_at), { locale: da, addSuffix: true })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
