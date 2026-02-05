import { useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface AuditLogEntry {
  action_type: 'create' | 'update' | 'delete' | 'view' | 'swap' | 'approve' | 'reject' | 'send' | 'login';
  entity_type: string;
  entity_id?: string;
  entity_identifier?: string;
  old_values?: Json;
  new_values?: Json;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Define which actions are considered critical and should alert super admins
const CRITICAL_ACTIONS: Record<string, { severity: 'high' | 'critical'; entityTypes?: string[] }> = {
  delete: { severity: 'critical', entityTypes: ['profile', 'vehicle', 'booking'] },
  swap: { severity: 'high' },
};

const CRITICAL_ENTITY_TYPES = ['profile', 'user_role'];

export const useAuditLog = () => {
  const { user } = useAuth();

  // Send critical action alert to super admins
  const sendCriticalAlert = useCallback(async (entry: AuditLogEntry, adminEmail: string, adminName?: string) => {
    try {
      const severity = entry.severity || 
        (CRITICAL_ACTIONS[entry.action_type]?.severity) ||
        (CRITICAL_ENTITY_TYPES.includes(entry.entity_type) ? 'high' : undefined);

      if (!severity) return; // Not a critical action

      const { error } = await supabase.functions.invoke('send-critical-action-alert', {
        body: {
          action_type: entry.action_type,
          entity_type: entry.entity_type,
          entity_identifier: entry.entity_identifier,
          description: entry.description,
          admin_email: adminEmail,
          admin_name: adminName,
          details: entry.new_values || entry.old_values,
          severity,
        },
      });

      if (error) {
        console.error('Failed to send critical action alert:', error);
      }
    } catch (err) {
      console.error('Critical alert error:', err);
    }
  }, []);

  const logAction = useCallback(async (entry: AuditLogEntry) => {
    if (!user) {
      console.warn('Cannot log audit action: user not authenticated');
      return;
    }

    try {
      // Log to database
      const { error } = await supabase
        .from('admin_audit_logs')
        .insert([{
          admin_user_id: user.id,
          action_type: entry.action_type,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id || null,
          entity_identifier: entry.entity_identifier || null,
          old_values: entry.old_values || null,
          new_values: entry.new_values || null,
          description: entry.description,
          user_agent: navigator.userAgent,
        }]);

      if (error) {
        console.error('Failed to create audit log:', error);
      }

      // Check if this is a critical action that should alert super admins
      const isCriticalAction = CRITICAL_ACTIONS[entry.action_type] && 
        (!CRITICAL_ACTIONS[entry.action_type].entityTypes || 
         CRITICAL_ACTIONS[entry.action_type].entityTypes!.includes(entry.entity_type));
      
      const isCriticalEntity = CRITICAL_ENTITY_TYPES.includes(entry.entity_type);
      const hasExplicitSeverity = entry.severity === 'high' || entry.severity === 'critical';

      if (isCriticalAction || isCriticalEntity || hasExplicitSeverity) {
        // Get admin profile for the alert
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', user.id)
          .single();

        if (profile?.email) {
          await sendCriticalAlert(entry, profile.email, profile.full_name || undefined);
        }
      }
    } catch (err) {
      console.error('Audit log error:', err);
    }
  }, [user, sendCriticalAlert]);

  // Convenience methods for common actions
  const logCreate = useCallback((entityType: string, entityId: string, identifier: string, description: string, newValues?: Json) => {
    return logAction({
      action_type: 'create',
      entity_type: entityType,
      entity_id: entityId,
      entity_identifier: identifier,
      new_values: newValues,
      description,
    });
  }, [logAction]);

  const logUpdate = useCallback((entityType: string, entityId: string, identifier: string, description: string, oldValues?: Json, newValues?: Json) => {
    return logAction({
      action_type: 'update',
      entity_type: entityType,
      entity_id: entityId,
      entity_identifier: identifier,
      old_values: oldValues,
      new_values: newValues,
      description,
    });
  }, [logAction]);

  const logDelete = useCallback((entityType: string, entityId: string, identifier: string, description: string, oldValues?: Json) => {
    return logAction({
      action_type: 'delete',
      entity_type: entityType,
      entity_id: entityId,
      entity_identifier: identifier,
      old_values: oldValues,
      description,
      severity: 'critical', // Deletions are always critical
    });
  }, [logAction]);

  const logSwap = useCallback((bookingId: string, description: string, details: Json) => {
    return logAction({
      action_type: 'swap',
      entity_type: 'vehicle_swap',
      entity_id: bookingId,
      new_values: details,
      description,
      severity: 'high', // Vehicle swaps are high priority
    });
  }, [logAction]);

  // Explicit critical action logging
  const logCriticalAction = useCallback((
    actionType: AuditLogEntry['action_type'],
    entityType: string, 
    entityId: string, 
    identifier: string, 
    description: string, 
    values?: Json
  ) => {
    return logAction({
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      entity_identifier: identifier,
      new_values: values,
      description,
      severity: 'critical',
    });
  }, [logAction]);

  return {
    logAction,
    logCreate,
    logUpdate,
    logDelete,
    logSwap,
    logCriticalAction,
  };
};
