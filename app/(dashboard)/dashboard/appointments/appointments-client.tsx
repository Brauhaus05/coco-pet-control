"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { AppointmentWithPet } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AppointmentDialog } from "./appointment-dialog";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AppointmentsClientProps {
  appointments: AppointmentWithPet[];
  pets: {
    id: string;
    name: string;
    owner_id: string;
    owners: { first_name: string; last_name: string } | null;
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
}: AppointmentsClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentWithPet | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const events: CalendarEvent[] = useMemo(
    () =>
      appointments.map((apt) => ({
        id: apt.id,
        title: `${apt.pets?.name ?? "Unknown"} — ${apt.reason ?? "Appointment"}`,
        start: new Date(apt.start_time),
        end: new Date(apt.end_time),
        resource: apt,
      })),
    [appointments]
  );

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      setEditing(null);
      setSelectedSlot({ start, end });
      setDialogOpen(true);
    },
    []
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setEditing(event.resource);
    setSelectedSlot(null);
    setDialogOpen(true);
  }, []);

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    const colorMap: Record<string, string> = {
      scheduled: "#10b981",
      completed: "#6366f1",
      cancelled: "#ef4444",
      "no-show": "#f59e0b",
    };
    return {
      style: {
        backgroundColor: colorMap[status] ?? "#10b981",
        borderRadius: "6px",
        border: "none",
        color: "#fff",
        fontSize: "0.8rem",
        padding: "2px 6px",
      },
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Appointments
          </h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage patient appointments.
          </p>
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

      <div className="rounded-xl border border-border bg-card p-4 calendar-light">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WEEK}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          style={{ height: 650 }}
          step={30}
          timeslots={2}
        />
      </div>

      {/* Custom light mode styles for react-big-calendar */}
      <style jsx global>{`
        .calendar-light .rbc-calendar {
          color: oklch(0.25 0.02 136.6);
        }
        .calendar-light .rbc-toolbar button {
          color: oklch(0.45 0.02 136.6);
          border-color: oklch(0.935 0.023 128.5);
          background: transparent;
        }
        .calendar-light .rbc-toolbar button:hover,
        .calendar-light .rbc-toolbar button.rbc-active {
          background: oklch(0.935 0.023 128.5);
          color: oklch(0.25 0.02 136.6);
          border-color: oklch(0.935 0.023 128.5);
        }
        .calendar-light .rbc-header {
          border-color: oklch(0.935 0.023 128.5);
          color: oklch(0.45 0.02 136.6);
          padding: 8px 4px;
          font-weight: 500;
        }
        .calendar-light .rbc-month-view,
        .calendar-light .rbc-time-view {
          border-color: oklch(0.935 0.023 128.5);
        }
        .calendar-light .rbc-day-bg {
          border-color: oklch(0.935 0.023 128.5);
        }
        .calendar-light .rbc-off-range-bg {
          background: oklch(0.96 0.01 136.6);
        }
        .calendar-light .rbc-today {
          background: rgba(16, 185, 129, 0.06);
        }
        .calendar-light .rbc-month-row,
        .calendar-light .rbc-time-content,
        .calendar-light .rbc-timeslot-group {
          border-color: oklch(0.935 0.023 128.5);
        }
        .calendar-light .rbc-time-header-content {
          border-color: oklch(0.935 0.023 128.5);
        }
        .calendar-light .rbc-time-slot {
          border-color: oklch(0.96 0.01 136.6);
        }
        .calendar-light .rbc-label {
          color: oklch(0.45 0.02 136.6);
          font-size: 0.75rem;
        }
        .calendar-light .rbc-current-time-indicator {
          background: #10b981;
        }
        .calendar-light .rbc-show-more {
          color: #10b981;
        }
      `}</style>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={editing}
        pets={pets}
        selectedSlot={selectedSlot}
      />
    </div>
  );
}
