/*
# JeevSetu — Livestock Disease Surveillance Schema

## Overview
Creates the full data model for a livestock disease early-warning and health
surveillance system connecting farmers, field workers, and vet officials.

## New Tables
1. `profiles` — user profile linked to auth.users; stores role, name, phone, location, language
2. `herds` — a farmer's herd; grouped animals with location
3. `animals` — individual animal profiles with species, breed, photo, tag
4. `vaccinations` — vaccination records per animal
5. `treatments` — treatment history per animal
6. `reports` — symptom reports submitted by farmers/field workers, with AI triage
7. `cases` — vet-official-managed cases derived from reports
8. `lab_referrals` — lab sample requests linked to cases
9. `advisories` — multilingual health advisories/alerts

## Security (RLS)
- This app HAS sign-in, so policies scope TO authenticated.
- Read access is intentionally broad (SELECT to all authenticated) because this
  is a public-health surveillance system — vet officials and field workers need
  visibility across the district.
- Write access is ownership-scoped for herds/animals/vaccinations/treatments.
- Reports: any authenticated farmer/field-worker can insert; reporter owns their report.
- Cases: vet officials create/update; reporter can read.
- Profiles: each user reads/updates own; all authenticated can read.

## Notes
- `profiles.role` is stored in the DB and set at signup.
- All location fields use text (village/block/district/state) plus optional lat/lng.
- `reports.severity` is set by the triage function (rule-based, ready for AI swap-in).
*/

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer','field_worker','vet_official')),
  village text,
  block text,
  district text,
  state text,
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','hi','te')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- herds
-- ============================================================
CREATE TABLE IF NOT EXISTS herds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  village text,
  block text,
  district text,
  state text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE herds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "herds_select_all" ON herds;
CREATE POLICY "herds_select_all" ON herds FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "herds_insert_own" ON herds;
CREATE POLICY "herds_insert_own" ON herds FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "herds_update_own" ON herds;
CREATE POLICY "herds_update_own" ON herds FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "herds_delete_own" ON herds;
CREATE POLICY "herds_delete_own" ON herds FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- ============================================================
-- animals
-- ============================================================
CREATE TABLE IF NOT EXISTS animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  herd_id uuid NOT NULL REFERENCES herds(id) ON DELETE CASCADE,
  name text,
  tag_number text,
  species text NOT NULL,
  breed text,
  sex text CHECK (sex IN ('male','female','unknown')),
  birth_date date,
  photo_url text,
  status text NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy','under_treatment','recovered','deceased')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "animals_select_all" ON animals;
CREATE POLICY "animals_select_all" ON animals FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "animals_insert_own" ON animals;
CREATE POLICY "animals_insert_own" ON animals FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM herds WHERE herds.id = animals.herd_id AND herds.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "animals_update_own" ON animals;
CREATE POLICY "animals_update_own" ON animals FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM herds WHERE herds.id = animals.herd_id AND herds.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM herds WHERE herds.id = animals.herd_id AND herds.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "animals_delete_own" ON animals;
CREATE POLICY "animals_delete_own" ON animals FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM herds WHERE herds.id = animals.herd_id AND herds.owner_id = auth.uid())
  );

-- ============================================================
-- vaccinations
-- ============================================================
CREATE TABLE IF NOT EXISTS vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  administered_date date NOT NULL DEFAULT CURRENT_DATE,
  next_due_date date,
  administered_by text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vaccinations_select_all" ON vaccinations;
CREATE POLICY "vaccinations_select_all" ON vaccinations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "vaccinations_insert_own" ON vaccinations;
CREATE POLICY "vaccinations_insert_own" ON vaccinations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM animals a JOIN herds h ON h.id = a.herd_id WHERE a.id = vaccinations.animal_id AND h.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "vaccinations_update_own" ON vaccinations;
CREATE POLICY "vaccinations_update_own" ON vaccinations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM animals a JOIN herds h ON h.id = a.herd_id WHERE a.id = vaccinations.animal_id AND h.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM animals a JOIN herds h ON h.id = a.herd_id WHERE a.id = vaccinations.animal_id AND h.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "vaccinations_delete_own" ON vaccinations;
CREATE POLICY "vaccinations_delete_own" ON vaccinations FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM animals a JOIN herds h ON h.id = a.herd_id WHERE a.id = vaccinations.animal_id AND h.owner_id = auth.uid())
  );

-- ============================================================
-- treatments
-- ============================================================
CREATE TABLE IF NOT EXISTS treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  diagnosis text,
  treatment text NOT NULL,
  treatment_date date NOT NULL DEFAULT CURRENT_DATE,
  vet_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatments_select_all" ON treatments;
