-- RLS policies for Render Postgres using app.lessor_id session variable
-- Ensure the API sets: SET LOCAL app.lessor_id = '<lessor-id>'

-- Pages
ALTER TABLE fri_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_pages FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_pages_select ON fri_pages
  FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_pages_insert ON fri_pages
  FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_pages_update ON fri_pages
  FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_pages_delete ON fri_pages
  FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- Page blocks (scoped via owning page)
ALTER TABLE fri_page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_page_blocks FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_page_blocks_select ON fri_page_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fri_pages p
      WHERE p.id = fri_page_blocks.page_id
        AND p.lessor_id = current_setting('app.lessor_id', true)
    )
  );

CREATE POLICY fri_page_blocks_insert ON fri_page_blocks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fri_pages p
      WHERE p.id = fri_page_blocks.page_id
        AND p.lessor_id = current_setting('app.lessor_id', true)
    )
  );

CREATE POLICY fri_page_blocks_update ON fri_page_blocks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM fri_pages p
      WHERE p.id = fri_page_blocks.page_id
        AND p.lessor_id = current_setting('app.lessor_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fri_pages p
      WHERE p.id = fri_page_blocks.page_id
        AND p.lessor_id = current_setting('app.lessor_id', true)
    )
  );

CREATE POLICY fri_page_blocks_delete ON fri_page_blocks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM fri_pages p
      WHERE p.id = fri_page_blocks.page_id
        AND p.lessor_id = current_setting('app.lessor_id', true)
    )
  );

-- Vehicles
ALTER TABLE fri_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_vehicles FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_vehicles_select ON fri_vehicles
  FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_vehicles_insert ON fri_vehicles
  FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_vehicles_update ON fri_vehicles
  FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_vehicles_delete ON fri_vehicles
  FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- Bookings
ALTER TABLE fri_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_bookings FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_bookings_select ON fri_bookings
  FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_bookings_insert ON fri_bookings
  FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_bookings_update ON fri_bookings
  FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_bookings_delete ON fri_bookings
  FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- Invoices
ALTER TABLE fri_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_invoices FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_invoices_select ON fri_invoices
  FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_invoices_insert ON fri_invoices
  FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_invoices_update ON fri_invoices
  FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_invoices_delete ON fri_invoices
  FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- Customers
ALTER TABLE fri_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_customers FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_customers_select ON fri_customers
  FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_customers_insert ON fri_customers
  FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_customers_update ON fri_customers
  FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_customers_delete ON fri_customers
  FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));

-- Payments
ALTER TABLE fri_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fri_payments FORCE ROW LEVEL SECURITY;

CREATE POLICY fri_payments_select ON fri_payments
  FOR SELECT
  USING (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_payments_insert ON fri_payments
  FOR INSERT
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_payments_update ON fri_payments
  FOR UPDATE
  USING (lessor_id = current_setting('app.lessor_id', true))
  WITH CHECK (lessor_id = current_setting('app.lessor_id', true));

CREATE POLICY fri_payments_delete ON fri_payments
  FOR DELETE
  USING (lessor_id = current_setting('app.lessor_id', true));
