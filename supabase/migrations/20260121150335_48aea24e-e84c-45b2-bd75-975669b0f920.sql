-- Fix PostgREST relationship errors by ensuring explicit foreign keys exist
-- These constraint names are referenced in client queries (profiles!vehicles_owner_id_fkey, profiles!bookings_lessor_id_fkey)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vehicles_owner_id_fkey'
      AND conrelid = 'public.vehicles'::regclass
  ) THEN
    ALTER TABLE public.vehicles
      ADD CONSTRAINT vehicles_owner_id_fkey
      FOREIGN KEY (owner_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;

  -- Validate if possible (won't block if existing data has issues)
  BEGIN
    ALTER TABLE public.vehicles VALIDATE CONSTRAINT vehicles_owner_id_fkey;
  EXCEPTION WHEN others THEN
    -- Leave as NOT VALID; still usable for relationship discovery
    NULL;
  END;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_lessor_id_fkey'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_lessor_id_fkey
      FOREIGN KEY (lessor_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;

  BEGIN
    ALTER TABLE public.bookings VALIDATE CONSTRAINT bookings_lessor_id_fkey;
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;

-- Helpful indexes for joins
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lessor_id ON public.bookings(lessor_id);
