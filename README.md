# JN COS TECH CRM

Phase 1 frontend foundation for the JN Cos Tech internal CRM.

## Phase 1 navigation

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

## Current implementation

This first commit prepares the interface foundation:

- Responsive dashboard shell
- 10-item sidebar navigation
- KPI cards
- Today schedule
- Projects requiring attention
- Recent activity
- Project / order / payment charts
- Recent leads table
- Quick Add modal
- Login screen prototype
- Responsive mobile navigation
- Placeholder route/module states

## Files

- `index.html` — CRM dashboard prototype
- `login.html` — login prototype
- `styles.css` — shared design system
- `app.js` — UI interactions and dashboard charts

## Next implementation steps

1. Decide backend/authentication stack.
2. Connect real login and role permissions.
3. Define database schema for Customers, Leads, Projects, Samples, Quotations, Orders and Operations.
4. Implement list/detail/create/edit screens for each core module.
5. Connect Calendar to CRM due dates.
6. Connect website enquiry form to Leads.
7. Add audit history and internal notifications.

## Phase 1 scope note

Phase 1 should remain an operational CRM rather than a full ERP. Full inventory valuation, detailed factory records, accounting replacement, WhatsApp API, courier API and advanced analytics should be handled as later integrations.
