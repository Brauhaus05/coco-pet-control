"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Owner } from "@/types/database";
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
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { OwnerDialog } from "./owner-dialog";
import { DataPagination } from "@/components/data-pagination";

const PAGE_SIZE = 15;

type OwnerWithCount = Owner & { pet_count: number };

export function OwnersClient({ owners }: { owners: OwnerWithCount[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Owner | null>(null);

  const filtered = owners.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.first_name.toLowerCase().includes(q) ||
      o.last_name.toLowerCase().includes(q) ||
      (o.email ?? "").toLowerCase().includes(q) ||
      (o.phone ?? "").toLowerCase().includes(q)
    );
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this owner and all linked data?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("owners").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Owner deleted");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Owners
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage pet owners and their contact information.
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
          Add Owner
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search owners…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Phone</TableHead>
              <TableHead className="text-muted-foreground">Pets</TableHead>
              <TableHead className="text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  {search ? "No owners match your search." : "No owners yet. Add your first owner above."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((owner) => (
                <TableRow
                  key={owner.id}
                  className="border-border hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/owners/${owner.id}`)}
                >
                  <TableCell className="font-medium text-foreground">
                    {owner.first_name} {owner.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {owner.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {owner.phone ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-muted text-muted-foreground border-border"
                    >
                      {owner.pet_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => router.push(`/dashboard/owners/${owner.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditing(owner);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        onClick={() => handleDelete(owner.id)}
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

      <OwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        owner={editing}
      />
    </div>
  );
}
