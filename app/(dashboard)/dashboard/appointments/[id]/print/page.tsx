import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format, differenceInMinutes, differenceInYears, differenceInMonths } from "date-fns";
import { PrintButton } from "../../../invoices/[id]/print/print-button";

function computeAge(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  const years = differenceInYears(new Date(), birth);
  if (years >= 1) return `${years} year${years !== 1 ? "s" : ""}`;
  const months = differenceInMonths(new Date(), birth);
  return `${months} month${months !== 1 ? "s" : ""}`;
}

function computeDuration(start: string, end: string): string {
  const mins = differenceInMinutes(new Date(end), new Date(start));
  if (mins < 60) return `${mins} mins`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function AppointmentPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [aptRes, vitalsRes, rxRes, recsRes, clinicRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "*, pets(name, species, breed, date_of_birth, sex, weight_kg, owners(first_name, last_name, phone, email, address)), profiles:vet_id(full_name)"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("appointment_vitals")
      .select("*")
      .eq("appointment_id", id)
      .limit(1),
    supabase
      .from("appointment_prescriptions")
      .select("*")
      .eq("appointment_id", id)
      .order("created_at"),
    supabase
      .from("appointment_recommendations")
      .select("*")
      .eq("appointment_id", id)
      .order("created_at"),
    supabase.from("clinics").select("*").single(),
  ]);

  const apt = aptRes.data;
  if (!apt) return notFound();

  const pet = apt.pets as any;
  const owner = pet?.owners ?? null;
  const vet = apt.profiles as any;
  const vitals = (vitalsRes.data ?? [])[0] ?? null;
  const prescriptions = rxRes.data ?? [];
  const recommendations = recsRes.data ?? [];
  const clinic = clinicRes.data;

  const appointmentNumber = apt.appointment_number
    ? `AP-${new Date(apt.created_at).getFullYear()}-${String(apt.appointment_number).padStart(3, "0")}`
    : `AP-${apt.id.slice(0, 6).toUpperCase()}`;

  const statusLabels: Record<string, string> = {
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
    "no-show": "No Show",
  };

  const priorityLabels: Record<string, string> = {
    routine: "Routine",
    important: "Important",
    urgent: "Urgent",
  };

  return (
    <>
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          nav, aside, header, footer,
          [class*="print:hidden"],
          .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-area {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-area * {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        <div className="print:hidden mb-6">
          <PrintButton />
        </div>

        <div className="print-area bg-white text-zinc-900 rounded-xl shadow-xl border border-zinc-200 p-8 lg:p-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">
                APPOINTMENT SUMMARY
              </h1>
              <p className="text-sm text-zinc-500 mt-1 font-mono">
                {appointmentNumber}
              </p>
            </div>
            <div className="text-right text-sm text-zinc-600">
              {clinic && (
                <>
                  <p className="font-bold text-zinc-900 text-lg">
                    {clinic.name}
                  </p>
                  {clinic.address && <p>{clinic.address}</p>}
                  {clinic.phone && <p>{clinic.phone}</p>}
                  {clinic.email && <p>{clinic.email}</p>}
                </>
              )}
            </div>
          </div>

          {/* Patient & Visit Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Patient
              </h3>
              {pet && (
                <div className="text-sm text-zinc-700 space-y-0.5">
                  <p className="font-semibold text-zinc-900 text-base">
                    {pet.name}
                  </p>
                  <p>
                    {pet.breed || pet.species}
                    {pet.date_of_birth && ` • ${computeAge(pet.date_of_birth)}`}
                    {pet.sex && ` • ${pet.sex}`}
                  </p>
                  {owner && (
                    <p className="mt-1 text-zinc-500">
                      Owner: {owner.first_name} {owner.last_name}
                      {owner.phone && ` • ${owner.phone}`}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="text-right text-sm text-zinc-600 space-y-1">
              <div>
                <span className="text-zinc-400">Date: </span>
                <span className="text-zinc-800 font-medium">
                  {format(new Date(apt.start_time), "MMMM dd, yyyy")}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Time: </span>
                <span className="text-zinc-800 font-medium">
                  {format(new Date(apt.start_time), "h:mm a")} –{" "}
                  {format(new Date(apt.end_time), "h:mm a")}
                  {" "}({computeDuration(apt.start_time, apt.end_time)})
                </span>
              </div>
              {vet && (
                <div>
                  <span className="text-zinc-400">Veterinarian: </span>
                  <span className="text-zinc-800 font-medium">
                    Dr. {vet.full_name}
                  </span>
                </div>
              )}
              {apt.room && (
                <div>
                  <span className="text-zinc-400">Room: </span>
                  <span className="text-zinc-800 font-medium">{apt.room}</span>
                </div>
              )}
              <div>
                <span className="text-zinc-400">Status: </span>
                <span className="text-zinc-800 font-medium capitalize">
                  {statusLabels[apt.status] ?? apt.status}
                </span>
              </div>
            </div>
          </div>

          {/* Reason for Visit */}
          {apt.reason && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Reason for Visit
              </h3>
              <p className="text-sm text-zinc-800">{apt.reason}</p>
            </div>
          )}

          {/* Vital Signs */}
          {vitals && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Vital Signs
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <p className="text-xs text-zinc-500">Weight</p>
                  <p className="text-lg font-bold text-zinc-900">
                    {vitals.weight_lbs ? `${vitals.weight_lbs} lbs` : "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <p className="text-xs text-zinc-500">Temperature</p>
                  <p className="text-lg font-bold text-zinc-900">
                    {vitals.temperature_f ? `${vitals.temperature_f} °F` : "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <p className="text-xs text-zinc-500">Heart Rate</p>
                  <p className="text-lg font-bold text-zinc-900">
                    {vitals.heart_rate_bpm ? `${vitals.heart_rate_bpm} bpm` : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Examination Notes */}
          {apt.notes && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Examination Notes
              </h3>
              <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                  {apt.notes}
                </p>
              </div>
            </div>
          )}

          {/* Prescriptions & Treatments */}
          {prescriptions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Prescriptions & Treatments
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-zinc-200">
                    <th className="text-left py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Dosage / Instructions
                    </th>
                    <th className="text-center py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-16">
                      Qty
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-24">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((rx: any) => (
                    <tr key={rx.id} className="border-b border-zinc-100">
                      <td className="py-2 text-sm text-zinc-800 font-medium">
                        {rx.item_name}
                      </td>
                      <td className="py-2 text-sm text-zinc-600 capitalize">
                        {rx.type}
                      </td>
                      <td className="py-2 text-sm text-zinc-600">
                        {rx.dosage_instructions || "—"}
                      </td>
                      <td className="py-2 text-sm text-zinc-600 text-center">
                        {rx.quantity || "—"}
                      </td>
                      <td className="py-2 text-sm text-zinc-600 text-right capitalize">
                        {rx.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Recommendations
              </h3>
              <div className="space-y-2">
                {recommendations.map((rec: any) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg bg-zinc-50 border border-zinc-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-zinc-800">
                        {rec.title}
                      </p>
                      <span className="text-xs text-zinc-500 capitalize">
                        {priorityLabels[rec.priority] ?? rec.priority}
                      </span>
                    </div>
                    {rec.description && (
                      <p className="text-sm text-zinc-600">
                        {rec.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-zinc-200 text-center text-xs text-zinc-400">
            <p>
              Generated on {format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}
            </p>
            <p className="mt-1">
              Thank you for choosing {clinic?.name ?? "our clinic"}!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
