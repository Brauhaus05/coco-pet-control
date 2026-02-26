"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Owner } from "@/types/database";
import { ownerSchema, OwnerFormValues } from "@/lib/validators";
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: Owner | null;
}

export function OwnerDialog({ open, onOpenChange, owner }: OwnerDialogProps) {
  const router = useRouter();
  const isEditing = !!owner;

  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      first_name: owner?.first_name ?? "",
      last_name: owner?.last_name ?? "",
      email: owner?.email ?? "",
      phone: owner?.phone ?? "",
      address: owner?.address ?? "",
    },
  });

  // Reset form when dialog opens with new data
  const handleOpenChange = (val: boolean) => {
    if (val) {
      form.reset({
        first_name: owner?.first_name ?? "",
        last_name: owner?.last_name ?? "",
        email: owner?.email ?? "",
        phone: owner?.phone ?? "",
        address: owner?.address ?? "",
      });
    }
    onOpenChange(val);
  };

  async function onSubmit(values: OwnerFormValues) {
    const supabase = createClient();

    // Get the user's clinic_id
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
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      clinic_id: profile.clinic_id,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("owners")
        .update(payload)
        .eq("id", owner.id);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Owner updated");
    } else {
      const { error } = await supabase.from("owners").insert(payload);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Owner created");
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {isEditing ? "Edit Owner" : "Add Owner"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">First name</FormLabel>
                    <FormControl>
                      <Input
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
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Last name</FormLabel>
                    <FormControl>
                      <Input
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Phone</FormLabel>
                  <FormControl>
                    <Input
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Address</FormLabel>
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
                {isEditing ? "Save changes" : "Create owner"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
