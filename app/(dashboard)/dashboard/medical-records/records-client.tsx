"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MedicalRecordWithPet } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Image } from "lucide-react";
import { toast } from "sonner";
import { RecordDialog } from "./record-dialog";
import { format } from "date-fns";

interface MedicalRecordsClientProps {
  records: MedicalRecordWithPet[];
  pets: {
    id: string;
    name: string;
    owner_id: string;
    owners: { first_name: string; last_name: string } | null;
  }[];
}

export function MedicalRecordsClient({
  records,
  pets,
}: MedicalRecordsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MedicalRecordWithPet | null>(null);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.pets?.name ?? "").toLowerCase().includes(q) ||
      (r.diagnosis ?? "").toLowerCase().includes(q) ||
      (r.chief_complaint ?? "").toLowerCase().includes(q) ||
      (r.treatment ?? "").toLowerCase().includes(q)
    );
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this medical record?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("medical_records")
      .delete()
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Record deleted");
      router.refresh();
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            Medical Records
          </h1>
          <p className="text-zinc-400 mt-1">
            Visit history, diagnoses, and treatment records.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Record
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search records…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
        />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="text-zinc-400">Pet</TableHead>
              <TableHead className="text-zinc-400">Complaint</TableHead>
              <TableHead className="text-zinc-400">Diagnosis</TableHead>
              <TableHead className="text-zinc-400">Cost</TableHead>
              <TableHead className="text-zinc-400">Files</TableHead>
              <TableHead className="text-zinc-400 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-zinc-500"
                >
                  {search
                    ? "No records match your search."
                    : "No medical records yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((rec) => (
                <TableRow
                  key={rec.id}
                  className="border-zinc-800 hover:bg-zinc-800/40 transition-colors"
                >
                  <TableCell className="text-zinc-300 whitespace-nowrap">
                    {format(new Date(rec.visit_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium text-zinc-200">
                    {rec.pets?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-400 max-w-[200px] truncate">
                    {rec.chief_complaint ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-400 max-w-[200px] truncate">
                    {rec.diagnosis ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {formatCurrency(rec.cost)}
                  </TableCell>
                  <TableCell>
                    {rec.image_urls.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-zinc-800 text-zinc-300 border-zinc-700"
                      >
                        <Image className="w-3 h-3 mr-1" />
                        {rec.image_urls.length}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                        onClick={() => {
                          setEditing(rec);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-red-400"
                        onClick={() => handleDelete(rec.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editing}
        pets={pets}
      />
    </div>
  );
}
