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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { format, addMinutes, roundToNearestMinutes } from "date-fns";
import { useState } from "react";

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
  vets: {
    id: string;
    full_name: string;
    role: string;
  }[];
  selectedSlot: { start: Date; end: Date } | null;
}

function toLocalDateTimeString(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

/** Returns a sensible default start (next 30-min boundary) and end (+30 min). */
function getDefaultTimes(): { start: string; end: string } {
  const now = new Date();
  const rounded = roundToNearestMinutes(now, {
    nearestTo: 30,
    roundingMethod: "ceil",
  });
  return {
    start: toLocalDateTimeString(rounded),
    end: toLocalDateTimeString(addMinutes(rounded, 30)),
  };
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  pets,
  vets,
  selectedSlot,
}: AppointmentDialogProps) {
  const router = useRouter();
  const isEditing = !!appointment;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function computeDefaults() {
    const defaults = getDefaultTimes();
    const start = selectedSlot
      ? toLocalDateTimeString(selectedSlot.start)
      : appointment
        ? toLocalDateTimeString(new Date(appointment.start_time))
        : defaults.start;
    const end = selectedSlot
      ? toLocalDateTimeString(selectedSlot.end)
      : appointment
        ? toLocalDateTimeString(new Date(appointment.end_time))
        : defaults.end;

    return {
      pet_id: appointment?.pet_id ?? "",
      start_time: start,
      end_time: end,
      reason: appointment?.reason ?? "",
      notes: appointment?.notes ?? "",
      status: appointment?.status ?? "scheduled",
      vet_id: appointment?.vet_id ?? "",
    };
  }

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: computeDefaults(),
  });

  const handleOpenChange = (val: boolean) => {
    if (val) {
      form.reset(computeDefaults());
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
      notes: values.notes || null,
      status: values.status,
      clinic_id: profile.clinic_id,
      vet_id: values.vet_id || user.id,
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
    if (!appointment) return;
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
    setShowDeleteConfirm(false);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-popover border-border text-foreground sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Edit Appointment" : "New Appointment"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Pet selector */}
            <FormField
              control={form.control}
              name="pet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Pet</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    key={field.value}
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

            {/* Vet selector */}
            <FormField
              control={form.control}
              name="vet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Assigned Vet
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    key={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-muted border-border text-foreground">
                        <SelectValue placeholder="Select vet (defaults to you)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border-border">
                      {vets.map((v) => (
                        <SelectItem
                          key={v.id}
                          value={v.id}
                          className="text-foreground focus:bg-accent"
                        >
                          {v.full_name}
                          <span className="ml-1 text-muted-foreground text-xs capitalize">
                            ({v.role})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start + End time */}
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

            {/* Reason */}
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

            {/* Notes (new) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Pre-visit instructions, follow-up details…"
                      className="bg-muted border-border text-foreground resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status (only when editing) */}
            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      key={field.value}
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

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              {isEditing ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
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

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertTitle className="text-foreground">
              Delete appointment?
            </AlertTitle>
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
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
