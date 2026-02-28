import { createClient } from "@/lib/supabase/server";
import { AppointmentsClient } from "./appointments-client";

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const [appointmentsRes, petsRes, profilesRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, pets(name, owners(first_name, last_name))")
      .order("start_time", { ascending: true }),
    supabase
      .from("pets")
      .select("id, name, owner_id, owners(first_name, last_name)")
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name"),
  ]);

  const petsForClient = (petsRes.data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    owner_id: p.owner_id as string,
    owners: p.owners
      ? (p.owners as { first_name: string; last_name: string })
      : null,
  }));

  const vetsForClient = (profilesRes.data ?? []).map((v: Record<string, unknown>) => ({
    id: v.id as string,
    full_name: v.full_name as string,
    role: v.role as string,
  }));

  return (
    <AppointmentsClient
      appointments={appointmentsRes.data ?? []}
      pets={petsForClient}
      vets={vetsForClient}
    />
  );
}
