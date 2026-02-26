import { createClient } from "@/lib/supabase/server";
import { MedicalRecordsClient } from "./records-client";

export default async function MedicalRecordsPage() {
  const supabase = await createClient();

  const [recordsRes, petsRes] = await Promise.all([
    supabase
      .from("medical_records")
      .select("*, pets(name)")
      .order("visit_date", { ascending: false }),
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
    <MedicalRecordsClient
      records={recordsRes.data ?? []}
      pets={petsForClient}
    />
  );
}
