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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Image, Eye } from "lucide-react";
import { toast } from "sonner";
import { RecordDialog } from "./record-dialog";
import { format } from "date-fns";
import { DataPagination } from "@/components/data-pagination";
import { formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 15;

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
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MedicalRecordWithPet | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.pets?.name ?? "").toLowerCase().includes(q) ||
      (r.diagnosis ?? "").toLowerCase().includes(q) ||
      (r.chief_complaint ?? "").toLowerCase().includes(q) ||
      (r.treatment ?? "").toLowerCase().includes(q)
    );
  });

  async function confirmDelete() {
    if (!deleteId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("medical_records")
      .delete()
      .eq("id", deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success("Record deleted");
      router.refresh();
    }
    setDeleteId(null);
  }



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Medical Records
          </h1>
          <p className="text-muted-foreground mt-1">
            Visit history, diagnoses, and treatment records.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Record
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search records…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Pet</TableHead>
              <TableHead className="text-muted-foreground">Complaint</TableHead>
              <TableHead className="text-muted-foreground">Diagnosis</TableHead>
              <TableHead className="text-muted-foreground">Cost</TableHead>
              <TableHead className="text-muted-foreground">Files</TableHead>
              <TableHead className="text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  {search
                    ? "No records match your search."
                    : "No medical records yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((rec) => (
                <TableRow
                  key={rec.id}
                  className="border-border hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/medical-records/${rec.id}`)}
                >
                  <TableCell className="text-foreground whitespace-nowrap">
                    {format(new Date(rec.visit_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {rec.pets?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {rec.chief_complaint ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {rec.diagnosis ?? "—"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatCurrency(rec.cost)}
                  </TableCell>
                  <TableCell>
                    {rec.image_urls.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-muted text-muted-foreground border-border"
                      >
                        <Image className="w-3 h-3 mr-1" />
                        {rec.image_urls.length}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => router.push(`/dashboard/medical-records/${rec.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        onClick={() => setDeleteId(rec.id)}
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

      <DataPagination
        currentPage={page}
        totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      <RecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editing}
        pets={pets}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Medical Record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The medical record will be
              permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
