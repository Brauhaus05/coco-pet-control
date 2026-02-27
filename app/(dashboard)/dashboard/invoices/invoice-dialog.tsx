"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { InvoiceWithOwner } from "@/types/database";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

/* ─── Schema with embedded line items ─── */
const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Required"),
  quantity: z.coerce.number().int().positive("≥ 1"),
  unit_price: z.coerce.number().min(0, "≥ 0"),
});

const invoiceFormSchema = z
  .object({
    owner_id: z.string().min(1, "Owner is required"),
    status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
    issue_date: z.string().min(1, "Issue date is required"),
    due_date: z.string().optional(),
    notes: z.string().optional(),
    appointment_id: z.string().optional(),
    items: z.array(lineItemSchema),
  })
  .refine(
    (data) => {
      if (!data.due_date || !data.issue_date) return true;
      return new Date(data.due_date) >= new Date(data.issue_date);
    },
    {
      message: "Due date must be on or after issue date",
      path: ["due_date"],
    }
  );

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceWithOwner | null;
  owners: { id: string; first_name: string; last_name: string }[];
  existingItems?: {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
  }[];
  appointments?: {
    id: string;
    start_time: string;
    reason: string | null;
    pets: { name: string } | null;
  }[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function InvoiceDialog({
  open,
  onOpenChange,
  invoice,
  owners,
  existingItems = [],
  appointments = [],
}: InvoiceDialogProps) {
  const router = useRouter();
  const isEditing = !!invoice;
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);

  function computeDefaults(): InvoiceFormValues {
    return {
      owner_id: invoice?.owner_id ?? "",
      status: invoice?.status ?? "draft",
      issue_date:
        invoice?.issue_date ?? new Date().toISOString().split("T")[0],
      due_date: invoice?.due_date ?? "",
      notes: invoice?.notes ?? "",
      appointment_id: invoice?.appointment_id ?? "",
      items:
        isEditing && existingItems.length > 0
          ? existingItems.map((i) => ({
              id: i.id,
              description: i.description,
              quantity: i.quantity,
              unit_price: i.unit_price,
            }))
          : [{ id: undefined, description: "", quantity: 1, unit_price: 0 }],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema) as any,
    defaultValues: computeDefaults(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const computedTotal = (watchedItems ?? []).reduce(
    (sum: number, item: { quantity?: number; unit_price?: number }) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );

  const handleOpenChange = (val: boolean) => {
    if (val) {
      form.reset(computeDefaults());
      setRemovedItemIds([]);
    }
    onOpenChange(val);
  };

  async function onSubmit(values: InvoiceFormValues) {
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

    const total = values.items.reduce(
      (sum: number, i: { quantity: number; unit_price: number }) =>
        sum + i.quantity * i.unit_price,
      0
    );

    const invoicePayload = {
      owner_id: values.owner_id,
      status: values.status,
      issue_date: values.issue_date,
      due_date: values.due_date || null,
      notes: values.notes || null,
      appointment_id: values.appointment_id || null,
      clinic_id: profile.clinic_id,
      total,
    };

    let invoiceId: string;

    if (isEditing) {
      const { error } = await supabase
        .from("invoices")
        .update(invoicePayload)
        .eq("id", invoice.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      invoiceId = invoice.id;
    } else {
      const { data, error } = await supabase
        .from("invoices")
        .insert(invoicePayload)
        .select("id")
        .single();
      if (error || !data) {
        toast.error(error?.message ?? "Failed to create invoice");
        return;
      }
      invoiceId = data.id;
    }

    // Delete removed items
    if (removedItemIds.length > 0) {
      await supabase
        .from("invoice_items")
        .delete()
        .in("id", removedItemIds);
    }

    // Upsert items
    for (const item of values.items) {
      if (item.id) {
        await supabase
          .from("invoice_items")
          .update({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })
          .eq("id", item.id);
      } else {
        await supabase.from("invoice_items").insert({
          invoice_id: invoiceId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        });
      }
    }

    toast.success(isEditing ? "Invoice updated" : "Invoice created");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-popover border-border text-foreground sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Edit Invoice" : "Create Invoice"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as any)}
            className="space-y-5"
          >
            {/* Owner + Status row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="owner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Bill to</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      key={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted border-border text-foreground">
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {owners.map((o) => (
                          <SelectItem
                            key={o.id}
                            value={o.id}
                            className="text-foreground focus:bg-accent"
                          >
                            {o.first_name} {o.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {["draft", "sent", "paid", "overdue", "cancelled"].map(
                          (s) => (
                            <SelectItem
                              key={s}
                              value={s}
                              className="text-foreground focus:bg-accent capitalize"
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Issue date
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Due date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-muted border-border text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linked appointment */}
            {appointments.length > 0 && (
              <FormField
                control={form.control}
                name="appointment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Linked Appointment{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      key={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted border-border text-foreground">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border max-h-48">
                        <SelectItem
                          value="none"
                          className="text-muted-foreground focus:bg-accent"
                        >
                          None
                        </SelectItem>
                        {appointments.map((a) => (
                          <SelectItem
                            key={a.id}
                            value={a.id}
                            className="text-foreground focus:bg-accent"
                          >
                            {format(new Date(a.start_time), "MMM dd")} —{" "}
                            {a.pets?.name ?? "Unknown"}{" "}
                            {a.reason ? `(${a.reason})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* ─── Line Items ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-foreground text-sm font-medium">
                  Line Items
                </FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-500 hover:bg-emerald-500/10 h-7 text-xs"
                  onClick={() =>
                    append({
                      id: undefined,
                      description: "",
                      quantity: 1,
                      unit_price: 0,
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add item
                </Button>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_80px_100px_32px] gap-2 px-1">
                <span className="text-xs text-muted-foreground font-medium">
                  Description
                </span>
                <span className="text-xs text-muted-foreground font-medium text-center">
                  Qty
                </span>
                <span className="text-xs text-muted-foreground font-medium text-right">
                  Unit Price
                </span>
                <span />
              </div>

              {/* Item rows */}
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-start"
                >
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...f}
                            placeholder="Service or product…"
                            className="bg-muted border-border text-foreground text-sm h-9"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            {...f}
                            className="bg-muted border-border text-foreground text-sm h-9 text-center"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.unit_price`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            {...f}
                            className="bg-muted border-border text-foreground text-sm h-9 text-right"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-8 text-muted-foreground hover:text-red-400 flex-shrink-0"
                    disabled={fields.length === 1}
                    onClick={() => {
                      const itemId = watchedItems[index]?.id;
                      if (itemId) {
                        setRemovedItemIds((prev) => [...prev, itemId]);
                      }
                      remove(index);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}

              {/* Running total */}
              <div className="flex justify-end pt-2 pr-10 border-t border-border">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(computedTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="Payment terms, additional info…"
                      className="bg-muted border-border text-foreground resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
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
                {isEditing ? "Save changes" : "Create invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
