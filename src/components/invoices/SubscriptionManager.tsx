import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscriptionBilling } from '@/hooks/useSubscriptionBilling';
import { useToast } from '@/hooks/use-toast';
import { Pause, Play, Trash2, Plus } from 'lucide-react';

interface SubscriptionManagerProps {
  renterId?: string;
  vehicleId?: string;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  renterId,
  vehicleId,
}) => {
  const { toast } = useToast();
  const {
    createSubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    getUpcomingBillings,
  } = useSubscriptionBilling();
  const [subscriptions, setSubscriptions] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subscriptionType: 'monthly',
    dailyRate: '',
    totalBillingCycles: '',
    paymentMethod: 'credit_card',
    autoRenew: true,
  });

  useEffect(() => {
    loadSubscriptions();
  }, [renterId, vehicleId]);

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      const upcoming = await getUpcomingBillings();
      setSubscriptions(upcoming || []);
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Failed to load subscriptions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    try {
      if (!formData.dailyRate || parseFloat(formData.dailyRate) <= 0) {
        toast({
          title: 'Fejl',
          description: 'Please enter a valid daily rate',
          variant: 'destructive',
        });
        return;
      }

      if (!renterId || !vehicleId) {
        toast({
          title: 'Fejl',
          description: 'Missing renter or vehicle information',
          variant: 'destructive',
        });
        return;
      }

      const data: unknown = {
        vehicle_id: vehicleId,
        renter_id: renterId,
        subscription_type: formData.subscriptionType as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
        daily_rate: parseFloat(formData.dailyRate),
        start_date: format(new Date(), 'yyyy-MM-dd'),
        total_billing_cycles: formData.totalBillingCycles
          ? parseInt(formData.totalBillingCycles)
          : undefined,
        auto_renew: formData.autoRenew,
        payment_method: formData.paymentMethod,
      };

      await createSubscription(data);
      toast({
        title: 'Succes',
        description: 'Subscription created',
      });
      setShowForm(false);
      setFormData({
        subscriptionType: 'monthly',
        dailyRate: '',
        totalBillingCycles: '',
        paymentMethod: 'credit_card',
        autoRenew: true,
      });
      loadSubscriptions();
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Failed to create subscription',
        variant: 'destructive',
      });
    }
  };

  const handlePauseSubscription = async (subscriptionId: string) => {
    try {
      await pauseSubscription(subscriptionId);
      toast({
        title: 'Succes',
        description: 'Subscription paused',
      });
      loadSubscriptions();
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Failed to pause subscription',
        variant: 'destructive',
      });
    }
  };

  const handleResumeSubscription = async (subscriptionId: string) => {
    try {
      await resumeSubscription(subscriptionId);
      toast({
        title: 'Succes',
        description: 'Subscription resumed',
      });
      loadSubscriptions();
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Failed to resume subscription',
        variant: 'destructive',
      });
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to cancel this subscription?'
      )
    ) {
      return;
    }

    try {
      await cancelSubscription(subscriptionId);
      toast({
        title: 'Succes',
        description: 'Subscription cancelled',
      });
      loadSubscriptions();
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  };

  const subscriptionTypeLabels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Subscriptions</CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Subscription
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Subscription Form */}
          {showForm && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subscription Type
                  </label>
                  <select
                    value={formData.subscriptionType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subscriptionType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Daily Rate (DKK)
                  </label>
                  <input
                    type="number"
                    value={formData.dailyRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyRate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobilepay">MobilePay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Billing Cycles (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.totalBillingCycles}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalBillingCycles: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.autoRenew}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      autoRenew: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Auto-renew after last cycle</span>
              </label>

              <Button
                onClick={handleCreateSubscription}
                className="w-full"
              >
                Create Subscription
              </Button>
            </div>
          )}

          {/* Subscriptions List */}
          {subscriptions.length > 0 ? (
            <div className="space-y-3">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {subscriptionTypeLabels[subscription.subscription_type]}
                      </p>
                      <p className="text-sm text-gray-500">
                        {subscription.daily_rate.toFixed(2)} DKK/day
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        statusColors[subscription.status] || 'bg-gray-100'
                      }`}
                    >
                      {subscription.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Billing Amount</p>
                      <p className="font-medium">
                        {subscription.billing_amount.toFixed(2)} DKK
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Next Billing</p>
                      <p className="font-medium">
                        {subscription.next_billing_date
                          ? format(
                              new Date(subscription.next_billing_date),
                              'PPP',
                              { locale: da }
                            )
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {subscription.total_billing_cycles && (
                    <div className="text-sm">
                      <p className="text-gray-500">Progress</p>
                      <p className="font-medium">
                        {subscription.completed_billing_cycles} /{' '}
                        {subscription.total_billing_cycles} cycles
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 border-t pt-3">
                    {subscription.status === 'active' && (
                      <Button
                        onClick={() =>
                          handlePauseSubscription(subscription.id)
                        }
                        variant="outline"
                        size="sm"
                        className="gap-1 flex-1"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </Button>
                    )}
                    {subscription.status === 'paused' && (
                      <Button
                        onClick={() =>
                          handleResumeSubscription(subscription.id)
                        }
                        variant="outline"
                        size="sm"
                        className="gap-1 flex-1"
                      >
                        <Play className="w-4 h-4" />
                        Resume
                      </Button>
                    )}
                    {subscription.status !== 'cancelled' && (
                      <Button
                        onClick={() =>
                          handleCancelSubscription(subscription.id)
                        }
                        variant="outline"
                        size="sm"
                        className="gap-1 flex-1 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No subscriptions yet</p>
              <p className="text-xs">Create a new subscription to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
