"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { InvoiceWithOwner } from "@/types/database";
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
import { Plus, Search, Pencil, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { InvoiceDialog } from "./invoice-dialog";
import { format } from "date-fns";

interface InvoicesClientProps {
  invoices: InvoiceWithOwner[];
  owners: { id: string; first_name: string; last_name: string }[];
}

export function InvoicesClient({ invoices, owners }: InvoicesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceWithOwner | null>(null);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const ownerName = inv.owners
      ? `${inv.owners.first_name} ${inv.owners.last_name}`
      : "";
    return (
      ownerName.toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q)
    );
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this invoice?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Invoice deleted");
      router.refresh();
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground border-border",
    sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    overdue: "bg-red-500/10 text-red-400 border-red-500/20",
    cancelled: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage invoices for pet owners.
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
          Create Invoice
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Invoice #</TableHead>
              <TableHead className="text-muted-foreground">Owner</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Total</TableHead>
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
                    ? "No invoices match your search."
                    : "No invoices yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="border-border hover:bg-accent transition-colors"
                >
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {inv.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {inv.owners
                      ? `${inv.owners.first_name} ${inv.owners.last_name}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(inv.issue_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize ${statusColors[inv.status] ?? ""}`}
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground font-medium">
                    {formatCurrency(inv.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        asChild
                      >
                        <Link href={`/dashboard/invoices/${inv.id}/print`}>
                          <Printer className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditing(inv);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        onClick={() => handleDelete(inv.id)}
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

      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={editing}
        owners={owners}
      />
    </div>
  );
}
