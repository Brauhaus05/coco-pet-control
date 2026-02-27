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
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  room: string | null;
  appointment_number: number | null;
  created_at: string;
};

export type AppointmentVitals = {
  id: string;
  appointment_id: string;
  weight_lbs: number | null;
  temperature_f: number | null;
  heart_rate_bpm: number | null;
  created_at: string;
};

export type AppointmentPrescription = {
  id: string;
  appointment_id: string;
  item_name: string;
  type: "vaccination" | "prescription" | "procedure" | "other";
  dosage_instructions: string | null;
  quantity: string | null;
  status: "administered" | "dispensed" | "pending" | "cancelled";
  created_at: string;
};

export type AppointmentRecommendation = {
  id: string;
  appointment_id: string;
  title: string;
  description: string | null;
  priority: "routine" | "important" | "urgent";
  created_at: string;
};

export type Invoice = {
  id: string;
  clinic_id: string;
  owner_id: string;
  appointment_id: string | null;
  invoice_number: number;
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

export type AppointmentWithDetails = Appointment & {
  pets: (Pick<Pet, "id" | "name" | "species" | "breed" | "date_of_birth" | "sex" | "weight_kg"> & {
    owners: Pick<Owner, "id" | "first_name" | "last_name" | "email" | "phone" | "address"> | null;
  }) | null;
  profiles: Pick<Profile, "id" | "full_name" | "role"> | null;
  appointment_vitals: AppointmentVitals[];
  appointment_prescriptions: AppointmentPrescription[];
  appointment_recommendations: AppointmentRecommendation[];
};

export type InvoiceWithOwner = Invoice & {
  owners: Pick<Owner, "first_name" | "last_name"> | null;
};
