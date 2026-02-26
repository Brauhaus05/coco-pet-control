-- ============================================================
-- CoCo Pet Control — Full Database Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CLINICS (global — no clinic_id on itself)
-- ============================================================
CREATE TABLE public.clinics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    address     TEXT,
    phone       TEXT,
    email       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. PROFILES (extends Supabase auth.users, has clinic_id)
-- ============================================================
CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id   UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'vet' CHECK (role IN ('admin', 'vet', 'receptionist')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. OWNERS
-- ============================================================
CREATE TABLE public.owners (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id   UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    address     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. PETS
-- ============================================================
CREATE TABLE public.pets (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id     UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    owner_id      UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    species       TEXT NOT NULL,
    breed         TEXT,
    date_of_birth DATE,
    sex           TEXT CHECK (sex IN ('male', 'female', 'unknown')),
    weight_kg     NUMERIC(6, 2),
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. MEDICAL RECORDS
-- ============================================================
CREATE TABLE public.medical_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id       UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    pet_id          UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    vet_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    visit_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    chief_complaint TEXT,
    diagnosis       TEXT,
    treatment       TEXT,
    notes           TEXT,
    image_urls      TEXT[] DEFAULT '{}',
    cost            NUMERIC(10, 2) DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. APPOINTMENTS
-- ============================================================
CREATE TABLE public.appointments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id   UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    pet_id      UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    vet_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    start_time  TIMESTAMPTZ NOT NULL,
    end_time    TIMESTAMPTZ NOT NULL,
    reason      TEXT,
    status      TEXT NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. INVOICES
-- ============================================================
CREATE TABLE public.invoices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id   UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    owner_id    UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
    status      TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    total       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    issue_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date    DATE,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. INVOICE ITEMS
-- ============================================================
CREATE TABLE public.invoice_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1,
    unit_price  NUMERIC(10, 2) NOT NULL,
    line_total  NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ============================================================
-- 9. INDEXES
-- ============================================================
CREATE INDEX idx_profiles_clinic        ON public.profiles(clinic_id);
CREATE INDEX idx_owners_clinic          ON public.owners(clinic_id);
CREATE INDEX idx_pets_clinic            ON public.pets(clinic_id);
CREATE INDEX idx_pets_owner             ON public.pets(owner_id);
CREATE INDEX idx_medical_records_clinic ON public.medical_records(clinic_id);
CREATE INDEX idx_medical_records_pet    ON public.medical_records(pet_id);
CREATE INDEX idx_appointments_clinic    ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_pet       ON public.appointments(pet_id);
CREATE INDEX idx_appointments_time      ON public.appointments(start_time);
CREATE INDEX idx_invoices_clinic        ON public.invoices(clinic_id);
CREATE INDEX idx_invoices_owner         ON public.invoices(owner_id);
CREATE INDEX idx_invoice_items_invoice  ON public.invoice_items(invoice_id);

-- ============================================================
-- 10. HELPER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================

-- CLINICS
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own clinic"
    ON public.clinics FOR SELECT
    USING (id = public.get_my_clinic_id());

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view profiles in their clinic"
    ON public.profiles FOR SELECT
    USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- TENANT-SCOPED TABLES
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'owners', 'pets', 'medical_records', 'appointments', 'invoices'
    ] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format(
            'CREATE POLICY "Tenant isolation SELECT on %I" ON public.%I FOR SELECT USING (clinic_id = public.get_my_clinic_id());',
            tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "Tenant isolation INSERT on %I" ON public.%I FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id());',
            tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "Tenant isolation UPDATE on %I" ON public.%I FOR UPDATE USING (clinic_id = public.get_my_clinic_id());',
            tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "Tenant isolation DELETE on %I" ON public.%I FOR DELETE USING (clinic_id = public.get_my_clinic_id());',
            tbl, tbl);
    END LOOP;
END $$;

-- INVOICE ITEMS
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation SELECT on invoice_items"
    ON public.invoice_items FOR SELECT
    USING (invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = public.get_my_clinic_id()));
CREATE POLICY "Tenant isolation INSERT on invoice_items"
    ON public.invoice_items FOR INSERT
    WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = public.get_my_clinic_id()));
CREATE POLICY "Tenant isolation UPDATE on invoice_items"
    ON public.invoice_items FOR UPDATE
    USING (invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = public.get_my_clinic_id()));
CREATE POLICY "Tenant isolation DELETE on invoice_items"
    ON public.invoice_items FOR DELETE
    USING (invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = public.get_my_clinic_id()));

-- ============================================================
-- 12. STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-images', 'medical-images', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated users can upload medical images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'medical-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view medical images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'medical-images' AND auth.role() = 'authenticated');
