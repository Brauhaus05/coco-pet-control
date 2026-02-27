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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Printer,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { InvoiceDialog } from "./invoice-dialog";
import { format } from "date-fns";

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface AppointmentOption {
  id: string;
  start_time: string;
  reason: string | null;
  pets: { name: string } | null;
}

type InvoiceWithOwnerEmail = InvoiceWithOwner & {
  owners: { first_name: string; last_name: string; email?: string | null } | null;
};

interface InvoicesClientProps {
  invoices: InvoiceWithOwnerEmail[];
  owners: { id: string; first_name: string; last_name: string; email?: string | null }[];
  allItems: InvoiceItem[];
  appointments: AppointmentOption[];
}

export function InvoicesClient({
  invoices,
  owners,
  allItems,
  appointments,
}: InvoicesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceWithOwnerEmail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = invoices.filter((inv) => {
    // Status filter
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;

    // Search filter
    const q = search.toLowerCase();
    if (!q) return true;
    const ownerName = inv.owners
      ? `${inv.owners.first_name} ${inv.owners.last_name}`
      : "";
    const invNum = `INV-${String(inv.invoice_number ?? "").padStart(3, "0")}`;
    return (
      ownerName.toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q) ||
      invNum.toLowerCase().includes(q)
    );
  });

  async function confirmDelete() {
    if (!deleteId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success("Invoice deleted");
      router.refresh();
    }
    setDeleteId(null);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  function handleSendEmail(inv: InvoiceWithOwnerEmail) {
    const ownerEmail = inv.owners?.email;
    if (!ownerEmail) {
      toast.error("This owner has no email address on file.");
      return;
    }
    const ownerName = `${inv.owners?.first_name} ${inv.owners?.last_name}`;
    const invNum = `INV-${String(inv.invoice_number ?? "").padStart(3, "0")}`;
    const subject = encodeURIComponent(`Invoice ${invNum} — ${formatCurrency(inv.total)}`);
    const body = encodeURIComponent(
      `Hi ${ownerName},\n\nPlease find attached invoice ${invNum} for ${formatCurrency(inv.total)}.\n\nIssued: ${format(new Date(inv.issue_date), "MMM dd, yyyy")}${inv.due_date ? `\nDue: ${format(new Date(inv.due_date), "MMM dd, yyyy")}` : ""}\n\nThank you!`
    );
    window.open(`mailto:${ownerEmail}?subject=${subject}&body=${body}`, "_self");
  }

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground border-border",
    sent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    overdue: "bg-red-500/10 text-red-600 border-red-500/20",
    cancelled: "bg-muted text-muted-foreground border-border",
  };

  const editingItems = editing
    ? allItems.filter((i) => i.invoice_id === editing.id)
    : [];

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

      {/* Search + Status filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border text-foreground">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem
              value="all"
              className="text-foreground focus:bg-accent"
            >
              All statuses
            </SelectItem>
            {["draft", "sent", "paid", "overdue", "cancelled"].map((s) => (
              <SelectItem
                key={s}
                value={s}
                className="text-foreground focus:bg-accent capitalize"
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">
                Invoice #
              </TableHead>
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
                  {search || statusFilter !== "all"
                    ? "No invoices match your search."
                    : "No invoices yet. Click Create Invoice to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="border-border hover:bg-accent transition-colors"
                >
                  <TableCell className="font-mono text-foreground text-xs font-semibold">
                    INV-{String(inv.invoice_number ?? "").padStart(3, "0")}
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
                        title="Send via email"
                        onClick={() => handleSendEmail(inv)}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Print / PDF"
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
                        title="Edit"
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
                        title="Delete"
                        onClick={() => setDeleteId(inv.id)}
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
        existingItems={editingItems}
        appointments={appointments}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete invoice?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The invoice and all its line items
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-muted-foreground hover:text-foreground">
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
