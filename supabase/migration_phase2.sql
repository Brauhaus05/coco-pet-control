-- ============================================================
-- CoCo Pet Control — Phase 2 Migration: Appointment Extensions
-- Run this in the Supabase SQL Editor AFTER the original migration
-- ============================================================

-- ============================================================
-- 1. EXTEND APPOINTMENTS TABLE
-- ============================================================
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS room TEXT,
  ADD COLUMN IF NOT EXISTS appointment_number SERIAL;

-- Ensure the notes column exists (may have been missed in some environments)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================
-- 2. APPOINTMENT VITALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointment_vitals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id  UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    weight_lbs      NUMERIC(6, 1),
    temperature_f   NUMERIC(4, 1),
    heart_rate_bpm  INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_vitals_appointment
  ON public.appointment_vitals(appointment_id);

-- ============================================================
-- 3. APPOINTMENT PRESCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointment_prescriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id      UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    item_name           TEXT NOT NULL,
    type                TEXT NOT NULL DEFAULT 'other'
                            CHECK (type IN ('vaccination', 'prescription', 'procedure', 'other')),
    dosage_instructions TEXT,
    quantity            TEXT,
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('administered', 'dispensed', 'pending', 'cancelled')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_prescriptions_appointment
  ON public.appointment_prescriptions(appointment_id);

-- ============================================================
-- 4. APPOINTMENT RECOMMENDATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointment_recommendations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id  UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    priority        TEXT NOT NULL DEFAULT 'routine'
                        CHECK (priority IN ('routine', 'important', 'urgent')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_recommendations_appointment
  ON public.appointment_recommendations(appointment_id);

-- ============================================================
-- 5. ROW LEVEL SECURITY  (join through appointments.clinic_id)
-- ============================================================

-- APPOINTMENT VITALS
ALTER TABLE public.appointment_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation SELECT on appointment_vitals"
  ON public.appointment_vitals FOR SELECT
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));

CREATE POLICY "Tenant isolation INSERT on appointment_vitals"
  ON public.appointment_vitals FOR INSERT
  WITH CHECK (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));

CREATE POLICY "Tenant isolation UPDATE on appointment_vitals"
  ON public.appointment_vitals FOR UPDATE
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));

CREATE POLICY "Tenant isolation DELETE on appointment_vitals"
  ON public.appointment_vitals FOR DELETE
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));

-- APPOINTMENT PRESCRIPTIONS
ALTER TABLE public.appointment_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation SELECT on appointment_prescriptions"
  ON public.appointment_prescriptions FOR SELECT
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));

CREATE POLICY "Tenant isolation INSERT on appointment_prescriptions"
  ON public.appointment_prescriptions FOR INSERT
  WITH CHECK (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));

CREATE POLICY "Tenant isolation UPDATE on appointment_prescriptions"
  ON public.appointment_prescriptions FOR UPDATE
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));

CREATE POLICY "Tenant isolation DELETE on appointment_prescriptions"
  ON public.appointment_prescriptions FOR DELETE
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));

-- APPOINTMENT RECOMMENDATIONS
ALTER TABLE public.appointment_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation SELECT on appointment_recommendations"
  ON public.appointment_recommendations FOR SELECT
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));

CREATE POLICY "Tenant isolation INSERT on appointment_recommendations"
  ON public.appointment_recommendations FOR INSERT
  WITH CHECK (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));

CREATE POLICY "Tenant isolation UPDATE on appointment_recommendations"
  ON public.appointment_recommendations FOR UPDATE
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));

CREATE POLICY "Tenant isolation DELETE on appointment_recommendations"
  ON public.appointment_recommendations FOR DELETE
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_my_clinic_id()
  ));
