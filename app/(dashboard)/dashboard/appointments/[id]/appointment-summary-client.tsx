"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Printer,
} from "lucide-react";
import {
  format,
  differenceInMinutes,
  differenceInYears,
  differenceInMonths,
} from "date-fns";
import { toast } from "sonner";
import type {
  AppointmentVitals,
  AppointmentPrescription,
  AppointmentRecommendation,
} from "@/types/database";

/* ─── Types ─── */

interface AppointmentData {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  room: string | null;
  appointment_number: number | null;
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

interface AppointmentSummaryClientProps {
  appointment: AppointmentData;
  vitals: AppointmentVitals[];
  prescriptions: AppointmentPrescription[];
  recommendations: AppointmentRecommendation[];
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

const PRESCRIPTION_STATUS: Record<
  string,
  { dot: string; label: string }
> = {
  administered: { dot: "bg-emerald-500", label: "Administered" },
  dispensed: { dot: "bg-orange-500", label: "Dispensed" },
  pending: { dot: "bg-blue-500", label: "Pending" },
  cancelled: { dot: "bg-zinc-400", label: "Cancelled" },
};

const PRIORITY_ICONS: Record<
  string,
  { color: string; bgColor: string }
> = {
  routine: { color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  important: { color: "text-orange-600", bgColor: "bg-orange-500/10" },
  urgent: { color: "text-red-600", bgColor: "bg-red-500/10" },
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

/* ─── Component ─── */

export function AppointmentSummaryClient({
  appointment,
  vitals: initialVitals,
  prescriptions: initialPrescriptions,
  recommendations: initialRecommendations,
}: AppointmentSummaryClientProps) {
  const router = useRouter();
  const apt = appointment;
  const pet = apt.pets;
  const owner = pet?.owners ?? null;
  const vet = apt.profiles;
  const status = STATUS_STYLES[apt.status] ?? STATUS_STYLES.scheduled;
  const appointmentNumber = apt.appointment_number
    ? `AP-${new Date(apt.created_at).getFullYear()}-${String(apt.appointment_number).padStart(3, "0")}`
    : `AP-${new Date(apt.created_at).getFullYear()}-${apt.id.slice(0, 4).toUpperCase()}`;

  // Local state for inline data
  const [vitals, setVitals] = useState<AppointmentVitals[]>(initialVitals);
  const [prescriptions, setPrescriptions] =
    useState<AppointmentPrescription[]>(initialPrescriptions);
  const [recommendations, setRecommendations] =
    useState<AppointmentRecommendation[]>(initialRecommendations);

  // Form visibility toggles
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);

  // Form state
  const [vitalsForm, setVitalsForm] = useState({
    weight_lbs: "",
    temperature_f: "",
    heart_rate_bpm: "",
  });
  const [prescriptionForm, setPrescriptionForm] = useState({
    item_name: "",
    type: "vaccination" as string,
    dosage_instructions: "",
    quantity: "",
    status: "pending" as string,
  });
  const [recommendationForm, setRecommendationForm] = useState({
    title: "",
    description: "",
    priority: "routine" as string,
  });
  const [saving, setSaving] = useState(false);

  /* ─── Inline CRUD handlers ─── */

  async function handleSaveVitals() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      appointment_id: apt.id,
      weight_lbs: vitalsForm.weight_lbs ? parseFloat(vitalsForm.weight_lbs) : null,
      temperature_f: vitalsForm.temperature_f
        ? parseFloat(vitalsForm.temperature_f)
        : null,
      heart_rate_bpm: vitalsForm.heart_rate_bpm
        ? parseInt(vitalsForm.heart_rate_bpm)
        : null,
    };
    const { data, error } = await supabase
      .from("appointment_vitals")
      .upsert(
        vitals.length > 0
          ? { ...payload, id: vitals[0].id }
          : payload
      )
      .select()
      .single();
    if (error) toast.error(error.message);
    else {
      toast.success("Vitals saved");
      setVitals([data as AppointmentVitals]);
      setShowVitalsForm(false);
    }
    setSaving(false);
  }

  async function handleSavePrescription() {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("appointment_prescriptions")
      .insert({
        appointment_id: apt.id,
        item_name: prescriptionForm.item_name,
        type: prescriptionForm.type,
        dosage_instructions: prescriptionForm.dosage_instructions || null,
        quantity: prescriptionForm.quantity || null,
        status: prescriptionForm.status,
      })
      .select()
      .single();
    if (error) toast.error(error.message);
    else {
      toast.success("Prescription added");
      setPrescriptions((prev) => [...prev, data as AppointmentPrescription]);
      setPrescriptionForm({
        item_name: "",
        type: "vaccination",
        dosage_instructions: "",
        quantity: "",
        status: "pending",
      });
      setShowPrescriptionForm(false);
    }
    setSaving(false);
  }

