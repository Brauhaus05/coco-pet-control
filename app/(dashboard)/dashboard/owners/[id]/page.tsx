import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { OwnerProfileClient } from "./owner-profile-client";

export default async function OwnerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [ownerRes, petsRes, appointmentsRes, invoicesRes] = await Promise.all([
    supabase.from("owners").select("*").eq("id", id).single(),
    supabase
      .from("pets")
      .select("id, name, species, breed, date_of_birth, sex, weight_kg")
      .eq("owner_id", id)
      .order("name"),
    supabase
      .from("appointments")
      .select("id, start_time, end_time, reason, status, pets(name), profiles:vet_id(full_name)")
      .eq("pets.owner_id", id)
      .order("start_time", { ascending: false })
      .limit(10),
    supabase
      .from("invoices")
      .select("id, status, issue_date, due_date, tax_rate, notes")
      .eq("owner_id", id)
      .order("issue_date", { ascending: false })
      .limit(10),
  ]);

  if (!ownerRes.data) return notFound();

  return (
    <OwnerProfileClient
      owner={ownerRes.data as any}
      pets={(petsRes.data as any[]) ?? []}
      appointments={(appointmentsRes.data as any[]) ?? []}
      invoices={(invoicesRes.data as any[]) ?? []}
    />
  );
}
