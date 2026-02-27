"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  CalendarDays,
  Clock,
  User,
  Phone,
  PawPrint,
  Stethoscope,
  FileText,
  Weight,
  Thermometer,
  HeartPulse,
  ClipboardList,
  ArrowLeft,
  CalendarPlus,
} from "lucide-react";
import {
  format,
  differenceInMinutes,
  differenceInYears,
  differenceInMonths,
} from "date-fns";

/* ─── Types ─── */

interface AppointmentData {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  created_at: string;
  pets: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    date_of_birth: string | null;
    sex: string | null;
    weight_kg: number | null;
    owners: {
      id: string;
      first_name: string;
      last_name: string;
      email: string | null;
      phone: string | null;
      address: string | null;
    } | null;
  } | null;
  profiles: {
    id: string;
    full_name: string;
    role: string;
  } | null;
}

interface VetData {
  id: string;
  full_name: string;
  role: string;
}

interface AppointmentSummaryClientProps {
  appointment: AppointmentData;
  vets: VetData[];
}

/* ─── Status styles ─── */

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  scheduled: {
    bg: "bg-blue-500/10",
    text: "text-blue-700",
    label: "Scheduled",
  },
  completed: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    label: "Completed",
  },
  cancelled: {
    bg: "bg-red-500/10",
    text: "text-red-600",
    label: "Cancelled",
  },
  "no-show": {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    label: "No Show",
  },
};

/* ─── Helpers ─── */

function computeAge(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  const years = differenceInYears(new Date(), birth);
  if (years >= 1) return `${years} year${years !== 1 ? "s" : ""}`;
  const months = differenceInMonths(new Date(), birth);
  return `${months} month${months !== 1 ? "s" : ""}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function computeDuration(start: string, end: string): string {
  const mins = differenceInMinutes(new Date(end), new Date(start));
  if (mins < 60) return `${mins} mins`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function generateAppointmentNumber(id: string, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const shortId = id.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `AP-${year}-${shortId}`;
}

/* ─── Component ─── */

export function AppointmentSummaryClient({
  appointment,
  vets,
}: AppointmentSummaryClientProps) {
  const router = useRouter();
  const apt = appointment;
  const pet = apt.pets;
  const owner = pet?.owners ?? null;
  const vet = apt.profiles;
  const status = STATUS_STYLES[apt.status] ?? STATUS_STYLES.scheduled;
  const appointmentNumber = generateAppointmentNumber(apt.id, apt.created_at);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/appointments"
          className="hover:text-foreground transition-colors"
        >
          Appointments
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">
          Visit Report #{appointmentNumber}
        </span>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Appointment Summary
            </h1>
            <Badge
              variant="outline"
              className={`${status.bg} ${status.text} border-0 font-medium`}
            >
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {format(new Date(apt.start_time), "MMMM dd, yyyy")} at{" "}
            {format(new Date(apt.start_time), "h:mm a")}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-accent"
            onClick={() => router.push("/dashboard/appointments")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Appointments
          </Button>
          <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-500/20">
            <CalendarPlus className="w-4 h-4 mr-2" />
            Schedule Follow-up
          </Button>
        </div>
      </div>

      {/* ── Three-Column Info Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pet & Owner Info */}
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="font-semibold text-foreground">
                Pet & Owner Info
              </h3>
            </div>

            {pet ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center border-2 border-emerald-500/20 flex-shrink-0">
                    <PawPrint className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-lg">
                      {pet.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pet.breed ?? pet.species}
                      {pet.date_of_birth && `, ${computeAge(pet.date_of_birth)}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ID: #P-{pet.id.slice(0, 4).toUpperCase()}
                    </p>
                  </div>
                </div>

                {owner && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Owner
                    </p>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {owner.first_name} {owner.last_name}
                      </span>
                    </div>
                    {owner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {owner.phone}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No pet data.</p>
            )}
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-foreground">
                Appointment Details
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Reason for Visit
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {apt.reason || "—"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Attending Veterinarian
                </p>
                {vet ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-600 flex-shrink-0">
                      {getInitials(vet.full_name)}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Dr. {vet.full_name}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">—</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Duration
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {computeDuration(apt.start_time, apt.end_time)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Time
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {format(new Date(apt.start_time), "h:mm a")} –{" "}
                    {format(new Date(apt.end_time), "h:mm a")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vital Signs (placeholder — data not yet in schema) */}
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="font-semibold text-foreground">Vital Signs</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Weight className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Weight</span>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {pet?.weight_kg
                    ? `${(pet.weight_kg * 2.20462).toFixed(1)} lbs`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">
                    Temperature
                  </span>
                </div>
                <span className="text-lg font-bold text-muted-foreground/40">
                  —
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">
                    Heart Rate
                  </span>
                </div>
                <span className="text-lg font-bold text-muted-foreground/40">
                  —
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Veterinarian Notes ── */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-foreground">
              Veterinarian Notes & Recommendations
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Examination Notes */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Examination Notes
              </p>
              {apt.notes ? (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {apt.notes}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground italic">
                    No examination notes recorded for this visit.
                  </p>
                </div>
              )}
            </div>

            {/* Recommended Next Steps (placeholder until schema extension) */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Recommended Next Steps
              </p>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No recommendations recorded yet.
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Recommendations will be available after schema updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Prescriptions & Treatments (placeholder) ── */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-teal-600" />
              </div>
              <h3 className="font-semibold text-foreground">
                Prescriptions & Treatments Administered
              </h3>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              No prescriptions or treatments recorded
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              This section will be populated after the prescriptions schema is
              added.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
