import { ShieldCheck, BadgePercent, Globe, MessagesSquare, Car, FileText, Sparkles, Wrench, CalendarRange, CreditCard } from 'lucide-react';

const modules = [
  {
    name: 'Finansiering',
    description: 'Ansogninger, status og integrationer til bilfinansiering.',
    status: 'Tilkoeb',
    icon: CreditCard,
  },
  {
    name: 'Bilsalg Skilte',
    description: 'Printklar A4/A5 skilte med QR og salgsinfo.',
    status: 'Tilkoeb',
    icon: BadgePercent,
  },
  {
    name: 'Trade-in / Byttebil',
    description: 'Vurdering, tilbud og historik pa byttebiler.',
    status: 'Tilkoeb',
    icon: Car,
  },
  {
    name: 'Forsikring',
    description: 'Tilbud og dokumentation til forsikringspakker.',
    status: 'Tilkoeb',
    icon: ShieldCheck,
  },
  {
    name: 'Garanti-pakker',
    description: 'Udvidet garanti og vilkar til bilsalg.',
    status: 'Tilkoeb',
    icon: ShieldCheck,
  },
  {
    name: 'Kreditvurdering',
    description: 'KYC/AML og score flow for finansiering.',
    status: 'Tilkoeb',
    icon: Sparkles,
  },
  {
    name: 'Kontrakter',
    description: 'E-sign og automatisk faktura efter signering.',
    status: 'Tilkoeb',
    icon: FileText,
  },
  {
    name: 'Leveringsplan',
    description: 'Afhentning/levering med checkliste og status.',
    status: 'Tilkoeb',
    icon: CalendarRange,
  },
  {
    name: 'Service & Klargoring',
    description: 'Opgaver for klargoring og levering.',
    status: 'Tilkoeb',
    icon: Wrench,
  },
  {
    name: 'Leasing-beregner',
    description: 'Ydelse, udbetaling og lobetid.',
    status: 'Tilkoeb',
    icon: CreditCard,
  },
  {
    name: 'Lead-tracking (CRM)',
    description: 'Salgsflow, paamindelser og pipeline.',
    status: 'Tilkoeb',
    icon: MessagesSquare,
  },
  {
    name: 'Annonce-synk',
    description: 'Eksport til Bilbasen/DBA og portaler.',
    status: 'Tilkoeb',
    icon: Globe,
  },
];

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  Aktiv: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  Tilkoeb: { bg: 'bg-amber-500/15', text: 'text-amber-200', border: 'border-amber-400/40' },
  Beta: { bg: 'bg-violet-500/15', text: 'text-violet-200', border: 'border-violet-400/40' },
};

export const FriAdminModulesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown-900">Moduler</h1>
          <p className="text-sm text-gray-500">Tilkobsmoduler og udvidelser for kunder.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const style = statusStyles[mod.status] || statusStyles.Tilkoeb;
          return (
            <div
              key={mod.name}
              className="relative rounded-2xl border border-amber-400/60 bg-gray-950 text-gray-100 p-5 shadow-sm shadow-amber-500/10 hover:shadow-amber-400/20 transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400/15 to-amber-200/5 border border-amber-400/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-amber-200" />
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                  {mod.status}
                </span>
              </div>

              <h3 className="text-base font-semibold mt-4 text-white">{mod.name}</h3>
              <p className="text-sm text-gray-400 mt-2">{mod.description}</p>

              <div className="mt-4 flex items-center gap-2 text-xs text-amber-200/80">
                <span className="inline-flex w-2 h-2 rounded-full bg-amber-300/70" />
                Tilkob klar - kan aktiveres pr. kunde
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
