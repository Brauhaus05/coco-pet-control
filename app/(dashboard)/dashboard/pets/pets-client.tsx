"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PetWithOwner } from "@/types/database";
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
import { PetDialog } from "./pet-dialog";
import { DataPagination } from "@/components/data-pagination";

const PAGE_SIZE = 15;

interface PetsClientProps {
  pets: PetWithOwner[];
  owners: { id: string; first_name: string; last_name: string }[];
}

export function PetsClient({ pets, owners }: PetsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PetWithOwner | null>(null);

  const filtered = pets.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.species.toLowerCase().includes(q) ||
      (p.breed ?? "").toLowerCase().includes(q) ||
      `${p.owners?.first_name ?? ""} ${p.owners?.last_name ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this pet and all linked records?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("pets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Pet deleted");
      router.refresh();
    }
  }

  const speciesColor: Record<string, string> = {
    dog: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    cat: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    bird: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    reptile: "bg-green-500/10 text-green-400 border-green-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Pets
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage patients and their profiles.
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
          Add Pet
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search pets…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Species</TableHead>
              <TableHead className="text-muted-foreground">Breed</TableHead>
              <TableHead className="text-muted-foreground">Owner</TableHead>
              <TableHead className="text-muted-foreground">Sex</TableHead>
              <TableHead className="text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  {search
                    ? "No pets match your search."
                    : "No pets yet. Add your first pet above."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((pet) => (
                <TableRow
                  key={pet.id}
                  className="border-border hover:bg-accent transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    <Link
                      href={`/dashboard/pets/${pet.id}`}
                      className="hover:text-emerald-600 transition-colors underline-offset-2 hover:underline"
                    >
                      {pet.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        speciesColor[pet.species.toLowerCase()] ??
                        "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {pet.species}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pet.breed ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pet.owners
                      ? `${pet.owners.first_name} ${pet.owners.last_name}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {pet.sex ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditing(pet);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        onClick={() => handleDelete(pet.id)}
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

      <PetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pet={editing}
        owners={owners}
      />
    </div>
  );
}
