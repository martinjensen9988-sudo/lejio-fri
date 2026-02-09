-- ============================================================================
-- LEJIO FRI - RLS POLICIES (Render Postgres)
-- ============================================================================
-- Uses SET LOCAL app.lessor_id = '<lessor-id>' per request via api/rls.js
-- Run this AFTER schema.postgres.sql
-- ============================================================================

-- Helper: drop existing policies safely
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- VEHICLES
-- ============================================================================
ALTER TABLE fri_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_vehicles FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_vehicles_select ON fri_vehicles FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_vehicles_insert ON fri_vehicles FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_vehicles_update ON fri_vehicles FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_vehicles_delete ON fri_vehicles FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- BOOKINGS
-- ============================================================================
ALTER TABLE fri_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_bookings FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_bookings_select ON fri_bookings FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_bookings_insert ON fri_bookings FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_bookings_update ON fri_bookings FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_bookings_delete ON fri_bookings FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- INVOICES
-- ============================================================================
ALTER TABLE fri_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_invoices FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_invoices_select ON fri_invoices FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_invoices_insert ON fri_invoices FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_invoices_update ON fri_invoices FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_invoices_delete ON fri_invoices FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- PAYMENTS
-- ============================================================================
ALTER TABLE fri_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_payments FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_payments_select ON fri_payments FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_payments_insert ON fri_payments FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_payments_update ON fri_payments FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_payments_delete ON fri_payments FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- PAGES
-- ============================================================================
ALTER TABLE fri_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_pages FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_pages_select ON fri_pages FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_pages_insert ON fri_pages FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_pages_update ON fri_pages FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_pages_delete ON fri_pages FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- PAGE BLOCKS (scoped via owning page)
-- ============================================================================
ALTER TABLE fri_page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_page_blocks FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_page_blocks_select ON fri_page_blocks FOR SELECT
  USING (EXISTS (SELECT 1 FROM fri_pages p WHERE p.id = fri_page_blocks.page_id AND p.lessor_id = current_setting('app.lessor_id', true)));
CREATE POLICY fri_page_blocks_insert ON fri_page_blocks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM fri_pages p WHERE p.id = fri_page_blocks.page_id AND p.lessor_id = current_setting('app.lessor_id', true)));
CREATE POLICY fri_page_blocks_update ON fri_page_blocks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM fri_pages p WHERE p.id = fri_page_blocks.page_id AND p.lessor_id = current_setting('app.lessor_id', true)))
  WITH CHECK (EXISTS (SELECT 1 FROM fri_pages p WHERE p.id = fri_page_blocks.page_id AND p.lessor_id = current_setting('app.lessor_id', true)));
CREATE POLICY fri_page_blocks_delete ON fri_page_blocks FOR DELETE
  USING (EXISTS (SELECT 1 FROM fri_pages p WHERE p.id = fri_page_blocks.page_id AND p.lessor_id = current_setting('app.lessor_id', true)));

-- ============================================================================
-- TEAM MEMBERS
-- ============================================================================
ALTER TABLE fri_lessor_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_lessor_team_members FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_team_select ON fri_lessor_team_members FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_team_insert ON fri_lessor_team_members FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_team_update ON fri_lessor_team_members FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_team_delete ON fri_lessor_team_members FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- SUPPORT TICKETS
-- ============================================================================
ALTER TABLE fri_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_support_tickets FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_tickets_select ON fri_support_tickets FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_tickets_insert ON fri_support_tickets FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_tickets_update ON fri_support_tickets FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_tickets_delete ON fri_support_tickets FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- API KEYS
-- ============================================================================
ALTER TABLE fri_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_api_keys FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_api_keys_select ON fri_api_keys FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_api_keys_insert ON fri_api_keys FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_api_keys_update ON fri_api_keys FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_api_keys_delete ON fri_api_keys FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================
ALTER TABLE fri_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_audit_select ON fri_audit_logs FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_audit_insert ON fri_audit_logs FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- DEALER LISTINGS
-- ============================================================================
ALTER TABLE fri_dealer_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_dealer_listings FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_dealer_listings_select ON fri_dealer_listings FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_listings_insert ON fri_dealer_listings FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_listings_update ON fri_dealer_listings FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_listings_delete ON fri_dealer_listings FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- DEALER LOYALTY CARDS RLS
-- ============================================================================

ALTER TABLE fri_dealer_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_dealer_loyalty_cards FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_dealer_loyalty_cards_select ON fri_dealer_loyalty_cards FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_loyalty_cards_insert ON fri_dealer_loyalty_cards FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_loyalty_cards_update ON fri_dealer_loyalty_cards FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_loyalty_cards_delete ON fri_dealer_loyalty_cards FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- DEALER CONTRACTS RLS
-- ============================================================================

ALTER TABLE fri_dealer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_dealer_contracts FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_dealer_contracts_select ON fri_dealer_contracts FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_contracts_insert ON fri_dealer_contracts FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_contracts_update ON fri_dealer_contracts FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_contracts_delete ON fri_dealer_contracts FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- DEALER CAMPAIGNS RLS
-- ============================================================================

ALTER TABLE fri_dealer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_dealer_campaigns FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_dealer_campaigns_select ON fri_dealer_campaigns FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_campaigns_insert ON fri_dealer_campaigns FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_campaigns_update ON fri_dealer_campaigns FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));
CREATE POLICY fri_dealer_campaigns_delete ON fri_dealer_campaigns FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- ============================================================================
-- NOTE: The following tables do NOT have RLS (intentional):
-- - fri_users (auth table - accessed by auth endpoints only)
-- - fri_sessions (session table - accessed by session.js only)
-- - fri_admins (admin table - accessed by admin auth only)
-- - fri_lessors (no lessor_id column - uses id as PK, queried via WHERE id=)
-- - fri_tenants (multi-tenant config - no lessor_id column)
-- - fri_ticket_messages (scoped via ticket_id JOIN in queries)
-- ============================================================================
