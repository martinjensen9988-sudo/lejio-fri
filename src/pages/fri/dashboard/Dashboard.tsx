import React from 'react';
import { useFriAuthContext } from '@/providers/FriAuthProvider';
import { useBrand } from '@/providers/BrandContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useFriStats } from '@/hooks/useFriData';
import { useRole } from '@/hooks/useRole';
import {
  Loader2, TrendingUp, DollarSign, AlertCircle, Car, Calendar,
  Users, FileText, ArrowUpRight, Clock, CheckCircle2, Sparkles,
  Zap, Globe, Plus, BarChart3, CreditCard, Rocket, ChevronRight,
  Activity, Target, Shield
} from 'lucide-react';
import FriDashboardLayout from '@/components/fri/FriDashboardLayout';

export function FriDashboard() {
  const { user, signOut, loading, error } = useFriAuthContext();
  const { companyName } = useBrand();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useFriStats();
  const { hasAccess } = useRole();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Godmorgen';
    if (h < 18) return 'God eftermiddag';
    return 'God aften';
  };

  if (loading) {
    return (
      <FriDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center animate-pulse">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-500 font-medium">Indlæser dashboard...</p>
          </div>
        </div>
      </FriDashboardLayout>
    );
  }

  if (error) {
    return (
      <FriDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="bg-white border border-red-100 rounded-2xl p-8 max-w-md text-center shadow-lg">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-brown-900 mb-2">Noget gik galt</h2>
            <p className="text-gray-500 mb-6">{error.message}</p>
            <Button onClick={() => navigate('/fri/login')} className="bg-brown-900 hover:bg-gray-800 text-white px-6">
              Gå til login
            </Button>
          </div>
        </div>
      </FriDashboardLayout>
    );
  }

  if (!user) {
    return (
      <FriDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 max-w-md text-center shadow-lg">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-brown-900 mb-2">Log ind for at fortsætte</h2>
            <Button onClick={() => navigate('/fri/login')} className="mt-4 bg-brown-900 hover:bg-gray-800 text-white px-6">
              Gå til login
            </Button>
          </div>
        </div>
      </FriDashboardLayout>
    );
  }

  const displayName = user?.company_name || user?.email?.split('@')[0] || 'der';

  const statCards = [
    {
      label: 'Køretøjer',
      value: stats?.activeVehicles || 0,
      suffix: 'i flåden',
      icon: Car,
      gradient: 'from-blue-500 to-cyan-400',
      bgLight: 'bg-blue-50',
      path: '/fri/dashboard/vehicles',
    },
    {
      label: 'Bookinger',
      value: stats?.bookingsThisMonth || 0,
      suffix: 'denne måned',
      icon: Calendar,
      gradient: 'from-emerald-500 to-teal-400',
      bgLight: 'bg-emerald-50',
      path: '/fri/dashboard/bookings',
    },
    {
      label: 'Omsætning',
      value: `${(stats?.revenueThisMonth || 0).toLocaleString('da-DK')} kr`,
      suffix: 'denne måned',
      icon: TrendingUp,
      gradient: 'from-violet-500 to-purple-400',
      bgLight: 'bg-violet-50',
      path: '/fri/dashboard/analytics',
    },
    {
      label: 'Fakturaer',
      value: `${(stats?.outstandingInvoices || 0).toLocaleString('da-DK')} kr`,
      suffix: 'udestående',
      icon: FileText,
      gradient: 'from-amber-500 to-orange-400',
      bgLight: 'bg-amber-50',
      path: '/fri/dashboard/invoices',
    },
  ];

  const quickActions = [
    { label: 'Tilføj køretøj', icon: Car, path: '/fri/dashboard/vehicles', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100', permission: 'create-vehicle' },
    { label: 'Ny booking', icon: Plus, path: '/fri/dashboard/bookings', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100', permission: 'create-booking' },
    { label: 'Opret faktura', icon: FileText, path: '/fri/dashboard/invoices', color: 'text-violet-600 bg-violet-50 hover:bg-violet-100', permission: 'create-invoice' },
    { label: 'Lav hjemmeside', icon: Globe, path: '/dashboard/pages', color: 'text-pink-600 bg-pink-50 hover:bg-pink-100', permission: 'page-builder' },
  ].filter(a => hasAccess(a.permission));

  const navSections = [
    {
      title: 'Drift',
      items: [
        { label: 'Køretøjer', desc: 'Administrer din flåde', icon: Car, path: '/fri/dashboard/vehicles', iconColor: 'text-blue-500', permission: 'vehicles' },
        { label: 'Bookinger', desc: 'Reservationer & udlejning', icon: Calendar, path: '/fri/dashboard/bookings', iconColor: 'text-emerald-500', permission: 'bookings' },
        { label: 'Fakturaer', desc: 'Fakturering & betaling', icon: FileText, path: '/fri/dashboard/invoices', iconColor: 'text-violet-500', permission: 'invoices' },
      ].filter(i => hasAccess(i.permission))
    },
    {
      title: 'Vækst',
      items: [
        { label: 'Analytik', desc: 'Indsigt & rapporter', icon: BarChart3, path: '/fri/dashboard/analytics', iconColor: 'text-pink-500', permission: 'analytics' },
        { label: 'Team', desc: 'Medarbejdere & roller', icon: Users, path: '/fri/dashboard/team', iconColor: 'text-orange-500', permission: 'team' },
        { label: 'Betalinger', desc: 'Transaktioner & flow', icon: CreditCard, path: '/fri/dashboard/payments', iconColor: 'text-teal-500', permission: 'payments' },
      ].filter(i => hasAccess(i.permission))
    },
  ].filter(s => s.items.length > 0);

  const checklist = [
    { text: 'Opret din konto', done: true },
    { text: 'Tilføj dit første køretøj', done: (stats?.activeVehicles || 0) > 0 },
    { text: 'Opret din første booking', done: (stats?.bookingsThisMonth || 0) > 0 },
    { text: 'Inviter teammedlemmer', done: false },
    { text: 'Opsæt betalingsmetode', done: false },
    { text: 'Byg din hjemmeside', done: false },
  ];
  const completedCount = checklist.filter(s => s.done).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  return (
    <FriDashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        {/* Hero Welcome */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-10">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500 to-transparent rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-4 backdrop-blur-sm">
                <Sparkles className="w-3 h-3" />
                {new Date().toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {greeting()}, {displayName}
              </h1>
              <p className="text-gray-400 text-lg">
                Her er dit overblik over din bilutlejning.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/fri/dashboard/vehicles')}
                className="bg-white text-brown-900 hover:bg-gray-100 font-semibold shadow-lg shadow-white/10 px-5"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tilføj køretøj
              </Button>
              <Button
                onClick={() => navigate('/fri/dashboard/bookings')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 font-semibold px-5"
                size="lg"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Ny booking
              </Button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              onClick={() => navigate(card.path)}
              className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Subtle gradient accent at top */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <div>
                {statsLoading ? (
                  <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-brown-900">{card.value}</p>
                )}
                <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">{card.suffix}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Quick Actions + Navigation */}
          <div className="lg:col-span-8 space-y-6">
            {/* Quick Actions Row */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-brown-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Hurtige handlinger
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all duration-200 ${action.color}`}
                  >
                    <action.icon className="w-6 h-6" />
                    <span className="text-sm font-semibold">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Sections */}
            {navSections.map((section) => (
              <div key={section.title} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{section.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {section.items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="group flex items-start gap-3.5 p-4 rounded-xl hover:bg-gray-50 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-white flex items-center justify-center flex-shrink-0 transition-colors">
                        <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-brown-900 text-sm group-hover:text-brown-900">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Platform Promotion */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 md:p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Byg din egen hjemmeside</h3>
                    <p className="text-white/70 text-sm">Brug vores Page Builder til at lave en professionel udlejningsside</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/dashboard/pages')}
                  className="bg-white text-indigo-700 hover:bg-white/90 font-semibold shadow-lg shadow-indigo-900/20 whitespace-nowrap"
                  size="lg"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Åbn Page Builder
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Checklist + Status */}
          <div className="lg:col-span-4 space-y-6">
            {/* Getting Started Progress */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-brown-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-violet-500" />
                  Kom i gang
                </h3>
                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                  {completedCount}/{checklist.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">{progress}% gennemført</p>
              </div>

              <div className="space-y-1.5">
                {checklist.map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                      step.done ? 'opacity-60' : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      step.done
                        ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-sm'
                        : 'border-2 border-gray-200 text-gray-400'
                    }`}>
                      {step.done ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm ${step.done ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-brown-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Kontostatus
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Plan</span>
                  <span className="text-sm font-semibold text-brown-900 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Pro</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Aktiv
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Bruger</span>
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[160px]">{user?.email}</span>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => navigate('/fri/dashboard/settings')}
                  className="w-full text-sm font-semibold text-gray-500 hover:text-brown-900 transition-colors flex items-center justify-center gap-1.5"
                >
                  Administrer konto
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100 p-6">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-white shadow-sm flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                </div>
                <h4 className="font-bold text-brown-900 text-sm mb-1">Brug for hjælp?</h4>
                <p className="text-xs text-gray-500 mb-4">Kontakt os, så hjælper vi dig i gang</p>
                <button
                  className="w-full text-sm font-semibold text-violet-600 bg-white hover:bg-violet-50 border border-violet-100 rounded-xl py-2.5 transition-colors"
                  onClick={() => window.open('mailto:support@lejio.dk')}
                >
                  Kontakt support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FriDashboardLayout>
  );
}
