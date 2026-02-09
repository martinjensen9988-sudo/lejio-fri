import React from 'react';
import FriDashboardLayout from '@/components/fri/FriDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertTriangle, Banknote } from 'lucide-react';

export function FriPaymentsPage() {
  // Mock data for now - will connect to API
  const stats = {
    totalRevenue: 0,
    pendingPayments: 0,
    paidThisMonth: 0,
    overdueAmount: 0,
  };

  const recentTransactions: any[] = [];

  return (
    <FriDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brown-900">Betalinger</h1>
            <p className="text-gray-500 mt-1">Oversigt over alle betalinger og transaktioner</p>
          </div>
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">
            <Banknote className="w-4 h-4 mr-2" />
            Udbetal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Omsætning</p>
                  <p className="text-2xl font-bold text-brown-900 mt-1">kr {stats.totalRevenue.toLocaleString('da-DK')}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> 0% vs. forrige måned
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Afventer Betaling</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">kr {stats.pendingPayments.toLocaleString('da-DK')}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Betalt Denne Måned</p>
                  <p className="text-2xl font-bold text-brown-900 mt-1">kr {stats.paidThisMonth.toLocaleString('da-DK')}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Forfaldne</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">kr {stats.overdueAmount.toLocaleString('da-DK')}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-brown-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-pink-500" />
              Betalingsmetoder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 hover:border-pink-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-900">Stripe</p>
                    <p className="text-xs text-gray-500">Kortbetaling</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-gray-500 border-gray-200">Ikke konfigureret</Badge>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 hover:border-pink-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-900">MobilePay</p>
                    <p className="text-xs text-gray-500">Mobilbetaling</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-gray-500 border-gray-200">Ikke konfigureret</Badge>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 hover:border-pink-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-900">Bankoverførsel</p>
                    <p className="text-xs text-gray-500">Manuel betaling</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-gray-500 border-gray-200">Ikke konfigureret</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-brown-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-500" />
              Seneste Transaktioner
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brown-900 mb-1">Ingen transaktioner endnu</h3>
                <p className="text-gray-500">Transaktioner vil vises her når du modtager betalinger</p>
              </div>
            ) : (
              <p className="text-gray-500">Transaktionsliste kommer snart...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </FriDashboardLayout>
  );
}

export default FriPaymentsPage;