  async function handleDeletePrescription(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("appointment_prescriptions")
      .delete()
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Prescription removed");
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function handleSaveRecommendation() {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("appointment_recommendations")
      .insert({
        appointment_id: apt.id,
        title: recommendationForm.title,
        description: recommendationForm.description || null,
        priority: recommendationForm.priority,
      })
      .select()
      .single();
    if (error) toast.error(error.message);
    else {
      toast.success("Recommendation added");
      setRecommendations((prev) => [
        ...prev,
        data as AppointmentRecommendation,
      ]);
      setRecommendationForm({
        title: "",
        description: "",
        priority: "routine",
      });
      setShowRecommendationForm(false);
    }
    setSaving(false);
  }

  async function handleDeleteRecommendation(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("appointment_recommendations")
      .delete()
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Recommendation removed");
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    }
  }

  const currentVitals = vitals[0] ?? null;

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
                      {pet.date_of_birth &&
                        `, ${computeAge(pet.date_of_birth)}`}
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
                    Room
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {apt.room || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vital Signs */}
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <HeartPulse className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="font-semibold text-foreground">Vital Signs</h3>
              </div>
              {!showVitalsForm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (currentVitals) {
                      setVitalsForm({
                        weight_lbs: currentVitals.weight_lbs?.toString() ?? "",
                        temperature_f:
                          currentVitals.temperature_f?.toString() ?? "",
                        heart_rate_bpm:
                          currentVitals.heart_rate_bpm?.toString() ?? "",
                      });
                    }
                    setShowVitalsForm(true);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {currentVitals ? "Edit" : "Add"}
                </Button>
              )}
            </div>

