import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PetProfileClient } from "./pet-profile-client";

export default async function PetProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  /* ── Parallel data fetching ── */
  const [petRes, appointmentsRes, recordsRes] = await Promise.all([
    supabase
      .from("pets")
      .select("*, owners(id, first_name, last_name, email, phone, address)")
      .eq("id", id)
      .single(),
    supabase
      .from("appointments")
      .select("*, profiles:vet_id(full_name)")
      .eq("pet_id", id)
      .order("start_time", { ascending: false }),
    supabase
      .from("medical_records")
      .select("id, visit_date, chief_complaint, diagnosis, treatment, cost")
      .eq("pet_id", id)
      .order("visit_date", { ascending: false }),
  ]);

  if (!petRes.data) return notFound();

  return (
    <PetProfileClient
      pet={petRes.data as any}
      appointments={(appointmentsRes.data as any[]) ?? []}
      medicalRecords={(recordsRes.data as any[]) ?? []}
    />
  );
}
