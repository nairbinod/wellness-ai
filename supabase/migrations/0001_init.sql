-- Enums
create type business_category as enum ('med_spa', 'iv_therapy', 'mens_health');
create type listing_tier as enum ('free', 'verified', 'featured');
create type lead_status as enum ('new', 'contacted', 'converted', 'rejected');
create type user_role as enum ('consumer', 'business_owner', 'admin');
create type report_type as enum ('pricing_map', 'competitor_gap', 'market_movement');
create type access_type as enum ('one_time', 'subscription');

-- Metros
create table metros (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  slug text unique not null,
  lat double precision not null,
  lng double precision not null,
  radius_miles integer not null default 25,
  created_at timestamptz not null default now()
);

-- Businesses
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category business_category not null,
  subcategories text[] default '{}',
  address text,
  city text,
  state text,
  zip text,
  lat double precision,
  lng double precision,
  metro_id uuid references metros(id),
  phone text,
  website text,
  booking_url text,
  description text,
  hours jsonb,
  verified boolean not null default false,
  listing_tier listing_tier not null default 'free',
  claimed_by uuid references auth.users(id),
  financing_options text[] default '{}',
  consult_types text[] default '{}',
  first_time_friendly boolean not null default false,
  responds_to_inquiries boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on businesses (metro_id);
create index on businesses (category);
create index on businesses using gin (subcategories);
create index on businesses using gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')));

-- Business photos
create table business_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  url text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0
);
create index on business_photos (business_id);

-- Services
create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  category text,
  price_min numeric,
  price_max numeric,
  duration_minutes integer,
  description text
);
create index on services (business_id);

-- Reviews
create table reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  source text not null default 'google',
  rating numeric,
  review_text text,
  author_name text,
  review_date date
);
create index on reviews (business_id);

-- Leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  consumer_name text,
  consumer_email text,
  consumer_phone text,
  service_interest text,
  message text,
  source_page text,
  status lead_status not null default 'new',
  utm_source text,
  utm_medium text,
  referrer text,
  created_at timestamptz not null default now()
);
create index on leads (business_id);

-- Subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  tier listing_tier not null,
  stripe_subscription_id text,
  status text,
  current_period_end timestamptz
);
create index on subscriptions (business_id);

-- Lead charges
create table lead_charges (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  amount numeric not null,
  stripe_charge_id text,
  status text
);
create index on lead_charges (business_id);

-- Data products layer (schema only — no reporting logic until post-MVP)
create table market_snapshots (
  id uuid primary key default gen_random_uuid(),
  metro_id uuid references metros(id),
  category business_category,
  subcategory text,
  snapshot_date date not null,
  avg_price_min numeric,
  avg_price_max numeric,
  median_price numeric,
  price_sample_size integer,
  listing_count integer,
  new_listings_30d integer,
  closed_listings_30d integer,
  lead_volume_30d integer,
  top_requested_services jsonb
);

create table data_product_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  report_type report_type not null,
  metro_id uuid references metros(id),
  category business_category,
  generated_at timestamptz not null default now(),
  period_start date,
  period_end date,
  file_url text,
  price numeric,
  access_type access_type,
  purchased_by uuid[] default '{}'
);

-- User profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'consumer',
  created_at timestamptz not null default now()
);
