import { useState, useEffect } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface Ticket {
  id: string;
  lessor_id: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'account' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  lessor_name?: string;
  lessor_email?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'lessor' | 'admin';
  message: string;
  created_at: string;
  sender_name?: string;
}

interface UseFriAdminTicketsReturn {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  fetchTickets: (filter?: string) => Promise<void>;
  getTicket: (ticketId: string) => Promise<Ticket | null>;
  getTicketMessages: (ticketId: string) => Promise<TicketMessage[]>;
  replyToTicket: (ticketId: string, message: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => Promise<void>;
  updateTicketPriority: (ticketId: string, priority: Ticket['priority']) => Promise<void>;
}

const esc = (v: string) => v.replace(/'/g, "''");

const normalizeRows = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.recordset)) return response.recordset;
  if (Array.isArray(response.data?.recordset)) return response.data.recordset;
  return response.data ?? response;
};

export const useFriAdminTickets = (): UseFriAdminTicketsReturn => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async (filter?: string) => {
    try {
      setError(null);
      setLoading(true);
      const statusFilter = filter && filter !== 'all' ? ` WHERE t.status='${esc(filter)}'` : '';
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT t.*, l.company_name AS lessor_name, l.email AS lessor_email
                FROM fri_support_tickets t
                LEFT JOIN fri_lessors l ON t.lessor_id = l.id
                ${statusFilter}
                ORDER BY t.created_at DESC`,
        admin: true,
      });
      setTickets((normalizeRows(response) as Ticket[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved indlæsning af tickets');
    } finally {
      setLoading(false);
    }
  };

  const getTicket = async (ticketId: string): Promise<Ticket | null> => {
    try {
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT * FROM fri_support_tickets WHERE id='${esc(ticketId)}'`,
        admin: true,
      });
      const rows = normalizeRows(response) as Ticket[];
      return rows?.[0] || null;
    } catch (err) {
      console.error('Error fetching ticket:', err);
      return null;
    }
  };

  const getTicketMessages = async (ticketId: string): Promise<TicketMessage[]> => {
    try {
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT * FROM fri_ticket_messages WHERE ticket_id='${esc(ticketId)}' ORDER BY created_at ASC`,
        admin: true,
      });
      return (normalizeRows(response) as TicketMessage[]) || [];
    } catch (err) {
      console.error('Error fetching messages:', err);
      return [];
    }
  };

  const replyToTicket = async (ticketId: string, msg: string) => {
    try {
      const now = new Date().toISOString();
      await azureApi.post('/db-query', {
        query: `INSERT INTO fri_ticket_messages (ticket_id, sender_id, sender_type, message) VALUES ('${esc(ticketId)}', 'admin', 'admin', '${esc(msg)}')`,
        admin: true,
      });
      await azureApi.post('/db-query', {
        query: `UPDATE fri_support_tickets SET updated_at='${esc(now)}' WHERE id='${esc(ticketId)}'`,
        admin: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved afsendelse');
      throw err;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    try {
      const now = new Date().toISOString();
      await azureApi.post('/db-query', {
        query: `UPDATE fri_support_tickets SET status='${esc(status)}', updated_at='${esc(now)}' WHERE id='${esc(ticketId)}'`,
        admin: true,
      });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status, updated_at: now } : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved opdatering');
      throw err;
    }
  };

  const updateTicketPriority = async (ticketId: string, priority: Ticket['priority']) => {
    try {
      const now = new Date().toISOString();
      await azureApi.post('/db-query', {
        query: `UPDATE fri_support_tickets SET priority='${esc(priority)}', updated_at='${esc(now)}' WHERE id='${esc(ticketId)}'`,
        admin: true,
      });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, priority, updated_at: now } : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved opdatering');
      throw err;
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  return { tickets, loading, error, fetchTickets, getTicket, getTicketMessages, replyToTicket, updateTicketStatus, updateTicketPriority };
};
