import { createClient } from "@/lib/supabase/server";
import { InvoicesClient } from "./invoices-client";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const [invoicesRes, ownersRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, owners(first_name, last_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("owners")
      .select("id, first_name, last_name")
      .order("last_name"),
  ]);

  return (
    <InvoicesClient
      invoices={invoicesRes.data ?? []}
      owners={ownersRes.data ?? []}
    />
  );
}
