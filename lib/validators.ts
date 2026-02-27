import { z } from "zod";

export const ownerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type OwnerFormValues = z.infer<typeof ownerSchema>;

export const petSchema = z.object({
  owner_id: z.string().min(1, "Owner is required"),
  name: z.string().min(1, "Pet name is required"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  date_of_birth: z.string().optional(),
  sex: z.enum(["male", "female", "unknown"]).optional(),
  weight_kg: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type PetFormValues = z.infer<typeof petSchema>;

export const medicalRecordSchema = z.object({
  pet_id: z.string().min(1, "Pet is required"),
  visit_date: z.string().min(1, "Visit date is required"),
  chief_complaint: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  cost: z.number().min(0),
});

export type MedicalRecordFormValues = z.infer<typeof medicalRecordSchema>;

export const appointmentSchema = z
  .object({
    pet_id: z.string().min(1, "Pet is required"),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    reason: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["scheduled", "completed", "cancelled", "no-show"]),
    vet_id: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.start_time || !data.end_time) return true;
      return new Date(data.end_time) > new Date(data.start_time);
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    }
  );

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export const invoiceSchema = z.object({
  owner_id: z.string().min(1, "Owner is required"),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive("Must be at least 1"),
  unit_price: z.number().min(0, "Price must be non-negative"),
});

export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;
