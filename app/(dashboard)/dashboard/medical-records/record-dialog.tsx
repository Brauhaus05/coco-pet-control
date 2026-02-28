"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { MedicalRecordWithPet } from "@/types/database";
import { medicalRecordSchema, MedicalRecordFormValues } from "@/lib/validators";
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
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface RecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: MedicalRecordWithPet | null;
  pets: {
    id: string;
    name: string;
    owner_id: string;
    owners: { first_name: string; last_name: string } | null;
  }[];
}

export function RecordDialog({
  open,
  onOpenChange,
  record,
  pets,
}: RecordDialogProps) {
  const router = useRouter();
  const isEditing = !!record;
  const [imageUrls, setImageUrls] = useState<string[]>(
    record?.image_urls ?? []
  );
  const [uploading, setUploading] = useState(false);

  const form = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      pet_id: record?.pet_id ?? "",
      visit_date:
        record?.visit_date ?? new Date().toISOString().split("T")[0],
      chief_complaint: record?.chief_complaint ?? "",
      diagnosis: record?.diagnosis ?? "",
      treatment: record?.treatment ?? "",
      notes: record?.notes ?? "",
      cost: record?.cost ?? 0,
    },
  });

  const handleOpenChange = (val: boolean) => {
    if (val) {
      form.reset({
        pet_id: record?.pet_id ?? "",
        visit_date:
          record?.visit_date ?? new Date().toISOString().split("T")[0],
        chief_complaint: record?.chief_complaint ?? "",
        diagnosis: record?.diagnosis ?? "",
        treatment: record?.treatment ?? "",
        notes: record?.notes ?? "",
        cost: record?.cost ?? 0,
      });
      setImageUrls(record?.image_urls ?? []);
    }
    onOpenChange(val);
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error } = await supabase.storage
        .from("medical-images")
        .upload(filePath, file);

      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      // Store the file path (not a public URL) since the bucket is private.
      // Signed URLs are generated at display time.
      setImageUrls((prev) => [...prev, filePath]);
    }

    setUploading(false);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: MedicalRecordFormValues) {
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
      chief_complaint: values.chief_complaint || null,
      diagnosis: values.diagnosis || null,
      treatment: values.treatment || null,
      notes: values.notes || null,
      cost: values.cost ?? 0,
      image_urls: imageUrls,
      clinic_id: profile.clinic_id,
      vet_id: user.id,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("medical_records")
        .update(payload)
        .eq("id", record.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Record updated");
    } else {
      const { error } = await supabase.from("medical_records").insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Record created");
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-popover border-border text-foreground sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Edit Medical Record" : "Add Medical Record"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="visit_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Visit date</FormLabel>
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
              name="chief_complaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Chief complaint
                  </FormLabel>
                  <FormControl>
                    <Input
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
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Diagnosis</FormLabel>
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

            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Treatment</FormLabel>
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

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Cost ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : parseFloat(val));
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="bg-muted border-border text-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Images
              </label>
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, i) => (
                  <div
                    key={i}
                    className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border"
                  >
                    <img
                      src={url}
                      alt={`Upload ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-orange-500/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

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
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isEditing ? "Save changes" : "Create record"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
