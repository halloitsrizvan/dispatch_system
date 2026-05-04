-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Phlebotomists table
CREATE TABLE phlebotomists (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  phone             text NOT NULL,
  whatsapp          text,
  photo_url         text,
  experience_years  integer NOT NULL DEFAULT 0,
  specialisations   text[],                        -- e.g. ['paediatric', 'geriatric']
  location          geography(Point, 4326),         -- home coordinates (PostGIS)
  home_address      text,
  service_radius_km integer NOT NULL DEFAULT 10,
  is_available      boolean NOT NULL DEFAULT true,  -- Active / On Leave / Off Duty
  status            text NOT NULL DEFAULT 'active', -- 'active' | 'on_leave' | 'off_duty'
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz                     -- soft delete
);

-- Assignments table
CREATE TABLE assignments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phlebotomist_id    uuid NOT NULL REFERENCES phlebotomists(id),
  patient_area       text NOT NULL,
  patient_lat        float8 NOT NULL,
  patient_lng        float8 NOT NULL,
  dispatcher_id      uuid NOT NULL,               -- Antigravity user ID
  dispatcher_email   text NOT NULL,
  assigned_at        timestamptz NOT NULL DEFAULT now(),
  notes              text
);

-- PostGIS RPC function
CREATE OR REPLACE FUNCTION get_nearest_phlebotomists(
  patient_lat   float8,
  patient_lng   float8,
  max_radius_km integer DEFAULT 20
)
RETURNS TABLE (
  id                uuid,
  name              text,
  phone             text,
  experience_years  integer,
  distance_km       float8,
  is_available      boolean,
  status            text,
  notes             text
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.name,
    p.phone,
    p.experience_years,
    ROUND((ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(patient_lng, patient_lat), 4326)::geography
    ) / 1000)::numeric, 2) AS distance_km,
    p.is_available,
    p.status,
    p.notes
  FROM phlebotomists p
  WHERE
    p.deleted_at IS NULL
    AND p.is_available = true
    AND ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(patient_lng, patient_lat), 4326)::geography,
      max_radius_km * 1000
    )
    AND p.service_radius_km * 1000 >= ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(patient_lng, patient_lat), 4326)::geography
    )
  ORDER BY distance_km ASC, p.experience_years DESC;
$$;

-- RLS Policies
ALTER TABLE phlebotomists ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Dispatchers can SELECT phlebotomists
CREATE POLICY "Dispatchers can view phlebotomists" ON phlebotomists
  FOR SELECT TO authenticated
  USING (true);

-- Dispatchers can INSERT assignments
CREATE POLICY "Dispatchers can create assignments" ON assignments
  FOR INSERT TO authenticated
  WITH CHECK (true);
