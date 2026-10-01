# JN COS TECH CRM

Internal Phase 1 CRM for JN COS TECH.

## Production status

The current build uses:

- Firebase Authentication
- Cloud Firestore
- Firestore role-based security rules
- Browser-local Firebase session persistence
- Firebase-backed audit/activity records
- Responsive desktop/mobile UI

The production entry points are protected by Firebase Authentication and include `noindex / nofollow` metadata.

## Main navigation

1. Calendar
2. Dashboard
3. Customers
4. Leads
5. Projects
6. Samples
7. Quotations
8. Orders
9. Operations
10. Settings

## Core workflow

`Lead / Enquiry → Customer → OEM / ODM Project → Product Brief → Sample → Formula / Packaging / Artwork Approval → Quotation → Order → Production → QC → Dispatch → Payment`

## Roles

- **Master / Admin** — full access and staff management
- **Management** — company-wide operational visibility
- **Sales** — customers, leads, projects, samples, quotations and order creation
- **R&D** — projects, confidential formulas and samples
- **Operations** — production, QC, dispatch and operational order fields
- **Finance** — quotations, payment and finance-related order fields
- **Staff** — limited customer/project/sample/calendar visibility

Frontend permission guards are backed by Firestore Security Rules. UI permissions are not treated as the security boundary.

## Production safeguards

- CRM writes wait for Firestore success before showing a success state.
- Failed writes remain visible in the form with an error message.
- Linked-record delete protection prevents destructive deletion of in-use records.
- Lead → Project conversion includes duplicate-conversion protection.
- Sample versions include duplicate ID protection.
- Accepted quotations can only be converted into one order.
- Operations and Finance receive role-specific order edit forms.
- Manual calendar deletion is limited to the creator, Management or Admin.
- Production mode cannot fall back to browser demo data.
- Test credentials are not exposed in the login UI.
- JSON backup export remains available to authorized settings users.

## Calendar

The calendar combines:

- Lead follow-ups
- Project target dates
- Sample feedback dates
- Quotation validity dates
- Order committed / dispatch dates
- Payment due dates
- Internal manual schedules

Linked CRM schedules open a detail preview before navigation. Dates with more than three schedules open a complete daily schedule list.

## Data model

Primary collections:

- `customers`
- `leads`
- `projects`
- `formulas`
- `samples`
- `quotations`
- `orders`
- `calendarEvents`
- `users`
- `activities`
- `auditLogs`

Formula records remain separated from general project records because they require more restrictive R&D / Management access.

## Validation

Run:

```bash
npm run validate
```

Validation checks:

- JavaScript syntax
- Required files
- JSON configuration
- Script loading order
- Firebase production provider
- Calendar duplicate declarations/functions
- Accidental production test-credential exposure
- Required `noindex` metadata
- Demo-provider fallback regression

## Scope

This remains an operational CRM rather than a full ERP. Detailed inventory valuation, factory MES functionality, accounting replacement, courier APIs, WhatsApp APIs and advanced analytics should be added as later integrations when required.
