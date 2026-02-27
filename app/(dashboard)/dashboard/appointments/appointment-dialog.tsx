"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { AppointmentWithPet } from "@/types/database";
import { appointmentSchema, AppointmentFormValues } from "@/lib/validators";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentWithPet | null;
  pets: {
    id: string;
    name: string;
    owner_id: string;
    owners: { first_name: string; last_name: string } | null;
  }[];
  selectedSlot: { start: Date; end: Date } | null;
}

function toLocalDateTimeString(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  pets,
  selectedSlot,
}: AppointmentDialogProps) {
  const router = useRouter();
  const isEditing = !!appointment;

  const defaultStart = selectedSlot
    ? toLocalDateTimeString(selectedSlot.start)
    : appointment
      ? toLocalDateTimeString(new Date(appointment.start_time))
      : "";

  const defaultEnd = selectedSlot
    ? toLocalDateTimeString(selectedSlot.end)
    : appointment
      ? toLocalDateTimeString(new Date(appointment.end_time))
      : "";

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      pet_id: appointment?.pet_id ?? "",
      start_time: defaultStart,
      end_time: defaultEnd,
      reason: appointment?.reason ?? "",
      status: appointment?.status ?? "scheduled",
    },
  });

  const handleOpenChange = (val: boolean) => {
    if (val) {
      const start = selectedSlot
        ? toLocalDateTimeString(selectedSlot.start)
        : appointment
          ? toLocalDateTimeString(new Date(appointment.start_time))
          : "";
      const end = selectedSlot
        ? toLocalDateTimeString(selectedSlot.end)
        : appointment
          ? toLocalDateTimeString(new Date(appointment.end_time))
          : "";

      form.reset({
        pet_id: appointment?.pet_id ?? "",
        start_time: start,
        end_time: end,
        reason: appointment?.reason ?? "",
        status: appointment?.status ?? "scheduled",
      });
    }
    onOpenChange(val);
  };

  async function onSubmit(values: AppointmentFormValues) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      toast.error("Could not determine your clinic.");
      return;
    }

    const payload = {
      pet_id: values.pet_id,
      start_time: new Date(values.start_time).toISOString(),
      end_time: new Date(values.end_time).toISOString(),
      reason: values.reason || null,
      status: values.status,
      clinic_id: profile.clinic_id,
      vet_id: user.id,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("appointments")
        .update(payload)
        .eq("id", appointment.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Appointment updated");
    } else {
      const { error } = await supabase.from("appointments").insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Appointment created");
    }

    onOpenChange(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!appointment || !confirm("Delete this appointment?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", appointment.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Appointment deleted");
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-popover border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Edit Appointment" : "New Appointment"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Pet</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-muted border-border text-foreground">
                        <SelectValue placeholder="Select pet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border-border">
                      {pets.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          className="text-foreground focus:bg-accent"
                        >
                          {p.name}
                          {p.owners &&
                            ` (${p.owners.first_name} ${p.owners.last_name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Start</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="bg-muted border-border text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">End</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="bg-muted border-border text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Reason</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Annual checkup"
                      className="bg-muted border-border text-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {[
                          "scheduled",
                          "completed",
                          "cancelled",
                          "no-show",
                        ].map((s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="text-foreground focus:bg-accent capitalize"
                          >
                            {s.charAt(0).toUpperCase() +
                              s.slice(1).replace("-", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex items-center justify-between pt-2">
              {isEditing ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDelete}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isEditing ? "Save changes" : "Create appointment"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
