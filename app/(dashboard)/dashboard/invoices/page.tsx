import { createClient } from "@/lib/supabase/server";
import { InvoicesClient } from "./invoices-client";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const [invoicesRes, ownersRes, itemsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, owners(first_name, last_name, email)")
      .order("created_at", { ascending: false }),
    supabase
      .from("owners")
      .select("id, first_name, last_name, email")
      .order("last_name"),
    supabase
      .from("invoice_items")
      .select("id, invoice_id, description, quantity, unit_price")
      .order("id"),
  ]);

  // Appointments fetch is optional — may fail if schema hasn't been migrated
  const appointmentsRes = await supabase
    .from("appointments")
    .select("id, start_time, reason, pets(name)")
    .order("start_time", { ascending: false });

  // Normalize pets shape: Supabase returns object for single FK, but TS may infer array
  const appointments = (appointmentsRes.data ?? []).map((a: any) => ({
    id: a.id as string,
    start_time: a.start_time as string,
    reason: a.reason as string | null,
    pets: a.pets
      ? { name: Array.isArray(a.pets) ? a.pets[0]?.name : a.pets.name }
      : null,
  }));

  return (
    <InvoicesClient
      invoices={(invoicesRes.data as any[]) ?? []}
      owners={ownersRes.data ?? []}
      allItems={itemsRes.data ?? []}
      appointments={appointments}
    />
  );
}
