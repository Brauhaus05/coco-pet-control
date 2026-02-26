import { createClient } from "@/lib/supabase/server";
import { OwnersClient } from "./owners-client";

export default async function OwnersPage() {
  const supabase = await createClient();
  const { data: owners } = await supabase
    .from("owners")
    .select("*, pets(id)")
    .order("created_at", { ascending: false });

  const ownersWithPetCount = (owners ?? []).map((owner) => ({
    ...owner,
    pet_count: Array.isArray(owner.pets) ? owner.pets.length : 0,
    pets: undefined,
  }));

  return <OwnersClient owners={ownersWithPetCount} />;
}
