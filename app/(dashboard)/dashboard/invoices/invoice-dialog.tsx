"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { InvoiceWithOwner } from "@/types/database";
import { invoiceSchema, InvoiceFormValues } from "@/lib/validators";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceWithOwner | null;
  owners: { id: string; first_name: string; last_name: string }[];
}

export function InvoiceDialog({
  open,
  onOpenChange,
  invoice,
  owners,
}: InvoiceDialogProps) {
  const router = useRouter();
  const isEditing = !!invoice;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      owner_id: invoice?.owner_id ?? "",
      status: invoice?.status ?? "draft",
      issue_date:
        invoice?.issue_date ?? new Date().toISOString().split("T")[0],
      due_date: invoice?.due_date ?? "",
      notes: invoice?.notes ?? "",
    },
  });

  const handleOpenChange = (val: boolean) => {
    if (val) {
      form.reset({
        owner_id: invoice?.owner_id ?? "",
        status: invoice?.status ?? "draft",
        issue_date:
          invoice?.issue_date ?? new Date().toISOString().split("T")[0],
        due_date: invoice?.due_date ?? "",
        notes: invoice?.notes ?? "",
      });
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

    const payload = {
      ...values,
      due_date: values.due_date || null,
      notes: values.notes || null,
      clinic_id: profile.clinic_id,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("invoices")
        .update(payload)
        .eq("id", invoice.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Invoice updated");
    } else {
      const { error } = await supabase.from("invoices").insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Invoice created");
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-popover border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Edit Invoice" : "Create Invoice"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="owner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Bill to</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
                    defaultValue={field.value}
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Issue date</FormLabel>
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
                      className="bg-muted border-border text-foreground resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
