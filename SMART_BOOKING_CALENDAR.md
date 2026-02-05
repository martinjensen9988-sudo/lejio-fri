# Smart Booking-kalender - Features & Guide

## 🎯 Oversigt
Den nye **Smart Booking-kalender** er en moderne, visuel booking-løsning med drag-and-drop funktionalitet, flere visninger og intelligent filtrering.

## ✨ Nye Features

### 1. **Multiple View Types**
- **Måned-visning**: Klassisk kalender-oversigt med alle bookinger
- **Uge-visning**: Detaljeret 7-dages visning med dagene som kolonner
- **Liste-visning**: Sorteret liste over alle bookinger

### 2. **Drag-and-Drop Rescheduling** 🎯
- Træk bookinger mellem datoer for at flytte dem
- Systemet bevarer den oprindelige varighed
- Opdateres automatisk i databasen
- Visual feedback med "GripVertical" ikonner

### 3. **Avanceret Søgning & Filtrering**
- Søg efter lejer navn, email eller registreringsnummer
- Filtrer efter enkelt bil eller alle biler
- Real-time filtrering

### 4. **Booking-detailmodalvisning**
- Klik på en booking for detaljeret info
- Viser lejer-kontaktinfo (navn, telefon, email)
- Viser startdato, slutdato, varighed og pris
- Quick actions: Rediger eller Annuller

### 5. **Intelligente Statistikker**
- **Afventer**: Antal bookinger der venter på bekræftelse
- **Bekræftet**: Bookinger der er bekræftet
- **Aktive**: Igangværende bookinger
- **Afsluttet**: Afsluttede bookinger
- **Indtægt**: Samlet indtægt fra filtrerede bookinger

### 6. **Visuelt Design**
- Status-baserede farver (gul=afventer, blå=bekræftet, grøn=aktiv, grå=afsluttet)
- Responsive design (mobil, tablet, desktop)
- Dark mode support
- Smooth transitions og hover-effekter

### 7. **Bruger-venlige Features**
- Hurtig navigation (forrige/næste periode, i dag)
- Legende viser status-farver
- Drag-hint på kalender-elementer
- "+" indikatorer når der er flere bookinger end plads

## 🚀 Implementering

### Komponenter
```
src/components/dashboard/SmartBookingCalendar.tsx  - Ny smart kalender
src/pages/dashboard/Calendar.tsx                   - Opdateret med ny komponent
```

### Props Interface
```typescript
interface SmartBookingCalendarProps {
  bookings: Booking[];           // Array af bookinger
  vehicles: Vehicle[];           // Array af køretøjer
  onReschedule?: (bookingId, newStartDate, newEndDate) => Promise<void>;
  onEdit?: (bookingId) => void;
  onCancel?: (bookingId) => Promise<void>;
}
```

### Eksempel Brug
```tsx
<SmartBookingCalendar
  bookings={bookings}
  vehicles={vehicles}
  onReschedule={handleReschedule}
  onEdit={handleEdit}
  onCancel={handleCancel}
/>
```

## 🎨 Layout Features

### Måned-visning
```
[Man] [Tir] [Ons] [Tor] [Fre] [Lør] [Søn]
  1     2     3     4     5     6     7
[BIL] [BIL]
[BIL] +2     ...
```

### Uge-visning
```
[Man 1.Jan] [Tir 2.Jan] [Ons 3.Jan] ...
[BIL-1]     [BIL-2]     [BIL-3]
[BIL-4]     [BIL-5]     [BIL-6]
```

### Liste-visning
```
┌─────────────────────────────────┐
│ BMW 3 Series - Bekræftet ✓     │
│ Lejer: John Doe | +45 1234 5678│
│ 1 Jan → 5 Jan • 12,500 kr       │
└─────────────────────────────────┘
```

## 💾 Database Integration

### Rescheduling
```typescript
// PATCH bookings
{
  start_date: newStartDate.toISOString(),
  end_date: newEndDate.toISOString(),
  updated_at: new Date().toISOString()
}
```

### Annullering
```typescript
// PATCH bookings
{
  status: 'cancelled',
  updated_at: new Date().toISOString()
}
```

## 🔍 Søgning & Filtrering

### Søgealgoritmé
- Søger i: lejer-navn, email, registreringsnummer
- Case-insensitive matching
- Real-time resultat

### Filtrering
- Udelukker annullerede bookinger
- Kan filtrer til enkelt køretøj
- Kombineres med søgning

## ⚡ Performance Optimering

### Memoization
- `useMemo` for `filteredBookings` - Re-render kun når data ændres
- `useCallback` for drag-handlers - Stabil reference

### Minimal Re-renders
- Komponenten re-render kun når nødvendig
- State-ændringer er optimerede

## 🎯 Branching & Versioning

### Gamle Komponenter
- `BookingCalendar.tsx` bevares for backward compatibility
- Kan gradvist migreres

### Nye Ruter
Hvis du vil bruge den nye SmartBookingCalendar på admin-siden:
```tsx
import SmartBookingCalendar from '@/components/dashboard/SmartBookingCalendar';
```

## 🐛 Fejlfinding

### Hvis drag-and-drop ikke virker
- Tjek `onReschedule` callback er implementeret
- Tjek browser-konsol for fejl
- Verificer Supabase permissions

### Hvis filtrering er langsom
- Tjek antal bookinger (>1000 kan være langsomt)
- Overvej pagination eller virtualisering

### Hvis modal ikke lukker
- Tjek `setShowBookingDetails` state
- Verificer DialogContent component fra shadcn-ui

## 🔮 Fremtidsforbedringer

1. **Ikonner for køretøjer** - Vise køretøjsbilleder
2. **Farvet køretøj-indikator** - Unik farve per bil
3. **Drag-til-ny-lejer** - Reassign bookinger
4. **Bulk-operationer** - Multi-select & batch actions
5. **Eksport til kalender** - Google Calendar, iCal integration
6. **Notification system** - Alerts når bookinger ændres
7. **Offline support** - Service Worker caching
8. **Gantt-chart visning** - Timeline visualization

## 📱 Responsive Design

- **Mobil (<640px)**: Single-column liste, drawer navigation
- **Tablet (640-1024px)**: 2-column liste, week view med scroll
- **Desktop (>1024px)**: Full-featured month/week/list views

## 🛠️ Stack

- React 18 + TypeScript
- date-fns for dato-manipulation
- shadcn-ui components
- Tailwind CSS for styling
- Supabase for backend
- Lucide icons

## 📝 Versionshistorie

### v1.0.0 - Smart Booking Calendar
- ✅ Month/Week/List views
- ✅ Drag-and-drop rescheduling
- ✅ Search og filtering
- ✅ Booking details modal
- ✅ Statistics dashboard
- ✅ Dark mode support
