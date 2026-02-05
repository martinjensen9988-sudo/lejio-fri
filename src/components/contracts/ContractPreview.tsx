import { Contract } from '@/hooks/useContracts';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { VehicleDamageMap } from './VehicleDamageMap';
import { DamageReport } from '@/hooks/useDamageReports';
import { Car, User, Calendar, CreditCard, Shield, Fuel, Phone, FileText, PenLine, AlertTriangle, Clock } from 'lucide-react';
import { CheckinQrCode } from '@/components/checkinout/CheckinQrCode';

interface ContractPreviewProps {
  contract: Contract;
  pickupDamageReport?: DamageReport | null;
  returnDamageReport?: DamageReport | null;
}

const ContractPreview = ({ contract, pickupDamageReport, returnDamageReport }: ContractPreviewProps) => {
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'd. MMMM yyyy', { locale: da });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(amount);
  };

  // QR-kode check-in URL (kan tilpasses til booking eller kontrakt-id)
  const checkinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/checkin/${contract.id}`;

  return (
    <div className="bg-white text-gray-900 font-sans max-w-4xl mx-auto print:max-w-none">
      {/* Professional Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90 text-white rounded-t-xl p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-5">
            {contract.logo_url ? (
              <div className="bg-white rounded-xl p-3 shadow-lg">
                <img 
                  src={contract.logo_url} 
                  alt="Virksomhedslogo" 
                  className="h-14 max-w-[180px] object-contain"
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl px-5 py-3 shadow-lg">
                <span className="text-3xl font-black text-primary tracking-tight">LEJIO</span>
              </div>
            )}
            {/* QR-kode check-in */}
            <div className="ml-6 flex flex-col items-center">
              <span className="text-xs text-white/80 mb-1">QR-kode til selv-check-in</span>
              <CheckinQrCode checkinUrl={checkinUrl} />
              {contract.checkin_pin && (
                <div className="mt-2 text-xs text-white/90 bg-primary/60 rounded px-2 py-1 font-mono tracking-widest">
                  PIN-kode: <span className="font-bold">{contract.checkin_pin}</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Lejekontrakt</h1>
              <p className="text-white/80 text-sm mt-1">Billejeaftale mellem udlejer og lejer</p>
            </div>
          </div>
          
          <div className="text-right bg-white/10 backdrop-blur-sm rounded-lg px-5 py-3">
            <p className="text-xs text-white/70 uppercase tracking-wider">Kontrakt nr.</p>
            <p className="text-xl font-bold font-mono">{contract.contract_number}</p>
            <p className="text-xs text-white/70 mt-2">{formatDate(contract.created_at)}</p>
          </div>
        </div>
      </header>

      <div className="border-x border-b border-gray-200 rounded-b-xl">
        {/* Two Column Layout for Parties */}
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Udlejer */}
          <section className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Udlejer</h2>
            </div>
            <div className="space-y-2 text-sm">
              <InfoRow label="Navn" value={contract.lessor_name} />
              {contract.lessor_company_name && (
                <InfoRow label="Virksomhed" value={contract.lessor_company_name} />
              )}
              {contract.lessor_cvr && (
                <InfoRow label="CVR" value={contract.lessor_cvr} mono />
              )}
              <InfoRow label="Email" value={contract.lessor_email} />
              {contract.lessor_phone && (
                <InfoRow label="Telefon" value={contract.lessor_phone} />
              )}
              {contract.lessor_address && (
                <InfoRow label="Adresse" value={contract.lessor_address} />
              )}
            </div>
          </section>

          {/* Lejer */}
          <section className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Lejer</h2>
            </div>
            <div className="space-y-2 text-sm">
              <InfoRow label="Navn" value={contract.renter_name} />
              {contract.renter_birth_date && (
                <InfoRow label="Fødselsdato" value={formatDate(contract.renter_birth_date)} />
              )}
              <InfoRow label="Email" value={contract.renter_email || 'Afventer'} />
              {contract.renter_phone && (
                <InfoRow label="Telefon" value={contract.renter_phone} />
              )}
              {(contract.renter_address || (contract.renter_street_address && contract.renter_postal_code && contract.renter_city)) && (
                <InfoRow 
                  label="Adresse" 
                  value={contract.renter_address || `${contract.renter_street_address}, ${contract.renter_postal_code} ${contract.renter_city}`} 
                />
              )}
              {contract.renter_license_number && (
                <InfoRow label="Kørekort nr." value={contract.renter_license_number} mono highlight />
              )}
              {contract.renter_license_country && (
                <InfoRow label="Kørekort land" value={contract.renter_license_country} />
              )}
              {contract.renter_license_issue_date && (
                <InfoRow label="Kørekort udstedt" value={formatDate(contract.renter_license_issue_date)} />
              )}
            </div>
          </section>
        </div>

        {/* Vehicle Section */}
        <section className="border-t border-gray-200 p-6 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Car className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Køretøj</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Registrering</p>
              <p className="text-2xl font-bold font-mono text-primary">{contract.vehicle_registration}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mærke & Model</p>
              <p className="text-lg font-semibold">{contract.vehicle_make} {contract.vehicle_model}</p>
              {contract.vehicle_year && (
                <p className="text-sm text-gray-500">Årgang {contract.vehicle_year}</p>
              )}
            </div>
            {contract.vehicle_value && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Køretøjets værdi</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(contract.vehicle_value)}</p>
              </div>
            )}
          </div>
          
          {contract.vehicle_vin && (
            <div className="mt-3 text-sm">
              <span className="text-gray-500">Stelnummer (VIN):</span>
              <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{contract.vehicle_vin}</span>
            </div>
          )}
        </section>

        {/* Period and Pricing */}
        <section className="border-t border-gray-200 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Period */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Lejeperiode</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Fra</p>
                  <p className="text-lg font-semibold mt-1">{formatDate(contract.start_date)}</p>
                  {(contract).pickup_time && (
                    <p className="text-sm text-primary font-medium mt-1">kl. {(contract).pickup_time}</p>
                  )}
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Til</p>
                  <p className="text-lg font-semibold mt-1">{formatDate(contract.end_date)}</p>
                  {(contract).dropoff_time && (
                    <p className="text-sm text-destructive font-medium mt-1">senest kl. {(contract).dropoff_time}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Priser</h2>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  <PriceRow label="Dagspris" value={formatCurrency(contract.daily_price)} sublabel="inkl. moms" />
                  <PriceRow label={`Inkluderet km/dag`} value={contract.included_km === 0 ? 'Ubegrænset' : `${contract.included_km} km`} />
                  {contract.included_km > 0 && (
                    <PriceRow label="Pris pr. overkørt km" value={`${contract.extra_km_price} kr`} />
                  )}
                  {contract.deductible_insurance_selected && contract.deductible_insurance_price && contract.deductible_insurance_price > 0 && (
                    <PriceRow label="Nul-selvrisiko forsikring" value={formatCurrency(contract.deductible_insurance_price)} sublabel="tilkøbt" />
                  )}
                  {contract.deposit_amount && contract.deposit_amount > 0 && (
                    <PriceRow label="Depositum" value={formatCurrency(contract.deposit_amount)} sublabel="refunderes ved aflevering" />
                  )}
                </div>
                <div className="bg-primary/5 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Lejepris</span>
                    <span className="font-medium">{formatCurrency(contract.total_price)}</span>
                  </div>
                  {contract.deposit_amount && contract.deposit_amount > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">+ Depositum</span>
                      <span className="font-medium">{formatCurrency(contract.deposit_amount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total at betale</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency((contract.total_price || 0) + (contract.deposit_amount || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Insurance & Roadside */}
        <section className="border-t border-gray-200 p-6 bg-blue-50/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Forsikring & Vejhjælp</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Selvrisiko</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(contract.deductible_amount)}</p>
            </div>
            {contract.insurance_company && (
              <div className="bg-white rounded-xl p-4 border border-blue-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Forsikringsselskab</p>
                <p className="font-semibold">{contract.insurance_company}</p>
              </div>
            )}
            {contract.roadside_assistance_provider && (
              <div className="bg-white rounded-xl p-4 border border-blue-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vejhjælp</p>
                <p className="font-semibold">{contract.roadside_assistance_provider}</p>
                {contract.roadside_assistance_phone && (
                  <p className="font-mono text-sm text-emerald-600">{contract.roadside_assistance_phone}</p>
                )}
              </div>
            )}
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span><strong>Bemærk:</strong> Stenslag og udskiftning af ruder er ikke dækket af forsikringen og betales af lejer.</span>
            </p>
          </div>
        </section>

        {/* Damage Section */}
        <section className="border-t border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Car className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Tilstandsrapport</h2>
          </div>
          
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <VehicleDamageMap
                title="Ved udlevering"
                damages={pickupDamageReport?.damage_items || []}
              />
              <VehicleDamageMap
                title="Ved indlevering"
                damages={returnDamageReport?.damage_items || []}
              />
            </div>
            
            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-medium mb-3">Forklaring på skadestyper:</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <LegendItem color="bg-yellow-400" label="R" text="Ridse" />
                <LegendItem color="bg-orange-500" label="B" text="Bule" />
                <LegendItem color="bg-red-500" label="C" text="Revne" />
                <LegendItem color="bg-purple-500" label="P" text="Plet" />
                <span className="text-gray-400">|</span>
                <LegendItem color="bg-yellow-400" label="" text="Mindre" />
                <LegendItem color="bg-orange-500" label="" text="Moderat" />
                <LegendItem color="bg-red-500" label="" text="Alvorlig" />
              </div>
            </div>
          </div>
        </section>

        {/* Roadside Assistance - Standalone section removed, now part of Insurance section */}

        {/* Fuel Policy */}
        {contract.fuel_policy_enabled && (
          <section className="border-t border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Fuel className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Brændstofpolitik</h2>
            </div>
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <p className="text-sm text-gray-700 mb-4">
                Køretøjet udleveres med fuld tank og skal afleveres med fuld tank. Såfremt tanken ikke er fyldt ved aflevering, gælder følgende gebyrer:
              </p>
              <div className="grid grid-cols-2 gap-4">
                {contract.fuel_missing_fee && contract.fuel_missing_fee > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-amber-200">
                    <p className="text-xs text-gray-500 mb-1">Fast gebyr</p>
                    <p className="text-xl font-bold">{formatCurrency(contract.fuel_missing_fee)}</p>
                  </div>
                )}
                {contract.fuel_price_per_liter && contract.fuel_price_per_liter > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-amber-200">
                    <p className="text-xs text-gray-500 mb-1">Pris pr. liter</p>
                    <p className="text-xl font-bold">{formatCurrency(contract.fuel_price_per_liter)}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Cleaning Fees */}
        {((contract.exterior_cleaning_fee && contract.exterior_cleaning_fee > 0) || 
          (contract.interior_cleaning_fee && contract.interior_cleaning_fee > 0)) && (
          <section className="border-t border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Car className="w-4 h-4 text-cyan-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Rengøringsgebyrer</h2>
            </div>
            <div className="bg-cyan-50 rounded-xl p-5 border border-cyan-200">
              <p className="text-sm text-gray-700 mb-4">
                Køretøjet skal afleveres rent både udvendigt og indvendigt. Følgende gebyrer opkræves ved manglende rengøring:
              </p>
              <div className="grid grid-cols-2 gap-4">
                {contract.exterior_cleaning_fee && contract.exterior_cleaning_fee > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-cyan-200">
                    <p className="text-xs text-gray-500 mb-1">Udvendig rengøring</p>
                    <p className="text-xl font-bold">{formatCurrency(contract.exterior_cleaning_fee)}</p>
                  </div>
                )}
                {contract.interior_cleaning_fee && contract.interior_cleaning_fee > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-cyan-200">
                    <p className="text-xs text-gray-500 mb-1">Indvendig rengøring</p>
                    <p className="text-xl font-bold">{formatCurrency(contract.interior_cleaning_fee)}</p>
                    <p className="text-xs text-gray-400">Maks. 1.500 kr</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Late Return Fee */}
        {(contract).late_return_fee_enabled !== false && (contract).dropoff_time && (
          <section className="border-t border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Sen aflevering</h2>
            </div>
            <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
              <p className="text-sm text-gray-700 mb-3">
                Køretøjet skal afleveres senest <strong>kl. {(contract).dropoff_time}</strong> på slutdagen.
              </p>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <p className="text-xs text-gray-500 mb-1">Gebyr ved sen aflevering</p>
                <p className="text-xl font-bold text-orange-600">1 ekstra lejedag ({formatCurrency(contract.daily_price)})</p>
                <p className="text-xs text-gray-500 mt-1">Opkræves hvis køretøjet afleveres efter det aftalte tidspunkt</p>
              </div>
            </div>
          </section>
        )}

        {/* Terms Section */}
        <section className="border-t border-gray-200 p-6 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Vilkår & Betingelser</h2>
          </div>
          
          <div className="space-y-4 text-sm text-gray-600">
            <TermsSection title="Førerforhold">
              Bilen må kun føres af lejer og personer over 23 år i lejers husstand med gyldigt kørekort. Bilen må kun anvendes i Danmark medmindre andet er aftalt.
            </TermsSection>
            
            <TermsSection title="Service & Vedligeholdelse">
              Ved lejeperioder under 30 dage påhviler det udlejer at sikre, at køretøjet er serviceret og synet. Ved lejeperioder over 30 dage er lejer ansvarlig for, at bilen får gennemført regelmæssige services og syn efter aftale med udlejer. Lejer skal altid vedligeholde bilen i god stand.
            </TermsSection>
            
            <TermsSection title="Tilbagelevering & Depositum">
              Tilbagelevering skal ske senest kl. 15.00 på kontraktens sidste dag. Bilen afleveres rengjort og med fuld tank. Det indbetalte depositum refunderes senest 8 hverdage efter indlevering, forudsat at der ikke er konstateret skader, mangler eller ubetalte gebyrer/bøder.
            </TermsSection>
          </div>
        </section>

        {/* Fees Section */}
        <section className="border-t border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-rose-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Gebyrer</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rygning i køretøjet</p>
              <p className="text-xl font-bold text-rose-700">5.000 kr.</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Manglende brændstof</p>
              <p className="text-lg font-bold text-amber-700">250 kr. + literpris</p>
              <p className="text-xs text-gray-500">(18,50 kr./liter)</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ubetalte p-bøder</p>
              <p className="text-lg font-bold text-orange-700">Bøde + 500 kr.</p>
              <p className="text-xs text-gray-500">i administrationsgebyr</p>
            </div>
          </div>
        </section>

        {/* Reckless Driving Warning */}
        <section className="border-t border-gray-200 p-6 bg-red-50/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-red-700">Vanvidskørsel</h2>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-red-200">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Ved lejers underskrift, erklærer lejer, at lejer – og dem lejer måtte overlade bilen til – ikke tidligere har kørt, eller vil køre i denne bil, på en måde, der kan karakteriseres som vanvidskørsel, jf. færdselslovens § 133a.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              <strong>Lejer accepterer personligt det fulde erstatningsansvar ved konfiskation af bilen som følge af vanvidskørsel.</strong>
            </p>
            {contract.vanvidskørsel_liability_amount && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200 flex justify-between items-center">
                <span className="font-medium text-red-700">Erstatningsansvar ved konfiskation</span>
                <span className="text-2xl font-bold text-red-700">{formatCurrency(contract.vanvidskørsel_liability_amount)}</span>
              </div>
            )}
            {contract.vanvidskørsel_accepted && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-xs">✓</div>
                <span className="font-medium">Accepteret af lejer</span>
              </div>
            )}
          </div>
        </section>

        {/* Signatures */}
        <section className="border-t border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <PenLine className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Underskrifter</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <SignatureBox
              title="Udlejer"
              name={contract.lessor_name}
              signature={contract.lessor_signature}
              signedAt={contract.lessor_signed_at}
            />
            <SignatureBox
              title="Lejer"
              name={contract.renter_name}
              signature={contract.renter_signature}
              signedAt={contract.renter_signed_at}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-gray-50 rounded-b-xl p-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">LEJIO</span>
              <span>•</span>
              <a href="https://www.lejio.dk" className="hover:text-primary transition-colors">www.lejio.dk</a>
            </div>
            <div>
              Kontrakt nr. {contract.contract_number}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Helper Components
const InfoRow = ({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-gray-500">{label}</span>
    <span className={`font-medium ${mono ? 'font-mono text-sm' : ''} ${highlight ? 'bg-primary/10 text-primary px-2 py-0.5 rounded' : ''}`}>
      {value}
    </span>
  </div>
);

const PriceRow = ({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) => (
  <div className="flex justify-between items-center px-4 py-3">
    <span className="text-gray-600">{label}</span>
    <div className="text-right">
      <span className="font-medium">{value}</span>
      {sublabel && <span className="text-xs text-gray-400 ml-1">{sublabel}</span>}
    </div>
  </div>
);

const LegendItem = ({ color, label, text }: { color: string; label: string; text: string }) => (
  <div className="flex items-center gap-1.5">
    <span className={`w-4 h-4 rounded-full ${color} flex items-center justify-center text-white text-[9px] font-bold`}>
      {label}
    </span>
    <span className="text-gray-600">{text}</span>
  </div>
);

const TermsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200">
    <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
    <div className="text-gray-600 leading-relaxed">{children}</div>
  </div>
);

const SignatureBox = ({ title, name, signature, signedAt }: { 
  title: string; 
  name: string; 
  signature?: string | null; 
  signedAt?: string | null;
}) => (
  <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
    <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>
    {signature ? (
      <div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
          <img src={signature} alt={`${title} underskrift`} className="h-16 object-contain mx-auto" />
        </div>
        <p className="font-medium text-gray-900">{name}</p>
        {signedAt && (
          <p className="text-xs text-gray-500 mt-1">
            {format(new Date(signedAt), "d. MMM yyyy 'kl.' HH:mm", { locale: da })}
          </p>
        )}
      </div>
    ) : (
      <div>
        <div className="h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3">
          <p className="text-sm text-gray-400 italic">Afventer underskrift</p>
        </div>
        <p className="font-medium text-gray-400">{name}</p>
      </div>
    )}
  </div>
);

export default ContractPreview;
