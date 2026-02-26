"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { PetWithOwner } from "@/types/database";
import { petSchema, PetFormValues } from "@/lib/validators";
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

interface PetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: PetWithOwner | null;
  owners: { id: string; first_name: string; last_name: string }[];
}

export function PetDialog({ open, onOpenChange, pet, owners }: PetDialogProps) {
  const router = useRouter();
  const isEditing = !!pet;

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      owner_id: pet?.owner_id ?? "",
      name: pet?.name ?? "",
      species: pet?.species ?? "",
      breed: pet?.breed ?? "",
      date_of_birth: pet?.date_of_birth ?? "",
      sex: (pet?.sex as PetFormValues["sex"]) ?? undefined,
      weight_kg: pet?.weight_kg ?? undefined,
      notes: pet?.notes ?? "",
    },
  });

  const handleOpenChange = (val: boolean) => {
    if (val) {
      form.reset({
        owner_id: pet?.owner_id ?? "",
        name: pet?.name ?? "",
        species: pet?.species ?? "",
        breed: pet?.breed ?? "",
        date_of_birth: pet?.date_of_birth ?? "",
        sex: (pet?.sex as PetFormValues["sex"]) ?? undefined,
        weight_kg: pet?.weight_kg ?? undefined,
        notes: pet?.notes ?? "",
      });
    }
    onOpenChange(val);
  };

  async function onSubmit(values: PetFormValues) {
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
      breed: values.breed || null,
      date_of_birth: values.date_of_birth || null,
      sex: values.sex || null,
      weight_kg: values.weight_kg ?? null,
      notes: values.notes || null,
      clinic_id: profile.clinic_id,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("pets")
        .update(payload)
        .eq("id", pet.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Pet updated");
    } else {
      const { error } = await supabase.from("pets").insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Pet created");
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {isEditing ? "Edit Pet" : "Add Pet"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="owner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Owner</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Pet name</FormLabel>
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
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Species</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-zinc-100">
                          <SelectValue placeholder="Select species" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {["Dog", "Cat", "Bird", "Reptile", "Rabbit", "Other"].map(
                          (s) => (
                            <SelectItem
                              key={s}
                              value={s.toLowerCase()}
                              className="text-zinc-100 focus:bg-zinc-800"
                            >
                              {s}
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Breed</FormLabel>
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
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Sex</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-zinc-100">
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem
                          value="male"
                          className="text-zinc-100 focus:bg-zinc-800"
                        >
                          Male
                        </SelectItem>
                        <SelectItem
                          value="female"
                          className="text-zinc-100 focus:bg-zinc-800"
                        >
                          Female
                        </SelectItem>
                        <SelectItem
                          value="unknown"
                          className="text-zinc-100 focus:bg-zinc-800"
                        >
                          Unknown
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">
                      Date of birth
                    </FormLabel>
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
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">
                      Weight (kg)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : parseFloat(val));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
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
                {isEditing ? "Save changes" : "Create pet"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
