-- Add subscription plans for bilforhandler, biludlejning, autovaerksted and bland selv
CREATE TABLE IF NOT EXISTS fri_subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price_monthly INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'DKK',
    description TEXT,
    price_note VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fri_plans_category ON fri_subscription_plans(category);

INSERT INTO fri_subscription_plans (id, category, name, price_monthly, description, sort_order)
VALUES
    ('dealer_start', 'dealer', 'Bilforhandler Start', 599, 'Basis salg, leads og kampagner.', 10),
    ('dealer_plus', 'dealer', 'Bilforhandler Plus', 899, 'Avanceret salgsflow + kontrakter.', 20),
    ('dealer_pro', 'dealer', 'Bilforhandler Pro', 1199, 'Team, pipeline og performance dashboards.', 30),
    ('dealer_elite', 'dealer', 'Bilforhandler Elite', 1699, 'Premium support og full automation.', 40),
    ('rental_start', 'rental', 'Biludlejning Start', 499, 'Bookinger, fleet og betalinger.', 10),
    ('rental_growth', 'rental', 'Biludlejning Growth', 899, 'Automatisering, depot og kundeportal.', 20),
    ('workshop_start', 'workshop', 'Autovaerksted Start', 599, 'Opgaver, tider og kundekontakt.', 10),
    ('workshop_flow', 'workshop', 'Autovaerksted Flow', 999, 'Fakturering, reservedele og lager.', 20),
    ('workshop_scale', 'workshop', 'Autovaerksted Scale', 1399, 'Integrationer, KPI og driftsoverblik.', 30),
    ('custom_mix', 'custom', 'Bland selv', 299, 'Vaelg kun de moduler du vil have.', 10)
ON CONFLICT (id) DO NOTHING;
