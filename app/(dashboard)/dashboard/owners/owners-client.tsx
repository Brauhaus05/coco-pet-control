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
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { OwnerDialog } from "./owner-dialog";

type OwnerWithCount = Owner & { pet_count: number };

export function OwnersClient({ owners }: { owners: OwnerWithCount[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            Owners
          </h1>
          <p className="text-zinc-400 mt-1">
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search owners…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Name</TableHead>
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Phone</TableHead>
              <TableHead className="text-zinc-400">Pets</TableHead>
              <TableHead className="text-zinc-400 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-zinc-500"
                >
                  {search ? "No owners match your search." : "No owners yet. Add your first owner above."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((owner) => (
                <TableRow
                  key={owner.id}
                  className="border-zinc-800 hover:bg-zinc-800/40 transition-colors"
                >
                  <TableCell className="font-medium text-zinc-200">
                    {owner.first_name} {owner.last_name}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {owner.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {owner.phone ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-300 border-zinc-700"
                    >
                      {owner.pet_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
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
                        className="h-8 w-8 text-zinc-400 hover:text-red-400"
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

      <OwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        owner={editing}
      />
    </div>
  );
}
