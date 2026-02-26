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
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
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
                  <FormLabel className="text-zinc-300">Bill to</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {owners.map((o) => (
                        <SelectItem
                          key={o.id}
                          value={o.id}
                          className="text-zinc-100 focus:bg-zinc-800"
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
                  <FormLabel className="text-zinc-300">Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-zinc-100">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {["draft", "sent", "paid", "overdue", "cancelled"].map(
                        (s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="text-zinc-100 focus:bg-zinc-800 capitalize"
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
                    <FormLabel className="text-zinc-300">Issue date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
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
                    <FormLabel className="text-zinc-300">Due date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
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
                  <FormLabel className="text-zinc-300">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      className="bg-zinc-800/50 border-zinc-700 text-zinc-100 resize-none"
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
                className="text-zinc-400 hover:text-zinc-100"
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
