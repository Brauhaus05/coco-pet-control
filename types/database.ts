export type Clinic = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  clinic_id: string;
  full_name: string;
  role: "admin" | "vet" | "receptionist";
  created_at: string;
};

export type Owner = {
  id: string;
  clinic_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
};

export type Pet = {
  id: string;
  clinic_id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  date_of_birth: string | null;
  sex: "male" | "female" | "unknown" | null;
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
};

export type MedicalRecord = {
  id: string;
  clinic_id: string;
  pet_id: string;
  vet_id: string | null;
  visit_date: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  image_urls: string[];
  cost: number;
  created_at: string;
};

export type Appointment = {
  id: string;
  clinic_id: string;
  pet_id: string;
  vet_id: string | null;
  start_time: string;
  end_time: string;
  reason: string | null;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  created_at: string;
};

export type Invoice = {
  id: string;
  clinic_id: string;
  owner_id: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  total: number;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

/* ----- Joined / extended types for UI ----- */

export type PetWithOwner = Pet & {
  owners: Pick<Owner, "first_name" | "last_name"> | null;
};

export type MedicalRecordWithPet = MedicalRecord & {
  pets: Pick<Pet, "name"> | null;
};

export type AppointmentWithPet = Appointment & {
  pets: Pick<Pet, "name"> & {
    owners: Pick<Owner, "first_name" | "last_name"> | null;
  };
};

export type InvoiceWithOwner = Invoice & {
  owners: Pick<Owner, "first_name" | "last_name"> | null;
};
