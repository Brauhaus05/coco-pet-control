"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { createClient } from "@/lib/supabase/client";
import { AppointmentWithPet } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  CalendarDays,
  List,
  Search,
  Pencil,
  Trash2,
  CalendarPlus,
  Eye,
} from "lucide-react";
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
import { DataPagination } from "@/components/data-pagination";

const PAGE_SIZE = 15;
import { toast } from "sonner";
import { AppointmentDialog } from "./appointment-dialog";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

/* ─── Status colors for both calendar events and table badges ─── */
const STATUS_COLORS: Record<
  string,
  { bg: string; label: string; badge: string }
> = {
  scheduled: {
    bg: "#10b981",
    label: "Scheduled",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  completed: {
    bg: "#6366f1",
    label: "Completed",
    badge: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  cancelled: {
    bg: "#ef4444",
    label: "Cancelled",
    badge: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  "no-show": {
    bg: "#f59e0b",
    label: "No Show",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
};

interface AppointmentsClientProps {
  appointments: AppointmentWithPet[];
  pets: {
    id: string;
    name: string;
    owner_id: string;
    owners: { first_name: string; last_name: string } | null;
  }[];
  vets: {
    id: string;
    full_name: string;
    role: string;
  }[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: AppointmentWithPet;
}

export function AppointmentsClient({
  appointments,
  pets,
  vets,
}: AppointmentsClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentWithPet | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* ─── Calendar events ─── */
  const events: CalendarEvent[] = useMemo(
    () =>
      appointments.map((apt) => ({
        id: apt.id,
        title: `${apt.pets?.name ?? "Unknown"}${apt.pets?.owners ? ` · ${apt.pets.owners.first_name} ${apt.pets.owners.last_name}` : ""} — ${apt.reason ?? "Appointment"}`,
        start: new Date(apt.start_time),
        end: new Date(apt.end_time),
        resource: apt,
      })),
    [appointments]
  );

  /* ─── Filtered list for table view ─── */
  const filtered = useMemo(() => {
    let list = appointments;
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          (a.pets?.name ?? "").toLowerCase().includes(q) ||
          (a.reason ?? "").toLowerCase().includes(q) ||
          (a.pets?.owners
            ? `${a.pets.owners.first_name} ${a.pets.owners.last_name}`
                .toLowerCase()
                .includes(q)
            : false)
      );
    }
    return list;
  }, [appointments, statusFilter, search]);

  /* ─── Calendar handlers ─── */
  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      setEditing(null);
      setSelectedSlot({ start, end });
      setDialogOpen(true);
    },
    []
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    router.push(`/dashboard/appointments/${event.id}`);
  }, [router]);

  const handleEventDrop = useCallback(
    async ({
      event,
      start,
      end,
    }: {
      event: CalendarEvent;
      start: Date | string;
      end: Date | string;
    }) => {
      const startDate = start instanceof Date ? start : new Date(start);
      const endDate = end instanceof Date ? end : new Date(end);
      if (endDate <= startDate) {
        toast.error("End time must be after start time");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase
        .from("appointments")
        .update({
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        })
        .eq("id", event.id);
      if (error) toast.error(error.message);
      else {
        toast.success("Appointment rescheduled");
        router.refresh();
      }
    },
    [router]
  );

  const handleEventResize = useCallback(
    async ({
      event,
      start,
      end,
    }: {
      event: CalendarEvent;
      start: Date | string;
      end: Date | string;
    }) => {
      const startDate = start instanceof Date ? start : new Date(start);
      const endDate = end instanceof Date ? end : new Date(end);
      if (endDate <= startDate) {
        toast.error("End time must be after start time");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase
        .from("appointments")
        .update({
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        })
        .eq("id", event.id);
      if (error) toast.error(error.message);
      else {
        toast.success("Appointment updated");
        router.refresh();
      }
    },
    [router]
  );

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    return {
      style: {
        backgroundColor: STATUS_COLORS[status]?.bg ?? "#10b981",
        borderRadius: "6px",
        border: "none",
        color: "#fff",
        fontSize: "0.8rem",
        padding: "2px 6px",
      },
    };
  };

  /* ─── Table handlers ─── */
  async function confirmDelete() {
    if (!deleteId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success("Appointment deleted");
      router.refresh();
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Appointments
          </h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage patient appointments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === "calendar"
                  ? "bg-emerald-600 text-white"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-emerald-600 text-white"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setSelectedSlot(null);
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Appointment
          </Button>
        </div>
      </div>

      {/* ─── Calendar view ─── */}
      {viewMode === "calendar" && (
        <>
          <div className="relative rounded-xl border border-border bg-card p-4 calendar-light">
            {appointments.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 z-10 rounded-xl">
              <CalendarPlus className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                No appointments yet
              </p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                Click a time slot or use the button above to get started.
              </p>
            </div>
          )}
          <DnDCalendar
              localizer={localizer}
              events={events}
              startAccessor={(event: object) =>
                (event as CalendarEvent).start
              }
              endAccessor={(event: object) =>
                (event as CalendarEvent).end
              }
              defaultView={Views.WEEK}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              selectable
              resizable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={(event) =>
                handleSelectEvent(event as CalendarEvent)
              }
              onEventDrop={(args) => {
                const { event, start, end } = args as unknown as {
                  event: CalendarEvent;
                  start: Date;
                  end: Date;
                };
                handleEventDrop({ event, start, end });
              }}
              onEventResize={(args) => {
                const { event, start, end } = args as unknown as {
                  event: CalendarEvent;
                  start: Date;
                  end: Date;
                };
                handleEventResize({ event, start, end });
              }}
              eventPropGetter={(event) =>
                eventStyleGetter(event as CalendarEvent)
              }
              style={{ height: 650 }}
              step={30}
              timeslots={2}
              draggableAccessor={() => true}
            />
          </div>

          {/* ─── Status legend ─── */}
          <div className="flex flex-wrap items-center gap-4 px-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Legend:
            </span>
            {Object.entries(STATUS_COLORS).map(([key, { bg, label }]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: bg }}
                />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── List / table view ─── */}
      {viewMode === "list" && (
        <>
          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by pet, owner, or reason…"
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
                {Object.entries(STATUS_COLORS).map(([key, { label }]) => (
                  <SelectItem
                    key={key}
                    value={key}
                    className="text-foreground focus:bg-accent"
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Appt #</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Time</TableHead>
                  <TableHead className="text-muted-foreground">Pet</TableHead>
                  <TableHead className="text-muted-foreground">
                    Owner
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Reason
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-muted-foreground"
                    >
                      {search || statusFilter !== "all"
                        ? "No appointments match your filters."
                        : "No appointments yet. Click Add Appointment to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((apt) => (
                    <TableRow
                      key={apt.id}
                      className="border-border hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/appointments/${apt.id}`)}
                    >
                      <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                        {(apt as any).appointment_number
                          ? `AP-${new Date(apt.created_at).getFullYear()}-${String((apt as any).appointment_number).padStart(3, "0")}`
                          : `AP-${apt.id.slice(0, 6).toUpperCase()}`}
                      </TableCell>
                      <TableCell className="text-foreground whitespace-nowrap">
                        {format(new Date(apt.start_time), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(apt.start_time), "h:mm a")} –{" "}
                        {format(new Date(apt.end_time), "h:mm a")}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {apt.pets?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {apt.pets?.owners
                          ? `${apt.pets.owners.first_name} ${apt.pets.owners.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {apt.reason ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            STATUS_COLORS[apt.status]?.badge ??
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {STATUS_COLORS[apt.status]?.label ?? apt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                          onClick={() => router.push(`/dashboard/appointments/${apt.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditing(apt);
                            setSelectedSlot(null);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-400"
                          onClick={() => setDeleteId(apt.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
        </>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={editing}
        pets={pets}
        vets={vets}
        selectedSlot={selectedSlot}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete appointment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The appointment will be permanently
              removed.
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
