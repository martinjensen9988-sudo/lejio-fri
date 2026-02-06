import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useFriAdminTickets } from '@/hooks/useFriAdminTickets';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronRight, MessageSquare, Clock, Inbox, ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';

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
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center animate-pulse">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-400 font-medium">Indlæser tickets...</p>
        </div>
      </div>
    );
  }

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const unreadCount = tickets.filter(t => t.status === 'open').length;

  const filterTabs = [
    { key: 'all', label: 'Alle' },
    { key: 'open', label: 'Åbne' },
    { key: 'in_progress', label: 'I gang' },
    { key: 'resolved', label: 'Løst' },
    { key: 'closed', label: 'Lukket' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-200">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                  {unreadCount} nye
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">Administrer support tickets fra lessors</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 bg-gray-100/50 p-1 rounded-xl w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'I alt', value: tickets.length, gradient: 'from-violet-500 to-indigo-500' },
          { label: 'Åbne', value: tickets.filter(t => t.status === 'open').length, gradient: 'from-blue-500 to-cyan-400' },
          { label: 'I gang', value: tickets.filter(t => t.status === 'in_progress').length, gradient: 'from-amber-500 to-orange-400' },
          { label: 'Løst', value: tickets.filter(t => t.status === 'resolved').length, gradient: 'from-emerald-500 to-teal-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <Inbox className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {filteredTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 border-b border-gray-100">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emne</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lessor</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prioritet</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Opdateret</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Handling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => {
                  const statusBadge = statusBadges[ticket.status];
                  const priorityBadge = priorityBadges[ticket.priority];

                  return (
                    <TableRow key={ticket.id} className="hover:bg-violet-50/30 transition-colors border-b border-gray-50">
                      <TableCell className="font-semibold text-gray-900 max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900">{ticket.lessor_name}</div>
                        <div className="text-xs text-gray-400">{ticket.lessor_email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 capitalize">{ticket.category}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${priorityBadge.bg} ${priorityBadge.text}`}>
                          {priorityBadge.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusBadge.bg}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                          <span className={`text-xs font-semibold ${statusBadge.text}`}>{statusBadge.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDistanceToNow(new Date(ticket.updated_at), { locale: da })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/fri/admin/support/${ticket.id}`)}
                          className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg gap-1"
                        >
                          Detaljer
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">Ingen tickets fundet</p>
          </div>
        )}
      </div>
    </div>
  );
};
