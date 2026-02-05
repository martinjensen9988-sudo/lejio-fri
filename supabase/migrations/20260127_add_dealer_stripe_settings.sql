-- Multi-forhandler Stripe settings (tilføj til Supabase migrations)
CREATE TABLE IF NOT EXISTS dealer_stripe_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_public_key text NOT NULL,
  stripe_secret_key text NOT NULL,
  stripe_price_id_standard text NOT NULL,
  stripe_price_id_premium text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS dealer_stripe_settings_dealer_id_idx ON dealer_stripe_settings(dealer_id);
