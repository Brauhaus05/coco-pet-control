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

  /* ── Parallel data fetching ── */
  const [appointmentRes, vitalsRes, prescriptionsRes, recommendationsRes] =
    await Promise.all([
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
        .from("appointment_vitals")
        .select("*")
        .eq("appointment_id", id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("appointment_prescriptions")
        .select("*")
        .eq("appointment_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("appointment_recommendations")
        .select("*")
        .eq("appointment_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (!appointmentRes.data) return notFound();

  return (
    <AppointmentSummaryClient
      appointment={appointmentRes.data as any}
      vitals={(vitalsRes.data as any[]) ?? []}
      prescriptions={(prescriptionsRes.data as any[]) ?? []}
      recommendations={(recommendationsRes.data as any[]) ?? []}
    />
  );
}
