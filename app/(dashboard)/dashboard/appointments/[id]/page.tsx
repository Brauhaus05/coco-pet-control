import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AppointmentSummaryClient } from "./appointment-summary-client";

export default async function AppointmentSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  /* ── Fetch the appointment with all related data ── */
  const [appointmentRes, profilesRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        `*,
        pets(
          id, name, species, breed, date_of_birth, sex, weight_kg,
          owners(id, first_name, last_name, email, phone, address)
        ),
        profiles:vet_id(id, full_name, role)`
      )
      .eq("id", id)
      .single(),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name"),
  ]);

  if (!appointmentRes.data) return notFound();

  return (
    <AppointmentSummaryClient
      appointment={appointmentRes.data as any}
      vets={(profilesRes.data as any[]) ?? []}
    />
  );
}
