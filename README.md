# JN COS TECH CRM

Phase 1 internal CRM for JN Cos Tech.

## Navigation

1. Dashboard
2. Customers
3. Leads
4. Projects
5. Samples
6. Quotations
7. Orders
8. Operations
9. Calendar
10. Settings

## Core workflow

Lead / Enquiry  
→ Customer  
→ OEM / ODM Project  
→ Product Brief  
→ Sample Versions / Feedback  
→ Formula / Artwork Approval  
→ Quotation  
→ Order  
→ Production  
→ QC  
→ Dispatch  
→ Payment Status

## Implemented in this phase

### Authentication shell
- Login screen
- Browser session persistence
- Protected CRM entry
- Sign out

> Current authentication is intentionally local for Phase 1 prototyping. Replace it with Firebase Auth, Supabase Auth or another production authentication provider before real customer data is stored.

### Dashboard
- Live KPI counts from CRM records
- Upcoming schedule
- Projects requiring attention
- Recent activity
- Project status chart
- Lead pipeline chart
- Payment status chart
- Recent leads
- Notification count

### Customers
- Create / edit / delete
- Customer company information
- Customer 360° detail screen
- Linked projects, quotations and orders
- Internal notes

### Leads
- Create / edit / delete
- Enquiry type and source
- Owner and next action
- Pipeline status
- Convert Lead → Customer + Project

### Projects
- Create / edit / delete
- Customer relation
- Sales and R&D owners
- Project status
- Detailed tabbed project workspace
- Product Brief structured fields
- Formula version / owner / status / approval date / notes
- Packaging specification / supplier / compatibility
- Artwork version / approval status / notes
- Approval records with approver, date and comments
- Document references
- Project activity history
- Linked samples, quotations and orders

### Samples
- Create / edit / delete
- Version control structure
- Dispatch information
- Tracking / AWB
- Expected feedback date
- Customer feedback

### Quotations
- Create / edit / delete
- Project relation
- Version, MOQ, unit price, terms, lead time and validity
- Commercial status
- Accepted Quotation → Order conversion
- Duplicate order conversion prevention

### Orders
- Create / edit / delete
- Project and customer relation
- Quotation reference
- PO / quantity / committed date
- Readiness
- Production status
- QC status
- Dispatch status / tracking
- Payment status
- Operations notes

### Operations
- Production visibility
- QC status
- Dispatch status
- Per-order progress view
- Direct status update control from Operations
- Operations notes and committed dates

### Calendar
- Lead follow-ups
- Project targets
- Sample feedback dates
- Quotation expiry
- Order committed dates
- Payment due dates

### Global functions
- Search across core records
- Notifications
- Activity history
- Responsive desktop/mobile navigation
- Persistent local demo data

## Current data layer

The current build uses browser `localStorage` through `crm-store.js`.

This is suitable for:
- UX validation
- Workflow testing
- Client review
- Phase 1 frontend development

It is **not** suitable for production multi-user use.

## Next backend step

Recommended next milestone:

1. Connect production authentication.
2. Replace localStorage with a shared cloud database.
3. Apply role-based permissions.
4. Add file storage.
5. Connect JN Cos Tech website enquiries to Leads.
6. Add audit logs at database level.

## Suggested backend

A practical next stack is:

- Firebase Authentication
- Firestore
- Firebase Storage

or an equivalent Supabase/PostgreSQL implementation.

## Phase 1 scope note

This CRM should remain an operational workflow system rather than a full ERP. Full inventory valuation, detailed factory records, accounting replacement, WhatsApp API, courier API and advanced analytics should be handled as later integrations.


## Latest workflow milestone

The core Phase 1 workflow is now interactive through:

`Lead → Customer / Project → Product Brief → Formula / Packaging / Artwork / Approval → Sample → Quotation → Accepted Quote → Order → Production / QC / Dispatch`

The next implementation milestone is the shared backend:

- production authentication
- shared database
- cloud file storage
- real role permissions
- website enquiry integration
