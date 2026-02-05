import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDunningManagement } from '@/hooks/useDunningManagement';
import { useToast } from '@/hooks/use-toast';
import { Bell, Send, X } from 'lucide-react';

interface PaymentReminderProps {
  invoiceId: string;
}

export const PaymentReminder: React.FC<PaymentReminderProps> = ({ invoiceId }) => {
  const { toast } = useToast();
  const { generateDunningSequence, sendReminder } = useDunningManagement();
  const [reminders, setReminders] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    daysBeforeDue: 7,
    daysAfterOverdue: '7,14,30',
    finalNoticeAfterDays: 45,
  });

  const handleCreateReminders = async () => {
    try {
      setIsLoading(true);
      const daysAfterOverdue = formData.daysAfterOverdue
        .split(',')
        .map(d => parseInt(d.trim()))
        .filter(d => !isNaN(d));

      const config = {
        daysBeforeDue: formData.daysBeforeDue,
        daysAfterOverdue,
        finalNoticeAfterDays: formData.finalNoticeAfterDays,
      };

      // Generate dunning sequence (this would be called from a job/webhook)
      await generateDunningSequence(invoiceId, format(new Date(), 'yyyy-MM-dd'), formData.email, config);
      
      toast({
        title: 'Succes',
        description: 'Dunning sequence created',
      });
      setShowForm(false);
      setFormData({
        email: '',
        daysBeforeDue: 7,
        daysAfterOverdue: '7,14,30',
        finalNoticeAfterDays: 45,
      });
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Failed to create reminders',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async (reminderId: string) => {
    try {
      await sendReminder(reminderId);
      toast({
        title: 'Succes',
        description: 'Reminder sent',
      });
      // Reload reminders
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Failed to send reminder',
        variant: 'destructive',
      });
    }
  };

  const reminderTypeLabels: Record<string, string> = {
    due_date: 'Payment Due',
    overdue_1: 'First Overdue Notice',
    overdue_2: 'Second Overdue Notice',
    overdue_3: 'Final Overdue Notice',
    final_notice: 'Final Notice',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Payment Reminders
          </CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="outline"
            size="sm"
          >
            {showForm ? 'Cancel' : 'Add Reminder'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Reminder Form */}
          {showForm && (
            <div className="border-t pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="renter@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Days Before Due
                  </label>
                  <input
                    type="number"
                    value={formData.daysBeforeDue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        daysBeforeDue: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Final Notice Days
                  </label>
                  <input
                    type="number"
                    value={formData.finalNoticeAfterDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        finalNoticeAfterDays: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Days After Overdue (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.daysAfterOverdue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daysAfterOverdue: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="7, 14, 30"
                />
              </div>

              <Button
                onClick={handleCreateReminders}
                disabled={isLoading || !formData.email}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Dunning Sequence'}
              </Button>
            </div>
          )}

          {/* Reminders List */}
          {reminders.length > 0 ? (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {reminderTypeLabels[reminder.reminder_type] ||
                          reminder.reminder_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        Scheduled for{' '}
                        {format(
                          new Date(reminder.scheduled_date),
                          'PPP',
                          { locale: da }
                        )}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        statusColors[reminder.status] || 'bg-gray-100'
                      }`}
                    >
                      {reminder.status}
                    </span>
                  </div>

                  {reminder.status === 'pending' && (
                    <Button
                      onClick={() => handleSendReminder(reminder.id)}
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Now
                    </Button>
                  )}

                  {reminder.sent_at && (
                    <p className="text-xs text-gray-500">
                      Sent {format(new Date(reminder.sent_at), 'PPpp', { locale: da })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No reminders scheduled yet</p>
              <p className="text-xs">Create a dunning sequence to add reminders</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
