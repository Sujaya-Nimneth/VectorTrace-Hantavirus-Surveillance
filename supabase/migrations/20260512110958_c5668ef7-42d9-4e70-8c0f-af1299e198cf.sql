
-- Enums
CREATE TYPE public.case_syndrome AS ENUM ('HPS', 'HFRS');
CREATE TYPE public.case_status AS ENUM ('Confirmed', 'Suspected', 'Pending');
CREATE TYPE public.case_sex AS ENUM ('M', 'F');
CREATE TYPE public.alert_level AS ENUM ('critical', 'warning', 'info');

-- Cases
CREATE TABLE public.hanta_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  syndrome public.case_syndrome NOT NULL DEFAULT 'HPS',
  status public.case_status NOT NULL DEFAULT 'Pending',
  age INTEGER,
  sex public.case_sex,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alerts
CREATE TABLE public.hanta_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level public.alert_level NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rodent sites
CREATE TABLE public.rodent_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  sampled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  positivity NUMERIC(5,2) NOT NULL DEFAULT 0,
  species TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.hanta_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hanta_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rodent_sites ENABLE ROW LEVEL SECURITY;

-- Public surveillance read
CREATE POLICY "Public can view cases" ON public.hanta_cases FOR SELECT USING (true);
CREATE POLICY "Public can view alerts" ON public.hanta_alerts FOR SELECT USING (true);
CREATE POLICY "Public can view rodent sites" ON public.rodent_sites FOR SELECT USING (true);

-- Authenticated write
CREATE POLICY "Auth can insert cases" ON public.hanta_cases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update cases" ON public.hanta_cases FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can insert alerts" ON public.hanta_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can insert rodent sites" ON public.rodent_sites FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX idx_cases_reported_at ON public.hanta_cases(reported_at DESC);
CREATE INDEX idx_cases_region ON public.hanta_cases(region);
CREATE INDEX idx_alerts_created_at ON public.hanta_alerts(created_at DESC);
CREATE INDEX idx_rodents_sampled_at ON public.rodent_sites(sampled_at DESC);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hanta_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hanta_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rodent_sites;

ALTER TABLE public.hanta_cases REPLICA IDENTITY FULL;
ALTER TABLE public.hanta_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.rodent_sites REPLICA IDENTITY FULL;
