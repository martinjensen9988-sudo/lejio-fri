# Custom Domains and Tenant Isolation - Plan

## Goal
Allow each lessor to have their own public site on a custom domain with clean tenant isolation.

## Scope (Phase 1 - Overview)
- Resolve incoming domain -> lessor
- Serve the correct public site for that lessor
- Enforce tenant isolation in all data access
- Provide a clear onboarding flow for customers

## Architecture Summary
- Multi-tenant data model in a single database.
- Domain resolution at request time via Host header.
- Public site uses a resolved lessor_id and branding data.

## Data Model
Option A (simple):
- Use existing fri_lessors.custom_domain (one domain per lessor).

Option B (recommended for scale):
- New table: fri_domains
  - id
  - lessor_id
  - domain
  - status (pending, verified, active)
  - verification_token
  - verified_at
  - created_at

## DNS + Verification Flow
1. Customer adds a domain in dashboard.
2. System generates a verification token.
3. Customer creates a DNS TXT record:
   - _lejio-verify.<domain> = <token>
4. System verifies the record and marks domain as verified.
5. Customer points domain to platform:
   - CNAME <domain> -> public.lejio.dk (example)
6. Platform serves the correct lessor site based on Host.

## Request Resolution
- On each public request:
  - Read Host header (example: firma.dk)
  - Find lessor_id by domain
  - Load lessor branding and public site data

## Public Site Rendering
- Public site uses resolved lessor_id
- Branding: primary_color, logo_url, company_name
- All content (pages, vehicles) filtered by lessor_id

## Security and Isolation
- Tenant isolation by lessor_id in all queries
- Validate Host against verified domains only
- Avoid serving data if domain is not verified

## Operational Notes
- Use a managed SSL provider for custom domains
- Ensure wildcard or per-domain certificates
- Add monitoring for domain resolution failures

## Next Steps
- Decide between Option A and Option B
- Implement domain verification API
- Implement domain resolver API
- Update public site to use resolver instead of hardcoded mapping