CREATE POLICY "treatments_select_all" ON treatments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "treatments_insert_own" ON treatments;
CREATE POLICY "treatments_insert_own" ON treatments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM animals a JOIN herds h ON h.id = a.herd_id WHERE a.id = treatments.animal_id AND h.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "treatments_update_own" ON treatments;
CREATE POLICY "treatments_update_own" ON treatments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM animals a JOIN herds h ON h.id = a.herd_id WHERE a.id = treatments.animal_id AND h.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM animals a JOIN herds h ON h.id = a.herd_id WHERE a.id = treatments.animal_id AND h.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "treatments_delete_own" ON treatments;
CREATE POLICY "treatments_delete_own" ON treatments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM animals a JOIN herds h ON h.id = a.herd_id WHERE a.id = treatments.animal_id AND h.owner_id = auth.uid())
  );

-- ============================================================
-- reports — symptom reports with triage
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid REFERENCES animals(id) ON DELETE SET NULL,
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  species text NOT NULL,
  breed text,
  symptoms text[] NOT NULL DEFAULT '{}',
  notes text,
  photo_url text,
  latitude double precision,
  longitude double precision,
  village text,
  block text,
  district text,
  state text,
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','outbreak-risk')),
  triage_recommendation text,
  vet_referral_needed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','triaged','assigned','resolved')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_all" ON reports;
CREATE POLICY "reports_select_all" ON reports FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_update_own_or_vet" ON reports;
CREATE POLICY "reports_update_own_or_vet" ON reports FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  )
  WITH CHECK (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  );

DROP POLICY IF EXISTS "reports_delete_own" ON reports;
CREATE POLICY "reports_delete_own" ON reports FOR DELETE
  TO authenticated USING (auth.uid() = reporter_id);

-- ============================================================
-- cases — vet official managed cases
-- ============================================================
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  assigned_vet_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cases_select_all" ON cases;
CREATE POLICY "cases_select_all" ON cases FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "cases_insert_vet" ON cases;
CREATE POLICY "cases_insert_vet" ON cases FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  );

DROP POLICY IF EXISTS "cases_update_vet" ON cases;
CREATE POLICY "cases_update_vet" ON cases FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  );

DROP POLICY IF EXISTS "cases_delete_vet" ON cases;
CREATE POLICY "cases_delete_vet" ON cases FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  );

-- ============================================================
-- lab_referrals
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  sample_type text NOT NULL,
  lab_name text,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','collected','in_lab','results_ready','completed')),
  result text,
  result_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lab_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_referrals_select_all" ON lab_referrals;
CREATE POLICY "lab_referrals_select_all" ON lab_referrals FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "lab_referrals_insert_vet" ON lab_referrals;
CREATE POLICY "lab_referrals_insert_vet" ON lab_referrals FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  );

DROP POLICY IF EXISTS "lab_referrals_update_vet" ON lab_referrals;
CREATE POLICY "lab_referrals_update_vet" ON lab_referrals FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  );

DROP POLICY IF EXISTS "lab_referrals_delete_vet" ON lab_referrals;
CREATE POLICY "lab_referrals_delete_vet" ON lab_referrals FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  );

-- ============================================================
-- advisories — multilingual alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS advisories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','hi','te')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','outbreak-risk')),
  species text,
  region text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE advisories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "advisories_select_all" ON advisories;
CREATE POLICY "advisories_select_all" ON advisories FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "advisories_insert_vet" ON advisories;
CREATE POLICY "advisories_insert_vet" ON advisories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  );

DROP POLICY IF EXISTS "advisories_update_vet" ON advisories;
CREATE POLICY "advisories_update_vet" ON advisories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  );

DROP POLICY IF EXISTS "advisories_delete_vet" ON advisories;
CREATE POLICY "advisories_delete_vet" ON advisories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'vet_official')
  );

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_animals_herd ON animals(herd_id);
CREATE INDEX IF NOT EXISTS idx_reports_animal ON reports(animal_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_district ON reports(district);
CREATE INDEX IF NOT EXISTS idx_cases_report ON cases(report_id);
CREATE INDEX IF NOT EXISTS idx_cases_vet ON cases(assigned_vet_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_vaccinations_animal ON vaccinations(animal_id);
CREATE INDEX IF NOT EXISTS idx_treatments_animal ON treatments(animal_id);
CREATE INDEX IF NOT EXISTS idx_lab_referrals_case ON lab_referrals(case_id);
CREATE INDEX IF NOT EXISTS idx_advisories_language ON advisories(language);

-- ============================================================
-- updated_at trigger for cases
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cases_updated_at ON cases;
CREATE TRIGGER cases_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();