            {showVitalsForm ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Weight (lbs)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={vitalsForm.weight_lbs}
                    onChange={(e) =>
                      setVitalsForm((p) => ({
                        ...p,
                        weight_lbs: e.target.value,
                      }))
                    }
                    placeholder="64.5"
                    className="h-8 bg-muted border-border text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Temperature (°F)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={vitalsForm.temperature_f}
                    onChange={(e) =>
                      setVitalsForm((p) => ({
                        ...p,
                        temperature_f: e.target.value,
                      }))
                    }
                    placeholder="101.2"
                    className="h-8 bg-muted border-border text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Heart Rate (bpm)
                  </label>
                  <Input
                    type="number"
                    value={vitalsForm.heart_rate_bpm}
                    onChange={(e) =>
                      setVitalsForm((p) => ({
                        ...p,
                        heart_rate_bpm: e.target.value,
                      }))
                    }
                    placeholder="82"
                    className="h-8 bg-muted border-border text-foreground text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={handleSaveVitals}
                    className="h-7 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                  >
                    {saving && (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowVitalsForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-muted-foreground">
                      Weight
                    </span>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {currentVitals?.weight_lbs
                      ? `${currentVitals.weight_lbs} lbs`
                      : pet?.weight_kg
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
                  <span
                    className={`text-lg font-bold ${currentVitals?.temperature_f ? "text-foreground" : "text-muted-foreground/40"}`}
                  >
                    {currentVitals?.temperature_f
                      ? `${currentVitals.temperature_f} °F`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">
                      Heart Rate
                    </span>
                  </div>
                  <span
                    className={`text-lg font-bold ${currentVitals?.heart_rate_bpm ? "text-foreground" : "text-muted-foreground/40"}`}
                  >
                    {currentVitals?.heart_rate_bpm
                      ? `${currentVitals.heart_rate_bpm} bpm`
                      : "—"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Veterinarian Notes & Recommendations ── */}
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

            {/* Recommended Next Steps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">
                  Recommended Next Steps
                </p>
                {!showRecommendationForm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowRecommendationForm(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {showRecommendationForm && (
                <div className="space-y-2 mb-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <Input
                    value={recommendationForm.title}
                    onChange={(e) =>
                      setRecommendationForm((p) => ({
                        ...p,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g. Schedule Dental Cleaning"
                    className="h-8 bg-card border-border text-foreground text-sm"
                  />
                  <Input
                    value={recommendationForm.description}
                    onChange={(e) =>
                      setRecommendationForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description (optional)"
                    className="h-8 bg-card border-border text-foreground text-sm"
                  />
                  <Select
                    value={recommendationForm.priority}
                    onValueChange={(v) =>
                      setRecommendationForm((p) => ({ ...p, priority: v }))
                    }
                  >
                    <SelectTrigger className="h-8 bg-card border-border text-foreground text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={saving || !recommendationForm.title}
                      onClick={handleSaveRecommendation}
                      className="h-7 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                    >
                      {saving && (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      )}
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowRecommendationForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {recommendations.length > 0 ? (
                <div className="space-y-2">
                  {recommendations.map((rec) => {
                    const pri =
                      PRIORITY_ICONS[rec.priority] ?? PRIORITY_ICONS.routine;
                    return (
                      <div
                        key={rec.id}
                        className={`p-3 rounded-lg border border-border ${pri.bgColor} group`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <CheckCircle2
                              className={`w-4 h-4 mt-0.5 ${pri.color} flex-shrink-0`}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {rec.title}
                              </p>
                              {rec.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {rec.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                            onClick={() => handleDeleteRecommendation(rec.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !showRecommendationForm && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border text-center">
                    <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No recommendations yet.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Prescriptions & Treatments ── */}
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
            <div className="flex gap-2">
              {prescriptions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-border text-foreground"
                  onClick={() => window.print()}
                >
                  <Printer className="w-3 h-3 mr-1" />
                  Print Prescription
                </Button>
              )}
              {!showPrescriptionForm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPrescriptionForm(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </div>

          {/* Inline add form */}
          {showPrescriptionForm && (
            <div className="p-4 mb-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Item Name
                  </label>
                  <Input
                    value={prescriptionForm.item_name}
                    onChange={(e) =>
                      setPrescriptionForm((p) => ({
                        ...p,
                        item_name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Rabies Vaccine (3 Year)"
                    className="h-8 bg-card border-border text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Type</label>
                  <Select
                    value={prescriptionForm.type}
                    onValueChange={(v) =>
                      setPrescriptionForm((p) => ({ ...p, type: v }))
                    }
                  >
                    <SelectTrigger className="h-8 bg-card border-border text-foreground text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="vaccination">Vaccination</SelectItem>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="procedure">Procedure</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Dosage / Instructions
                  </label>
                  <Input
                    value={prescriptionForm.dosage_instructions}
                    onChange={(e) =>
                      setPrescriptionForm((p) => ({
                        ...p,
                        dosage_instructions: e.target.value,
                      }))
                    }
                    placeholder="e.g. Injection, Right Rear Leg"
                    className="h-8 bg-card border-border text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Quantity
                  </label>
                  <Input
                    value={prescriptionForm.quantity}
                    onChange={(e) =>
                      setPrescriptionForm((p) => ({
                        ...p,
                        quantity: e.target.value,
                      }))
                    }
                    placeholder="e.g. 1 Dose"
                    className="h-8 bg-card border-border text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Status
                  </label>
                  <Select
                    value={prescriptionForm.status}
                    onValueChange={(v) =>
                      setPrescriptionForm((p) => ({ ...p, status: v }))
                    }
                  >
                    <SelectTrigger className="h-8 bg-card border-border text-foreground text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="administered">Administered</SelectItem>
                      <SelectItem value="dispensed">Dispensed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  disabled={saving || !prescriptionForm.item_name}
                  onClick={handleSavePrescription}
                  className="h-7 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                >
                  {saving && (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  )}
                  Add Prescription
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowPrescriptionForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Prescriptions table */}
          {prescriptions.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      Item Name
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Dosage / Instructions
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Quantity
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.map((rx) => {
                    const st =
                      PRESCRIPTION_STATUS[rx.status] ??
                      PRESCRIPTION_STATUS.pending;
                    return (
                      <TableRow
                        key={rx.id}
                        className="border-border hover:bg-accent/50 group"
                      >
                        <TableCell className="font-medium text-foreground">
                          {rx.item_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground capitalize">
                          {rx.type}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {rx.dosage_instructions || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {rx.quantity || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${st.dot}`}
                            />
                            <span className="text-sm text-foreground">
                              {st.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                            onClick={() => handleDeletePrescription(rx.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            !showPrescriptionForm && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  No prescriptions or treatments recorded
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Click &quot;Add&quot; to record prescriptions and treatments
                  for this visit.
                </p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
