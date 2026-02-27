import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { RecordDetailClient } from "./record-detail-client";

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("medical_records")
    .select("*, pets(id, name, species, breed, date_of_birth, owners(first_name, last_name))")
    .eq("id", id)
    .single();

  if (!record) return notFound();

  return <RecordDetailClient record={record as any} />;
}
