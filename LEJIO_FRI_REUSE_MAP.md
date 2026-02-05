# Lejio → Lejio Fri: Genbrugskort (funktioner/hooks)

**Mål:** Genbrug logik/UI fra Lejio, men **erstat altid data‑layer med Azure API** for Fri. **Ingen Supabase i Fri.**

## 1) Stærkt genbrug (UI + forretningslogik, men udskift data‑layer)

### Flådestyring
- **Hooks (Lejio):**
  - `src/hooks/useVehicles.tsx`
  - `src/hooks/useVehicleImages.tsx`
  - `src/hooks/useVehicleLookup.tsx`
  - `src/hooks/useVehicleBookedDates.tsx`
- **Fri mål‑hooks:**
  - `src/hooks/useFriVehicles.tsx` (mål)
- **Genbrug:** UI‑felter, validation, model‑felter, sortering/filtering, computed fields.
- **Erstat:** Supabase calls → `azureApi` (Fri).

### Bookinger & kalender
- **Hooks (Lejio):**
  - `src/hooks/useBookings.tsx`
  - `src/hooks/useRecurringRentals.tsx`
  - `src/hooks/useCalendarIntegration.tsx`
- **Fri mål‑hooks:**
  - `src/hooks/useFriBookings.tsx`
- **Genbrug:** booking‑beregninger (dage, pris), status‑flow, kalender‑logik.
- **Erstat:** Supabase → Azure API endpoints.

### Faktura & betaling
- **Hooks (Lejio):**
  - `src/hooks/useInvoices.tsx`
  - `src/hooks/usePayments.tsx`
  - `src/hooks/useInvoiceGeneration.tsx`
  - `src/hooks/usePaymentSettings.tsx`
- **Fri mål‑hooks:**
  - `src/hooks/useFriInvoices.tsx`
  - `src/hooks/useFriPayments.tsx`
- **Genbrug:** beregning af totals, status transitions, PDF‑logik (UI), formattering.
- **Erstat:** Supabase → Azure API.

### Team & roller
- **Hooks (Lejio):**
  - `src/hooks/useCRM.tsx`
  - `src/hooks/useCRMCommunication.tsx`
  - `src/hooks/useAuditLog.tsx`
- **Fri mål:** `src/hooks/useFriTeam.tsx` + admin‑views
- **Genbrug:** UI‑flows (invite, role), tabel‑logik, audit‑format.
- **Erstat:** Supabase → Azure API.

### Skader & inspektion
- **Hooks (Lejio):**
  - `src/hooks/useDamageReports.tsx`
  - `src/hooks/useCheckInOut.tsx`
  - `src/hooks/useDriverLicense.tsx`
  - `src/hooks/useDriverLicenseStatus.tsx`
- **Fri mål:** Nye Fri‑hooks (planlagt)
- **Genbrug:** UI‑flows, status‑maskiner, fil‑upload interface.
- **Erstat:** Supabase storage → Azure Blob (via `uploadFile`).

### Analytik
- **Hooks (Lejio):**
  - `src/hooks/useAnalytics.tsx`
  - `src/hooks/useRevenueLoss.tsx`
  - `src/hooks/useRevenueRecognition.tsx`
- **Fri mål:** `src/hooks/useFriAnalytics.tsx`
- **Genbrug:** aggregationslogik, graf‑datastrukturering.
- **Erstat:** Supabase → Azure API.

## 2) Delvist genbrug (UI‑komponenter først)

### Komponenter (UI) der kan genbruges direkte
- `src/components/booking/*`
- `src/components/invoices/*`
- `src/components/checkinout/*`
- `src/components/damage/*`
- `src/components/reports/*`
- `src/components/dashboard/*` (udvalgte kort & tabeller)

> **Note:** UI kan genbruges, men props bør tilpasses Fri‑data (lessor_id‑isolation).

## 3) Ikke genbrug direkte (kræver omskrivning)

- `src/hooks/useAuth.tsx` (Lejio/Supabase auth) → **Fri har `useFriAuth`**
- `src/hooks/useAdminAuth.tsx` (Lejio admin, Supabase) → **Fri admin auth separat**
- Lejio‑specifikke dashboards/routes

## 4) Anbefalet rækkefølge (genbrug fra Lejio → Fri)

1. **Vehicles** → `useFriVehicles` + UI
2. **Bookings** → `useFriBookings` + booking‑kalender
3. **Invoices/Payments** → `useFriInvoices` + `useFriPayments`
4. **Team/CRM** → `useFriTeam`
5. **Damage/Check‑in** → Fri workflows
6. **Analytics** → `useFriAnalytics`

## 5) Teknisk note
- Fri bruger **Azure Functions + Azure SQL**.
- Alle genbrugte hooks skal skifte **data‑layer til `azureApi`**.
- `lessor_id` isolering skal altid være med i queries.

---

**Næste skridt:** Vælg hvilken Lejio‑funktion vi vil genbruge først, så laver jeg den konkrete Fri‑version med Azure API.
