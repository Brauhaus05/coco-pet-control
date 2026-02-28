"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  PawPrint,
  CalendarDays,
  FileText,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { format, differenceInYears, differenceInMonths } from "date-fns";

/* ─── Types ─── */

interface OwnerData {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

interface PetData {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  date_of_birth: string | null;
  sex: string | null;
  weight_kg: number | null;
}

interface AppointmentData {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  status: string;
  pets: { name: string } | null;
  profiles: { full_name: string } | null;
}

interface InvoiceData {
  id: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  total: number;
  notes: string | null;
}

interface OwnerProfileClientProps {
  owner: OwnerData;
  pets: PetData[];
  appointments: AppointmentData[];
  invoices: InvoiceData[];
}

/* ─── Status styles ─── */

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "bg-blue-500/10", text: "text-blue-700" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-700" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-600" },
  "no-show": { bg: "bg-amber-500/10", text: "text-amber-700" },
  draft: { bg: "bg-muted", text: "text-muted-foreground" },
  sent: { bg: "bg-blue-500/10", text: "text-blue-600" },
  paid: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  overdue: { bg: "bg-red-500/10", text: "text-red-600" },
};

/* ─── Helpers ─── */

function computeAge(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  const years = differenceInYears(new Date(), birth);
  if (years >= 1) return `${years}y`;
  const months = differenceInMonths(new Date(), birth);
  return `${months}m`;
}

/* ─── Component ─── */

export function OwnerProfileClient({
  owner,
  pets,
  appointments,
  invoices,
}: OwnerProfileClientProps) {
  const fullName = `${owner.first_name} ${owner.last_name}`;
  const initials = `${owner.first_name[0]}${owner.last_name[0]}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/owners"
          className="hover:text-foreground transition-colors"
        >
          Owners
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{fullName}</span>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
            {initials}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {fullName}
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Client since {format(new Date(owner.created_at), "MMMM yyyy")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-border text-foreground hover:bg-accent"
          asChild
        >
          <Link href="/dashboard/owners">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Owners
          </Link>
        </Button>
      </div>

      {/* ── Contact Info + Pets ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Contact Info Card */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground">Contact Info</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground">
                  {owner.email || "—"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground">
                  {owner.phone || "—"}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  {owner.address || "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pets Card */}
        <Card className="bg-card border-border shadow-sm md:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-foreground">
                Pets ({pets.length})
              </h3>
            </div>
            {pets.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No pets registered for this owner.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pets.map((pet) => (
                  <Link
                    key={pet.id}
                    href={`/dashboard/pets/${pet.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-emerald-500/30 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center border-2 border-emerald-500/20 flex-shrink-0">
                      <PawPrint className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-emerald-600 transition-colors truncate">
                        {pet.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {pet.breed || pet.species}
                        {pet.date_of_birth && ` • ${computeAge(pet.date_of_birth)}`}
                        {pet.sex && ` • ${pet.sex}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Appointment History ── */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-semibold text-foreground">
              Recent Appointments
            </h3>
          </div>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No appointments found.
            </p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Pet</TableHead>
                    <TableHead className="text-muted-foreground">Reason</TableHead>
                    <TableHead className="text-muted-foreground">Vet</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt) => {
                    const s = STATUS_STYLES[apt.status] ?? STATUS_STYLES.scheduled;
                    return (
                      <TableRow key={apt.id} className="border-border hover:bg-accent transition-colors">
                        <TableCell className="text-foreground whitespace-nowrap">
                          {format(new Date(apt.start_time), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {apt.pets?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {apt.reason ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {apt.profiles?.full_name ? `Dr. ${apt.profiles.full_name}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${s.bg} ${s.text} border-0 text-xs`}>
                            {apt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                            <Link href={`/dashboard/appointments/${apt.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Invoices ── */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-rose-600" />
            </div>
            <h3 className="font-semibold text-foreground">Recent Invoices</h3>
          </div>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No invoices found.
            </p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Due</TableHead>
                    <TableHead className="text-muted-foreground">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const s = STATUS_STYLES[inv.status] ?? STATUS_STYLES.draft;
                    return (
                      <TableRow key={inv.id} className="border-border hover:bg-accent transition-colors">
                        <TableCell className="text-foreground whitespace-nowrap">
                          {format(new Date(inv.issue_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${s.bg} ${s.text} border-0 text-xs`}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {inv.due_date ? format(new Date(inv.due_date), "MMM dd, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {inv.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
