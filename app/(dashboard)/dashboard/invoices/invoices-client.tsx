"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { InvoiceWithOwner } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { InvoiceDialog } from "./invoice-dialog";
import { DataPagination } from "@/components/data-pagination";
import { format, differenceInCalendarDays } from "date-fns";
import { formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 15;

/* ─── Types ─── */

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
  owners: {
    first_name: string;
    last_name: string;
    email?: string | null;
  } | null;
};

interface InvoicesClientProps {
  invoices: InvoiceWithOwnerEmail[];
  owners: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
  }[];
  allItems: InvoiceItem[];
  appointments: AppointmentOption[];
}

/* ─── Helpers ─── */



const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  paid: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  overdue: "bg-red-500/10 text-red-600 border-red-500/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

function getDueDateInfo(inv: InvoiceWithOwnerEmail) {
  if (!inv.due_date || inv.status === "paid" || inv.status === "cancelled")
    return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(inv.due_date);
  due.setHours(0, 0, 0, 0);
  const daysUntil = differenceInCalendarDays(due, today);

  if (daysUntil < 0) {
    return {
      label: `${Math.abs(daysUntil)}d overdue`,
      className: "text-red-600 bg-red-500/10 border-red-500/20",
    };
  } else if (daysUntil === 0) {
    return {
      label: "Due today",
      className: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    };
  } else if (daysUntil <= 3) {
    return {
      label: `Due in ${daysUntil}d`,
      className: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    };
  } else if (daysUntil <= 7) {
    return {
      label: `Due in ${daysUntil}d`,
      className: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    };
  }
  return null; // > 7 days out — no indicator
}

/* ─── Component ─── */

export function InvoicesClient({
  invoices,
  owners,
  allItems,
  appointments,
}: InvoicesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceWithOwnerEmail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* ── KPI calculations ── */
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.total), 0);

  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "draft")
    .reduce((s, i) => s + Number(i.total), 0);

  const overdueCount = invoices.filter((i) => {
    if (i.status === "overdue") return true;
    if (
      i.due_date &&
      i.status !== "paid" &&
      i.status !== "cancelled" &&
      new Date(i.due_date) < new Date()
    )
      return true;
    return false;
  }).length;

  /* ── Filtering ── */
  const filtered = invoices.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
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

  /* ── Actions ── */
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

  const [sending, setSending] = useState<string | null>(null);

  async function handleSendEmail(inv: InvoiceWithOwnerEmail) {
    const ownerEmail = inv.owners?.email;
    if (!ownerEmail) {
      toast.error("This owner has no email address on file.");
      return;
    }

    setSending(inv.id);
    try {
      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: inv.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to send email");
        return;
      }

      toast.success(data.message ?? `Invoice sent to ${ownerEmail}`);
      router.refresh(); // Refresh to pick up status change (draft → sent)
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSending(null);
    }
  }

  const editingItems = editing
    ? allItems.filter((i) => i.invoice_id === editing.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
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
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-orange-500/10 p-3">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-blue-500/10 p-3">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Outstanding
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(outstanding)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-red-500/10 p-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Overdue
              </p>
              <p className="text-2xl font-bold text-foreground">
                {overdueCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Status filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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

      {/* ── Table ── */}
      {invoices.length === 0 && !search && statusFilter === "all" ? (
        /* Rich empty state */
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-5">
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No invoices yet
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Create your first invoice to start tracking payments from pet
            owners. Invoices can include multiple line items and be sent
            directly via email.
          </p>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create your first invoice
          </Button>
        </div>
      ) : (
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
                    No invoices match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((inv) => {
                  const dueBadge = getDueDateInfo(inv);
                  return (
                    <TableRow
                      key={inv.id}
                      className="border-border hover:bg-accent transition-colors"
                    >
                      <TableCell className="font-mono text-foreground text-xs font-semibold">
                        INV-
                        {String(inv.invoice_number ?? "").padStart(3, "0")}
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
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`capitalize ${statusColors[inv.status] ?? ""}`}
                          >
                            {inv.status}
                          </Badge>
                          {dueBadge && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${dueBadge.className}`}
                            >
                              {dueBadge.label}
                            </Badge>
                          )}
                        </div>
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
                            disabled={sending === inv.id}
                            onClick={() => handleSendEmail(inv)}
                          >
                            {sending === inv.id ? (
                              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Print / PDF"
                            asChild
                          >
                            <Link
                              href={`/dashboard/invoices/${inv.id}/print`}
                            >
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <DataPagination
        currentPage={page}
        totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

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
