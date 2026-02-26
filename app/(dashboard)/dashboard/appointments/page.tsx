import { createClient } from "@/lib/supabase/server";
import { AppointmentsClient } from "./appointments-client";

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const [appointmentsRes, petsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, pets(name, owners(first_name, last_name))")
      .order("start_time", { ascending: true }),
    supabase
      .from("pets")
      .select("id, name, owner_id, owners(first_name, last_name)")
      .order("name"),
  ]);

  const petsForClient = (petsRes.data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    owner_id: p.owner_id as string,
    owners: Array.isArray(p.owners) && p.owners.length > 0
      ? (p.owners[0] as { first_name: string; last_name: string })
      : null,
  }));

  return (
    <AppointmentsClient
      appointments={appointmentsRes.data ?? []}
      pets={petsForClient}
    />
  );
}
