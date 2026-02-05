-- Migration: Opretter feature_links tabel til admin feature flags
create table if not exists public.feature_links (
  id bigserial primary key,
  feature_key text not null unique,
  video text,
  image text,
  page text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Opdater updated_at automatisk
create or replace function public.set_updated_at_feature_links()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_feature_links on public.feature_links;
create trigger set_updated_at_feature_links
before update on public.feature_links
for each row execute procedure public.set_updated_at_feature_links();

-- Giv adgang til at læse og skrive for authenticated users
alter table public.feature_links enable row level security;
create policy "Allow all authenticated" on public.feature_links
  for all using (auth.role() = 'authenticated');
