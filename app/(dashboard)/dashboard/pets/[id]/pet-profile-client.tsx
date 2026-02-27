"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight,
  Pencil,
  Plus,
  AlertTriangle,
  Syringe,
  Clock,
  Phone,
  Mail,
  ChevronDown,
  PawPrint,
} from "lucide-react";
import { format, differenceInYears, differenceInMonths } from "date-fns";

/* ─── Types ─── */

interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  date_of_birth: string | null;
  sex: string | null;
  weight_kg: number | null;
  notes: string | null;
  owners: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
}

interface AppointmentRow {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  notes: string | null;
  status: string;
  profiles: { full_name: string } | null;
}

interface MedicalRecordRow {
  id: string;
  visit_date: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  treatment: string | null;
  cost: number;
}

interface PetProfileClientProps {
  pet: PetProfile;
  appointments: AppointmentRow[];
  medicalRecords: MedicalRecordRow[];
}

/* ─── Helpers ─── */

function computeAge(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  const years = differenceInYears(new Date(), birth);
  if (years >= 1) return `${years} Yr${years !== 1 ? "s" : ""}`;
  const months = differenceInMonths(new Date(), birth);
  return `${months} Mo${months !== 1 ? "s" : ""}`;
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const typeColors: Record<string, string> = {
  "check-up": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  vaccination: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  emergency: "bg-red-500/10 text-red-600 border-red-500/20",
  surgery: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  dental: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const statusDot: Record<string, string> = {
  completed: "bg-emerald-500",
  scheduled: "bg-blue-500",
  cancelled: "bg-zinc-400",
  "no-show": "bg-red-500",
};

/* ─── Component ─── */

export function PetProfileClient({
  pet,
  appointments,
  medicalRecords,
}: PetProfileClientProps) {
  const [historyFilter, setHistoryFilter] = useState("all");
  const [showAllHistory, setShowAllHistory] = useState(false);

  const owner = pet.owners;
  const totalVisits = appointments.length;
  const totalRecords = medicalRecords.length;

  /* Filter appointments by time range */
  const filteredAppointments = appointments.filter((a) => {
    if (historyFilter === "all") return true;
    const months = parseInt(historyFilter);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return new Date(a.start_time) >= cutoff;
  });

  const displayedAppointments = showAllHistory
    ? filteredAppointments
    : filteredAppointments.slice(0, 5);

  /* Classify appointment reason into a type tag */
  function getAppointmentType(reason: string | null): string {
    if (!reason) return "visit";
    const r = reason.toLowerCase();
    if (r.includes("vaccin")) return "vaccination";
    if (r.includes("check") || r.includes("routine") || r.includes("wellness"))
      return "check-up";
    if (r.includes("emergency") || r.includes("urgent")) return "emergency";
    if (r.includes("surgery") || r.includes("spay") || r.includes("neuter"))
      return "surgery";
    if (r.includes("dental") || r.includes("teeth")) return "dental";
    return "visit";
  }

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb + Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link
              href="/dashboard/pets"
              className="hover:text-foreground transition-colors"
            >
              Pets
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">
              {pet.name} Profile
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Pet Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Detailed information and medical history.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-accent"
            asChild
          >
            <Link href={`/dashboard/pets`}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
          <Button
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
            asChild
          >
            <Link href="/dashboard/appointments">
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* ──── LEFT COLUMN ──── */}
        <div className="space-y-6">
          {/* Pet Identity Card */}
          <Card className="bg-card border-border shadow-sm overflow-hidden">
            <CardContent className="p-6 text-center">
              {/* Avatar placeholder */}
              <div className="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4 border-4 border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                <PawPrint className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {pet.name}
              </h2>
              <p className="text-muted-foreground mt-1">
                {pet.breed ?? pet.species}
                {pet.sex && pet.sex !== "unknown" ? (
                  <>
                    {" "}
                    •{" "}
                    <span className="capitalize">{pet.sex}</span>
                  </>
                ) : null}
              </p>

              {/* Age / Weight */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Age
                  </p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {computeAge(pet.date_of_birth)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Weight
                  </p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {pet.weight_kg ? `${pet.weight_kg} kg` : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner Card */}
          {owner && (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Owner
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-sm font-bold text-emerald-600 flex-shrink-0">
                    {getInitials(owner.first_name, owner.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {owner.first_name} {owner.last_name}
                    </p>
                    {owner.phone && (
                      <p className="text-xs text-muted-foreground truncate">
                        {owner.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {owner.phone && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                        asChild
                      >
                        <a href={`tel:${owner.phone}`}>
                          <Phone className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {owner.email && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                        asChild
                      >
                        <a href={`mailto:${owner.email}`}>
                          <Mail className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Important Notes */}
          {pet.notes && (
            <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm">
              <CardContent className="p-5">
                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-2">
                  Important Notes
                </p>
                <div className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">{pet.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2">
                  <Syringe className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {totalRecords}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Records</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {totalVisits}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Visits</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ──── RIGHT COLUMN ──── */}
        <div className="space-y-6">
          {/* Appointment History */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-5 pb-0">
                <h3 className="text-lg font-semibold text-foreground">
                  Appointment History
                </h3>
                <Select
                  value={historyFilter}
                  onValueChange={setHistoryFilter}
                >
                  <SelectTrigger className="w-[150px] h-8 text-xs bg-muted border-border text-foreground">
                    <SelectValue placeholder="Time range" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem
                      value="all"
                      className="text-foreground focus:bg-accent text-xs"
                    >
                      All time
                    </SelectItem>
                    <SelectItem
                      value="6"
                      className="text-foreground focus:bg-accent text-xs"
                    >
                      Last 6 Months
                    </SelectItem>
                    <SelectItem
                      value="3"
                      className="text-foreground focus:bg-accent text-xs"
                    >
                      Last 3 Months
                    </SelectItem>
                    <SelectItem
                      value="1"
                      className="text-foreground focus:bg-accent text-xs"
                    >
                      Last Month
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {displayedAppointments.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No appointments found for this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full mt-4">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-5 pb-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          Date
                        </th>
                        <th className="text-left pb-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          Type
                        </th>
                        <th className="text-left pb-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          Doctor
                        </th>
                        <th className="text-left pb-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          Status
                        </th>
                        <th className="text-left pb-3 pr-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedAppointments.map((a) => {
                        const type = getAppointmentType(a.reason);
                        const vetName =
                          a.profiles?.full_name ?? "—";
                        const vetInitials = vetName !== "—"
                          ? vetName
                              .split(" ")
                              .map((w: string) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : "";

                        return (
                          <tr
                            key={a.id}
                            className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                          >
                            <td className="px-5 py-3">
                              <p className="text-sm font-medium text-foreground">
                                {format(
                                  new Date(a.start_time),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {format(new Date(a.start_time), "hh:mm a")}
                              </p>
                            </td>
                            <td className="py-3">
                              <Badge
                                variant="outline"
                                className={`capitalize text-[11px] ${typeColors[type] ?? "bg-muted text-muted-foreground border-border"}`}
                              >
                                {type}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                {vetInitials && (
                                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                                    {vetInitials}
                                  </div>
                                )}
                                <span className="text-sm text-foreground truncate max-w-[100px]">
                                  {vetName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`w-2 h-2 rounded-full ${statusDot[a.status] ?? "bg-zinc-400"}`}
                                />
                                <span className="text-sm text-muted-foreground capitalize">
                                  {a.status}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 pr-5">
                              <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                                {a.notes || a.reason || "—"}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredAppointments.length > 5 && (
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors border-t border-border flex items-center justify-center gap-1"
                >
                  {showAllHistory
                    ? "Show Less"
                    : `Show More History (${filteredAppointments.length - 5} more)`}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showAllHistory ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </CardContent>
          </Card>

          {/* Medical Records Summary */}
          {medicalRecords.length > 0 && (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-5 pb-0">
                  <h3 className="text-lg font-semibold text-foreground">
                    Recent Medical Records
                  </h3>
                  <Link
                    href="/dashboard/medical-records"
                    className="text-sm text-emerald-600 hover:text-emerald-500 transition-colors font-medium"
                  >
                    View All
                  </Link>
                </div>
                <div className="p-5 space-y-3">
                  {medicalRecords.slice(0, 4).map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Syringe className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {rec.chief_complaint || rec.diagnosis || "Visit"}
                        </p>
                        {rec.treatment && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {rec.treatment}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {format(new Date(rec.visit_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      {rec.cost > 0 && (
                        <span className="text-xs font-medium text-foreground">
                          ${rec.cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
