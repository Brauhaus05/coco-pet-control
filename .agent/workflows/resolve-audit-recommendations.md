---
description: Step-by-step workflow to resolve all audit recommendations safely, without breaking existing functionality
---

# CoCo Pet Control — Improvement Workflow

> This workflow resolves all recommendations from the codebase audit status report.
> Each sprint is self-contained — the app should remain fully functional after every step.

---

## Pre-Flight Checklist

Before starting any sprint:

// turbo

1. Verify the dev server runs without errors: `npm run dev`
   // turbo
2. Verify the production build passes: `npx next build`
3. Open the browser and spot-check: login, dashboard, appointments, owners

---

## Sprint 1 — Stability & UX Foundations (No schema changes)

**Goal:** Add loading states, error boundaries, and fix the middleware deprecation. Zero risk to existing features.

### Step 1.1 — Add `loading.tsx` skeleton files

Create `loading.tsx` in each dashboard route segment to show skeleton loaders while data fetches:

- `app/(dashboard)/dashboard/loading.tsx`
- `app/(dashboard)/dashboard/owners/loading.tsx`
- `app/(dashboard)/dashboard/pets/loading.tsx`
- `app/(dashboard)/dashboard/pets/[id]/loading.tsx`
- `app/(dashboard)/dashboard/medical-records/loading.tsx`
- `app/(dashboard)/dashboard/appointments/loading.tsx`
- `app/(dashboard)/dashboard/appointments/[id]/loading.tsx`
- `app/(dashboard)/dashboard/invoices/loading.tsx`

Each file should export a default component with pulse-animated skeleton cards/tables matching the page layout.

### Step 1.2 — Add React Error Boundary

Create `components/error-boundary.tsx` using React's `ErrorBoundary` pattern. Then create `error.tsx` files in each dashboard route segment (Next.js convention) to catch and display errors gracefully instead of crashing the page.

### Step 1.3 — Migrate `middleware.ts` → `proxy`

Follow the Next.js 16 migration guide:

- Read: https://nextjs.org/docs/messages/middleware-to-proxy
- Replace `middleware.ts` with the new `proxy` convention
- Test that login redirect, signup redirect, and authenticated routing all still work

### Step 1.4 — Replace `confirm()` with `AlertDialog`

In `medical-records/records-client.tsx`, replace the browser `confirm("Delete this medical record?")` with the existing Shadcn `AlertDialog` component (already installed at `components/ui/alert-dialog.tsx`). Match the pattern used in other modules.

### Step 1.5 — Verify Sprint 1

// turbo

1. Run `npx next build` — must pass with 0 errors
2. Browser test: navigate to each module, trigger loading states, trigger an error boundary, delete a medical record

---

## Sprint 2 — Feature Completions (Mostly additive, no schema changes)

**Goal:** Wire up stub buttons and add missing detail pages.

### Step 2.1 — Wire "Schedule Follow-up" button

In `appointment-summary-client.tsx`:

- Import `AppointmentDialog` or use `useRouter` to navigate to appointments page with query params
- Pre-fill: same `pet_id`, same `vet_id`, `start_time` = 2 weeks from now, `reason` = "Follow-up: [original reason]"
- The button should either open a dialog or navigate with pre-filled data

### Step 2.2 — Owner Detail Page

Create `/dashboard/owners/[id]/page.tsx` and `owner-profile-client.tsx`:

- Follow the pattern in `pets/[id]/page.tsx`
- Show owner info (name, email, phone, address)
- List their pets with links to pet profiles
- List their appointment history
- List their invoices

### Step 2.3 — Medical Record Detail Page

Create `/dashboard/medical-records/[id]/page.tsx` and `record-detail-client.tsx`:

- Show full record: visit date, complaint, diagnosis, treatment, prescriptions
- Display uploaded images (if any)
- Link to the associated pet profile
- Add breadcrumb navigation

### Step 2.4 — Show appointment number in list view

In `appointments-client.tsx`, add an "Apt #" column to the table that displays the `appointment_number` formatted as `AP-YYYY-NNN`.

### Step 2.5 — Verify Sprint 2

// turbo

1. Run `npx next build` — must pass with 0 errors
2. Browser test: Schedule Follow-up flow, owner detail page, medical record detail page, appointment numbers in list

---

## Sprint 3 — PDF Export & Print (Additive feature)

**Goal:** Add the ability to export / print the appointment summary as a PDF.

### Step 3.1 — Appointment Summary Print CSS

Add a `@media print` stylesheet to `appointment-summary-client.tsx` or a dedicated `print.css`:

- Hide sidebar, header, buttons
- Format the summary as a clean single-page document
- Include all vitals, prescriptions, recommendations

### Step 3.2 — PDF Export (Optional Enhancement)

If the user wants downloadable PDFs beyond browser print:
// turbo

- Install `@react-pdf/renderer`: `npm install @react-pdf/renderer`
- Create a `components/appointment-pdf.tsx` server-rendered PDF component
- Add a "Download PDF" button to the appointment detail page

