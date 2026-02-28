import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";



export async function POST(request: Request) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service is not configured. Please add RESEND_API_KEY to your environment." },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // Fetch invoice + owner + clinic + items
    const [invoiceRes, clinicRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("*, owners(first_name, last_name, email, phone, address)")
        .eq("id", invoiceId)
        .single(),
      supabase.from("clinics").select("*").single(),
    ]);

    if (!invoiceRes.data) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const invoice = invoiceRes.data;
    const owner = invoice.owners as any;
    const clinic = clinicRes.data;

    if (!owner?.email) {
      return NextResponse.json(
        { error: "Owner has no email address on file" },
        { status: 400 }
      );
    }

    // Fetch line items
    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("id");

    const lineItems = items ?? [];
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const total = subtotal > 0 ? subtotal : invoice.total;

    const invNum = `INV-${String(invoice.invoice_number ?? "").padStart(3, "0")}`;
    const ownerName = `${owner.first_name} ${owner.last_name}`;
    const clinicName = clinic?.name ?? "CoCo Pet Control";
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "invoices@resend.dev";

    // Build HTML email
    const itemsHtml = lineItems.length > 0
      ? lineItems.map(
          (item) => `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333;">${item.description}</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #666; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #666; text-align: right;">${formatCurrency(item.unit_price)}</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333; text-align: right; font-weight: 600;">${formatCurrency(item.quantity * item.unit_price)}</td>
          </tr>`
        ).join("")
      : `<tr><td colspan="4" style="padding: 20px 0; text-align: center; color: #999; font-size: 14px;">No line items</td></tr>`;

    const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 32px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">${clinicName}</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Invoice ${invNum}</p>
      </div>

      <!-- Body -->
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin: 0 0 24px; font-size: 16px; color: #333;">
          Hi ${ownerName},
        </p>
        <p style="margin: 0 0 24px; font-size: 14px; color: #666; line-height: 1.6;">
          Please find your invoice details below. If you have any questions, don't hesitate to reach out.
        </p>

        <!-- Invoice Meta -->
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%;">
            <tr>
              <td style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Invoice #</td>
              <td style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${invNum}</td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; padding-top: 8px;">Issue Date</td>
              <td style="font-size: 14px; color: #333; text-align: right; padding-top: 8px;">${format(new Date(invoice.issue_date), "MMMM dd, yyyy")}</td>
            </tr>
            ${invoice.due_date ? `
            <tr>
              <td style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; padding-top: 8px;">Due Date</td>
              <td style="font-size: 14px; color: #333; text-align: right; padding-top: 8px;">${format(new Date(invoice.due_date), "MMMM dd, yyyy")}</td>
            </tr>` : ""}
            <tr>
              <td style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; padding-top: 8px;">Status</td>
              <td style="font-size: 14px; color: #333; text-align: right; padding-top: 8px; text-transform: capitalize;">${invoice.status}</td>
            </tr>
          </table>
        </div>

        <!-- Line Items -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 10px 0; border-bottom: 2px solid #e5e7eb; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
              <th style="text-align: center; padding: 10px 0; border-bottom: 2px solid #e5e7eb; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
              <th style="text-align: right; padding: 10px 0; border-bottom: 2px solid #e5e7eb; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Unit Price</th>
              <th style="text-align: right; padding: 10px 0; border-bottom: 2px solid #e5e7eb; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Total -->
        <div style="text-align: right; padding: 16px 0; border-top: 2px solid #111;">
          <span style="font-size: 18px; font-weight: 700; color: #111;">Total: ${formatCurrency(total)}</span>
        </div>

        ${invoice.notes ? `
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px;">Notes</p>
          <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.5;">${invoice.notes}</p>
        </div>` : ""}
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 24px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #999;">
          Thank you for choosing ${clinicName}!
        </p>
        ${clinic?.phone ? `<p style="margin: 4px 0 0; font-size: 12px; color: #999;">${clinic.phone}</p>` : ""}
        ${clinic?.email ? `<p style="margin: 4px 0 0; font-size: 12px; color: #999;">${clinic.email}</p>` : ""}
      </div>
    </div>`;

    // Send email via Resend (lazy init to avoid build-time errors)
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: `${clinicName} <${fromEmail}>`,
      to: [owner.email],
      subject: `Invoice ${invNum} — ${formatCurrency(total)}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to send email" },
        { status: 500 }
      );
    }

    // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === "draft") {
      await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoiceId);
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: `Invoice sent to ${owner.email}`,
    });
  } catch (err: unknown) {
    console.error("Send invoice error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
