import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFriAdminTickets } from '@/hooks/useFriAdminTickets';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronRight, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';

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

export const FriAdminTicketsPage = () => {
  const navigate = useNavigate();
  const { tickets, loading, fetchTickets } = useFriAdminTickets();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTickets(filter);
  }, [filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Indlæser tickets...</div>
      </div>
    );
  }

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const unreadCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              {unreadCount} nye
            </span>
          )}
        </div>
        <p className="text-gray-600 mt-1">Administrer support tickets fra lessors</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status === 'all' ? 'Alle' : statusBadges[status as keyof typeof statusBadges]?.label}
          </Button>
        ))}
      </div>

      {/* Tickets Table */}
      <Card>
        {filteredTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Emne</TableHead>
                  <TableHead>Lessor</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Prioritet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sidst opdateret</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => {
                  const statusBadge = statusBadges[ticket.status];
                  const priorityBadge = priorityBadges[ticket.priority];

                  return (
                    <TableRow key={ticket.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell className="text-sm">
                        <div>{ticket.lessor_name}</div>
                        <div className="text-gray-600">{ticket.lessor_email}</div>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{ticket.category}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${priorityBadge.bg} ${priorityBadge.text}`}>
                          {priorityBadge.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(new Date(ticket.updated_at), { locale: da })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/fri/admin/support/${ticket.id}`)}
                          className="inline-flex items-center gap-1"
                        >
                          Se detaljer
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Ingen tickets fundet</p>
          </div>
        )}
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">I alt</p>
          <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Åbne</p>
          <p className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.status === 'open').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">I gang</p>
          <p className="text-2xl font-bold text-yellow-600">{tickets.filter(t => t.status === 'in_progress').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Løst</p>
          <p className="text-2xl font-bold text-green-600">{tickets.filter(t => t.status === 'resolved').length}</p>
        </Card>
      </div>
    </div>
  );
};
