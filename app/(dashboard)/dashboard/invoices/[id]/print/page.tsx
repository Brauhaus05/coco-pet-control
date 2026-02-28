import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { PrintButton } from "./print-button";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, owners(first_name, last_name, email, phone, address)")
    .eq("id", id)
    .single();

  if (!invoice) return notFound();

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("id");

  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .single();

  const lineItems = items ?? [];
  const total = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );



  return (
    <>
      {/* Print-only style overrides */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide sidebar, header, and everything outside the print area */
          nav, aside, header, footer,
          [class*="print:hidden"],
          .print\\:hidden {
            display: none !important;
          }
          /* Make the main area full width */
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
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Print button — hidden when printing */}
        <div className="print:hidden mb-6">
          <PrintButton />
        </div>

        {/* Invoice document */}
        <div className="print-area bg-white text-zinc-900 rounded-xl shadow-xl border border-zinc-200 p-8 lg:p-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">INVOICE</h1>
              <p className="text-sm text-zinc-500 mt-1 font-mono">
                INV-{String(invoice.invoice_number ?? "").padStart(3, "0")}
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

          {/* Meta + Bill To */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Bill To
              </h3>
              {invoice.owners && (
                <div className="text-sm text-zinc-700 space-y-0.5">
                  <p className="font-semibold text-zinc-900">
                    {invoice.owners.first_name} {invoice.owners.last_name}
                  </p>
                  {invoice.owners.address && <p>{invoice.owners.address}</p>}
                  {invoice.owners.email && <p>{invoice.owners.email}</p>}
                  {invoice.owners.phone && <p>{invoice.owners.phone}</p>}
                </div>
              )}
            </div>
            <div className="text-right text-sm text-zinc-600 space-y-1">
              <div>
                <span className="text-zinc-400">Issue Date: </span>
                <span className="text-zinc-800 font-medium">
                  {format(new Date(invoice.issue_date), "MMM dd, yyyy")}
                </span>
              </div>
              {invoice.due_date && (
                <div>
                  <span className="text-zinc-400">Due Date: </span>
                  <span className="text-zinc-800 font-medium">
                    {format(new Date(invoice.due_date), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
              <div>
                <span className="text-zinc-400">Status: </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    invoice.status === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : invoice.status === "overdue"
                        ? "bg-red-100 text-red-700"
                        : invoice.status === "sent"
                          ? "bg-blue-100 text-blue-700"
                          : invoice.status === "cancelled"
                            ? "bg-zinc-200 text-zinc-500"
                            : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-zinc-200">
                <th className="text-left py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="text-center py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-20">
                  Qty
                </th>
                <th className="text-right py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-28">
                  Unit Price
                </th>
                <th className="text-right py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-28">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-zinc-400 text-sm"
                  >
                    No line items added yet.
                  </td>
                </tr>
              ) : (
                lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100">
                    <td className="py-3 text-sm text-zinc-800">
                      {item.description}
                    </td>
                    <td className="py-3 text-sm text-zinc-600 text-center">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-sm text-zinc-600 text-right">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-3 text-sm text-zinc-800 text-right font-medium">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-3 border-t-2 border-zinc-900">
                <span className="font-bold text-zinc-900 text-lg">Total</span>
                <span className="font-bold text-zinc-900 text-lg">
                  {formatCurrency(total > 0 ? total : invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-10 pt-6 border-t border-zinc-200">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Notes
              </h3>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 text-center text-xs text-zinc-400">
            <p>Thank you for choosing {clinic?.name ?? "our clinic"}!</p>
          </div>
        </div>
      </div>
    </>
  );
}
