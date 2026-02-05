-- Drop all fri_* tables in the correct order (due to foreign keys)
DROP TABLE IF EXISTS fri_api_keys;
DROP TABLE IF EXISTS fri_audit_logs;
DROP TABLE IF EXISTS fri_custom_domains;
DROP TABLE IF EXISTS fri_page_blocks;
DROP TABLE IF EXISTS fri_pages;
DROP TABLE IF EXISTS fri_payments;
DROP TABLE IF EXISTS fri_invoices;
DROP TABLE IF EXISTS fri_bookings;
DROP TABLE IF EXISTS fri_vehicle_maintenance;
DROP TABLE IF EXISTS fri_vehicles;
DROP TABLE IF EXISTS fri_customers;
DROP TABLE IF EXISTS fri_lessor_team_members;
DROP TABLE IF EXISTS fri_lessors;
