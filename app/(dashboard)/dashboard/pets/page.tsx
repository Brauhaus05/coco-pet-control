import { createClient } from "@/lib/supabase/server";
import { PetsClient } from "./pets-client";

export default async function PetsPage() {
  const supabase = await createClient();

  const [petsRes, ownersRes] = await Promise.all([
    supabase
      .from("pets")
      .select("*, owners(first_name, last_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("owners")
      .select("id, first_name, last_name")
      .order("last_name"),
  ]);

  return (
    <PetsClient pets={petsRes.data ?? []} owners={ownersRes.data ?? []} />
  );
}
