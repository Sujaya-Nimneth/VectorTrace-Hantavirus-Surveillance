-- Expand VectorTrace from single-pathogen Hantavirus tracking to multi-disease
-- surveillance with bio-financial equity signal & nowcast telemetry.
-- Preserves all existing clinical PHI restrictions on hanta_cases and
-- non-clinical projection guarantees on hanta_cases_public.

create table public.diseases (
  slug text primary key,
  name text not null,
  icd11_code text not null,
  category text not null check (category in ('zoonotic', 'vector_borne', 'respiratory', 'waterborne')),
  syndromes text[] not null,
  symptoms text[] not null,
  sentinel_type text not null check (sentinel_type in ('rodent_trap', 'mosquito_ovitrap', 'avian_sentinel', 'wastewater_node')),
  proximity_radius_km numeric(5,2) not null default 5.0 check (proximity_radius_km > 0),
  incubation_days_max integer not null default 14 check (incubation_days_max > 0),
  created_at timestamptz not null default now()
);

insert into public.diseases (slug, name, icd11_code, category, syndromes, symptoms, sentinel_type, proximity_radius_km, incubation_days_max)
values
  (
    'hantavirus',
    'Hantavirus',
    '1D62',
    'zoonotic',
    array['HPS', 'HFRS'],
    array['fever', 'myalgia', 'cough', 'headache', 'nausea', 'thrombo'],
    'rodent_trap',
    5.0,
    42
  ),
  (
    'dengue',
    'Dengue Fever',
    '1D2Z',
    'vector_borne',
    array['DENV-Classic', 'DENV-Severe'],
    array['fever', 'headache', 'retro_orbital', 'myalgia', 'rash', 'thrombo', 'nausea'],
    'mosquito_ovitrap',
    1.5,
    10
  ),
  (
    'h5n1',
    'Avian Influenza (H5N1)',
    '1E31',
    'respiratory',
    array['H5N1-Avian', 'H5N1-Mammalian'],
    array['fever', 'cough', 'myalgia', 'conjunctivitis', 'hypoxia', 'headache'],
    'avian_sentinel',
    10.0,
    8
  ),
  (
    'mpox',
    'Mpox (Monkeypox)',
    '1E71',
    'zoonotic',
    array['Clade-I', 'Clade-II'],
    array['fever', 'rash', 'lymphadenopathy', 'headache', 'myalgia'],
    'wastewater_node',
    5.0,
    21
  ),
  (
    'arbovirus',
    'Chikungunya / Zika',
    '1D40',
    'vector_borne',
    array['CHIKV', 'ZIKV'],
    array['fever', 'arthralgia', 'rash', 'conjunctivitis', 'headache', 'myalgia'],
    'mosquito_ovitrap',
    1.5,
    12
  ),
  (
    'cholera',
    'Cholera',
    '1A00',
    'waterborne',
    array['El-Tor', 'Classical'],
    array['watery_diarrhea', 'dehydration', 'nausea', 'hypotension'],
    'wastewater_node',
    3.0,
    5
  )
on conflict (slug) do nothing;

-- Drop view before altering base column type, then recreate with identical
-- security posture (owner-run non-clinical projection, no PII columns).
drop view if exists public.hanta_cases_public;

alter table public.hanta_cases
  add column if not exists disease_slug text not null default 'hantavirus' references public.diseases(slug);

alter table public.hanta_cases
  alter column syndrome drop default,
  alter column syndrome type text using syndrome::text,
  alter column syndrome set default 'HPS';

alter table public.hanta_cases
  add constraint cases_syndrome_nonempty check (char_length(btrim(syndrome)) > 0 and char_length(syndrome) <= 64);

drop type if exists public.case_syndrome;

create index if not exists idx_cases_disease_reported_at
  on public.hanta_cases(disease_slug, reported_at desc);

create view public.hanta_cases_public
with (security_invoker = false) as
  select
    id,
    case_id,
    disease_slug,
    region,
    lat,
    lng,
    reported_at,
    syndrome,
    status,
    created_at
  from public.hanta_cases;