### Step 3.3 — Verify Sprint 3

1. Browser test: click Print on an appointment summary, verify the print preview looks clean
2. If PDF export was added, verify the downloaded PDF contains all data

---

## Sprint 4 — Pagination & Performance (Safe refactor)

**Goal:** Add pagination to prevent performance issues as data grows.

### Step 4.1 — Create reusable pagination component

Create `components/pagination.tsx`:

- Accept `currentPage`, `totalPages`, `onPageChange` props
- Show page numbers, previous/next buttons
- Match the existing Shadcn UI design

### Step 4.2 — Add pagination to each list view

For each module, update the server component to accept `?page=N` search params and limit queries:

- `owners/page.tsx` — paginate owners list
- `pets/page.tsx` — paginate pets list (if it exists as a flat list)
- `medical-records/page.tsx` — paginate records
- `appointments/page.tsx` — paginate appointments (list view only, not calendar)
- `invoices/page.tsx` — paginate invoices

Pattern: `.range(from, to)` in Supabase queries with `{ count: "exact" }` for total count.

### Step 4.3 — Verify Sprint 4

// turbo

1. Run `npx next build`
2. Browser test: navigate between pages on each list view, verify counts are correct

---

## Sprint 5 — Email Integration (Requires external service)

**Goal:** Replace the invoice email stub with real email delivery.

### Step 5.1 — Choose and configure email provider

Options (pick one):

- **Resend** — simplest, best DX: `npm install resend`
- **SendGrid** — more established: `npm install @sendgrid/mail`
- **Supabase Edge Function** — no additional dependency

### Step 5.2 — Create email API route

Create `app/api/send-invoice/route.ts`:

- Accept invoice ID in the request body
- Fetch invoice + line items + owner email from Supabase
- Generate HTML email with invoice details
- Send via chosen provider
- Return success/error response

### Step 5.3 — Update invoice client

In `invoices-client.tsx`, replace the `handleSendEmail` stub:

- Call the new API route
- Show loading spinner while sending
- Display success/error toast

### Step 5.4 — Verify Sprint 5

1. Create a test invoice with a valid owner email
2. Click "Send Email" and verify the email arrives
3. Verify the toast notification shows correctly

---

## Sprint 6 — Dashboard Enhancements (Additive, no risk)

**Goal:** Make the dashboard home page more useful.

### Step 6.1 — Upcoming Appointments widget

Add a card to `dashboard/page.tsx` that shows the next 5 upcoming appointments with pet name, time, and vet.

### Step 6.2 — Recent Activity feed

Add a card showing the 10 most recently created/modified records across all modules, ordered by `created_at`.

### Step 6.3 — Revenue summary

Add a card showing total invoiced amount (paid vs. outstanding) for the current month.

### Step 6.4 — Verify Sprint 6

1. Browser test: verify all dashboard widgets display correctly with real data
2. Verify the page still loads quickly

---

## Sprint 7 — Advanced Features (Higher risk, plan carefully)

**Goal:** Add role-based access and recurring appointments.

> [!WARNING]
> These features modify core behavior. Plan each one thoroughly with an implementation plan before coding.

### Step 7.1 — Role-based access control

- Audit the `profiles.role` column (currently `vet`, `admin`, `receptionist`)
- Create a `useRole()` hook or server-side helper
- Gate certain actions: only vets can add vitals/prescriptions, receptionists can manage appointments
- Add role indicator to the dashboard shell

### Step 7.2 — Recurring appointments

- Add `recurrence_rule` (TEXT) to the appointments table (iCalendar RRULE format)
- Update the appointment dialog to offer recurrence options
- Generate recurring instances in the calendar view
- Handle individual vs. series edit/delete

### Step 7.3 — Audit logging

- Create an `audit_log` table: `id, clinic_id, user_id, action, entity_type, entity_id, changes, created_at`
- Add a Supabase database trigger or application-level logging
- Create a simple audit log viewer in the dashboard

### Step 7.4 — Verify Sprint 7

1. Test role-based access with different user roles
2. Test recurring appointments create/edit/delete
3. Verify audit log captures changes

---

## Sprint 8 — Testing Infrastructure (Long-term quality)

**Goal:** Establish a test suite for ongoing quality assurance.

### Step 8.1 — Setup testing framework

// turbo

1. Install Vitest + Testing Library: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
2. Create `vitest.config.ts` with React + jsdom setup
3. Add `"test": "vitest"` to `package.json` scripts

### Step 8.2 — Component unit tests

Write tests for:

- Zod validators (all schemas with valid and invalid inputs)
- Utility functions (`computeAge`, `formatCurrency`, `computeDuration`)
- Key UI components (rendering, form submission)

### Step 8.3 — E2E tests (optional)

// turbo

1. Install Playwright: `npm install -D @playwright/test`
2. Write E2E tests for critical flows: login, create appointment, add vitals, create invoice

### Step 8.4 — Verify Sprint 8

// turbo

1. Run `npm test` — all unit tests pass
2. Run `npx playwright test` — all E2E tests pass (if configured)
