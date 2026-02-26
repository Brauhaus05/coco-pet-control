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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            Appointments
          </h1>
          <p className="text-zinc-400 mt-1">
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

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 calendar-dark">
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

      {/* Custom dark mode styles for react-big-calendar */}
      <style jsx global>{`
        .calendar-dark .rbc-calendar {
          color: #d4d4d8;
        }
        .calendar-dark .rbc-toolbar button {
          color: #a1a1aa;
          border-color: #3f3f46;
          background: transparent;
        }
        .calendar-dark .rbc-toolbar button:hover,
        .calendar-dark .rbc-toolbar button.rbc-active {
          background: #27272a;
          color: #f4f4f5;
          border-color: #52525b;
        }
        .calendar-dark .rbc-header {
          border-color: #3f3f46;
          color: #a1a1aa;
          padding: 8px 4px;
          font-weight: 500;
        }
        .calendar-dark .rbc-month-view,
        .calendar-dark .rbc-time-view {
          border-color: #3f3f46;
        }
        .calendar-dark .rbc-day-bg {
          border-color: #27272a;
        }
        .calendar-dark .rbc-off-range-bg {
          background: #18181b;
        }
        .calendar-dark .rbc-today {
          background: rgba(16, 185, 129, 0.05);
        }
        .calendar-dark .rbc-month-row,
        .calendar-dark .rbc-time-content,
        .calendar-dark .rbc-timeslot-group {
          border-color: #27272a;
        }
        .calendar-dark .rbc-time-header-content {
          border-color: #3f3f46;
        }
        .calendar-dark .rbc-time-slot {
          border-color: #1f1f23;
        }
        .calendar-dark .rbc-label {
          color: #71717a;
          font-size: 0.75rem;
        }
        .calendar-dark .rbc-current-time-indicator {
          background: #10b981;
        }
        .calendar-dark .rbc-show-more {
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