revoke all on public.hanta_cases_public from public, anon, authenticated;
grant select on public.hanta_cases_public to anon, authenticated;

-- Generalize vector sentinel sites beyond rodents while preserving table identity
alter table public.rodent_sites
  add column if not exists disease_slug text not null default 'hantavirus' references public.diseases(slug),
  add column if not exists sentinel_type text not null default 'rodent_trap'
    check (sentinel_type in ('rodent_trap', 'mosquito_ovitrap', 'avian_sentinel', 'wastewater_node'));

create index if not exists idx_rodent_sites_disease_sampled_at
  on public.rodent_sites(disease_slug, sampled_at desc);

-- Tag alerts with pathogen + signal origin (clinical vs market divergence)
alter table public.hanta_alerts
  add column if not exists disease_slug text not null default 'hantavirus' references public.diseases(slug),
  add column if not exists signal_source text not null default 'clinical'
    check (signal_source in ('clinical', 'who_don', 'market_divergence', 'composite_nowcast'));

create index if not exists idx_alerts_disease_created_at
  on public.hanta_alerts(disease_slug, created_at desc);

-- Pharmaceutical, diagnostics, acute-care, and vector-control equities
create table public.pharma_tickers (
  ticker text primary key,
  company_name text not null,
  exchange text not null,
  sector_role text not null check (sector_role in ('vaccine', 'antiviral', 'diagnostics', 'consumables', 'vector_control', 'benchmark')),
  is_pure_play boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.disease_ticker_mappings (
  disease_slug text not null references public.diseases(slug) on delete cascade,
  ticker text not null references public.pharma_tickers(ticker) on delete cascade,
  weight numeric(4,3) not null check (weight > 0 and weight <= 1),
  lead_role text not null,
  rationale text not null,
  primary key (disease_slug, ticker)
);

create table public.market_daily_bars (
  ticker text not null references public.pharma_tickers(ticker) on delete cascade,
  trade_date date not null,
  close_price numeric(12,4) not null check (close_price > 0),
  volume bigint not null check (volume >= 0),
  return_1d numeric(8,5) not null default 0,
  abnormal_return_1d numeric(8,5) not null default 0,
  car_7d numeric(8,5) not null default 0,
  volume_zscore numeric(7,3) not null default 0,
  created_at timestamptz not null default now(),
  primary key (ticker, trade_date)
);

create index idx_market_daily_bars_date on public.market_daily_bars(trade_date desc);

create table public.disease_nowcast_signals (
  disease_slug text not null references public.diseases(slug) on delete cascade,
  region text not null,
  signal_date date not null,
  pharma_basket_zscore numeric(7,3) not null default 0,
  wiki_attention_zscore numeric(7,3) not null default 0,
  climate_suitability_score numeric(5,2) not null default 0 check (climate_suitability_score between 0 and 100),
  composite_outbreak_risk numeric(5,2) not null default 0 check (composite_outbreak_risk between 0 and 100),
  optimal_lead_days integer not null default 0 check (optimal_lead_days between -21 and 21),
  lag_correlation_r numeric(5,3) not null default 0 check (lag_correlation_r between -1 and 1),
  forecast_cases_7d numeric(8,2) not null default 0 check (forecast_cases_7d >= 0),
  forecast_cases_14d numeric(8,2) not null default 0 check (forecast_cases_14d >= 0),
  created_at timestamptz not null default now(),
  primary key (disease_slug, region, signal_date)
);

create index idx_nowcast_signals_date on public.disease_nowcast_signals(disease_slug, signal_date desc);

insert into public.pharma_tickers (ticker, company_name, exchange, sector_role, is_pure_play)
values
  ('SPY', 'SPDR S&P 500 ETF Trust', 'NYSE', 'benchmark', false),
  ('XBI', 'SPDR S&P Biotech ETF', 'NYSE', 'benchmark', false),
  ('DHR', 'Danaher (Cepheid PCR)', 'NYSE', 'diagnostics', false),
  ('ABT', 'Abbott Laboratories (Rapid Tests)', 'NYSE', 'diagnostics', false),
  ('QGEN', 'Qiagen N.V. (Molecular Diagnostics)', 'NYSE', 'diagnostics', true),
  ('BIM.PA', 'bioMérieux SA (Multiplex Syndromic)', 'EPA', 'diagnostics', true),
  ('TAK', 'Takeda Pharmaceutical (Qdenga)', 'NYSE', 'vaccine', false),
  ('SNY', 'Sanofi (Dengvaxia / Vaccines)', 'NASDAQ', 'vaccine', false),
  ('VALN', 'Valneva SE (Ixchiq Chikungunya)', 'NASDAQ', 'vaccine', true),
  ('BAVA.CO', 'Bavarian Nordic A/S (Jynneos Mpox)', 'CPH', 'vaccine', true),
  ('SIGA', 'SIGA Technologies (Tpoxx Tecovirimat)', 'NASDAQ', 'antiviral', true),
  ('EBS', 'Emergent BioSolutions (ACAM2000)', 'NYSE', 'vaccine', true),
  ('MRNA', 'Moderna (mRNA-1018 Pandemic Flu)', 'NASDAQ', 'vaccine', true),
  ('CSL.AX', 'CSL Seqirus (H5N1 Vaccine)', 'ASX', 'vaccine', false),
  ('RHHBY', 'Roche Holding (Oseltamivir / Xofluza)', 'OTC', 'antiviral', false),
  ('BAX', 'Baxter International (IV Fluids / CRRT)', 'NYSE', 'consumables', false),
  ('BDX', 'Becton Dickinson (Acute Infusion)', 'NYSE', 'consumables', false),
  ('GETI-B.ST', 'Getinge AB (ECMO / ICU Life Support)', 'STO', 'consumables', false),
  ('RTO', 'Rentokil Initial (Vector & Rodent Control)', 'NYSE', 'vector_control', true)
on conflict (ticker) do nothing;

insert into public.disease_ticker_mappings (disease_slug, ticker, weight, lead_role, rationale)
values
  ('hantavirus', 'GETI-B.ST', 0.30, 'Acute ECMO & cardiopulmonary support', 'HPS outbreaks drive sudden ICU ECMO/ventilator utilization spikes.'),
  ('hantavirus', 'BAX', 0.25, 'Renal CRRT & IV fluid management', 'HFRS renal failure & HPS fluid resuscitation drive acute Baxter hospital demand.'),
  ('hantavirus', 'DHR', 0.25, 'Cepheid molecular differential PCR', 'Rule-out respiratory/hemorrhagic panels surge prior to confirmed HPS/HFRS.'),
  ('hantavirus', 'RTO', 0.20, 'Commercial rodent control & remediation', 'Rural agricultural & lodging outbreaks spike rodent biosecurity contracts.'),

  ('dengue', 'TAK', 0.35, 'Qdenga (TAK-003) dengue vaccine', 'Primary global dengue vaccine supplier; public procurement follows epidemic waves.'),
  ('dengue', 'ABT', 0.25, 'Panbio Dengue NS1/IgM rapid tests', 'Rapid antigen procurement leads official ministry confirmations by 7-14 days.'),
  ('dengue', 'BAX', 0.25, 'IV crystalloid fluid resuscitation', 'Severe dengue plasma leakage creates rapid hospital IV fluid shortages.'),
  ('dengue', 'RTO', 0.15, 'Aedes vector abatement services', 'Municipal larvicide and vector fogging contracts expand during transmission spikes.'),

  ('h5n1', 'CSL.AX', 0.30, 'Seqirus pre-pandemic H5N1 stockpiles', 'Direct government contracts for zoonotic influenza preparedness.'),
  ('h5n1', 'MRNA', 0.25, 'mRNA-1018 pandemic influenza candidate', 'High-beta institutional proxy for avian flu spillover headlines and BARDA awards.'),
  ('h5n1', 'RHHBY', 0.25, 'Oseltamivir (Tamiflu) & Xofluza', 'First-line neuraminidase & endonuclease antiviral stockpiling.'),
  ('h5n1', 'QGEN', 0.20, 'QIAstat-Dx respiratory PCR panels', 'Hospital & veterinary lab surveillance testing demand.'),

  ('mpox', 'BAVA.CO', 0.40, 'Jynneos / Imvanex MVA-BN vaccine', 'Sole global WHO-prequalified Mpox vaccine pure-play supplier.'),
  ('mpox', 'SIGA', 0.35, 'Tpoxx (tecovirimat) antiviral', 'Pure-play orthopox antiviral; extreme sensitivity to Clade-I emergency declarations.'),
  ('mpox', 'DHR', 0.15, 'Cepheid Xpert Mpox PCR cartridges', 'Point-of-care multiplex orthopox diagnostic cartridge procurement.'),
  ('mpox', 'EBS', 0.10, 'ACAM2000 & biodefense countermeasures', 'Secondary orthopox stockpile supplier.'),

  ('arbovirus', 'VALN', 0.45, 'Ixchiq (VLA1553) chikungunya vaccine', 'Pure-play chikungunya vaccine leader sensitive to tropical/Southern Cone spikes.'),
  ('arbovirus', 'BIM.PA', 0.25, 'BioFire/multiplex arbovirus diagnostics', 'Co-circulating Dengue/Zika/Chikungunya differential PCR demand.'),
  ('arbovirus', 'ABT', 0.15, 'Point-of-care febrile lateral flow assays', 'Clinic-level differential triage testing.'),
  ('arbovirus', 'RTO', 0.15, 'Aedes vector suppression', 'Shared Aedes vector control demand.'),

  ('cholera', 'BAX', 0.40, 'Lactated Ringer''s & IV hydration', 'Acute cholera dehydration triggers immediate IV fluid replenishment orders.'),
  ('cholera', 'BIM.PA', 0.25, 'FilmArray GI enteric panels', 'Wastewater and clinical diarrheal cluster identification.'),
  ('cholera', 'BDX', 0.20, 'Acute infusion catheters & diagnostics', 'High-volume emergency triage consumable utilization.'),
  ('cholera', 'ABT', 0.15, 'Field waterborne triage & electrolyte testing', 'i-STAT point-of-care electrolyte monitoring in severe dehydration.')
on conflict (disease_slug, ticker) do nothing;

-- RLS policies: public surveillance metadata & anonymized signals are readable;
-- writes are restricted to admins and service_role (Edge Functions).
alter table public.diseases enable row level security;
alter table public.pharma_tickers enable row level security;
alter table public.disease_ticker_mappings enable row level security;
alter table public.market_daily_bars enable row level security;
alter table public.disease_nowcast_signals enable row level security;

create policy "Public can view diseases"
  on public.diseases for select to anon, authenticated using (true);
create policy "Admins manage diseases"
  on public.diseases for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Public can view pharma tickers"
  on public.pharma_tickers for select to anon, authenticated using (true);
create policy "Admins manage pharma tickers"
  on public.pharma_tickers for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Public can view disease ticker mappings"
  on public.disease_ticker_mappings for select to anon, authenticated using (true);
create policy "Admins manage disease ticker mappings"
  on public.disease_ticker_mappings for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Public can view market bars"
  on public.market_daily_bars for select to anon, authenticated using (true);
create policy "Admins manage market bars"
  on public.market_daily_bars for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Public can view nowcast signals"
  on public.disease_nowcast_signals for select to anon, authenticated using (true);
create policy "Admins manage nowcast signals"
  on public.disease_nowcast_signals for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

grant select on public.diseases to anon, authenticated;
grant select on public.pharma_tickers to anon, authenticated;
grant select on public.disease_ticker_mappings to anon, authenticated;
grant select on public.market_daily_bars to anon, authenticated;
grant select on public.disease_nowcast_signals to anon, authenticated;

alter publication supabase_realtime add table public.disease_nowcast_signals;
alter table public.disease_nowcast_signals replica identity full;
