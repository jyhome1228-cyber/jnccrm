# JN COS TECH CRM — Data Model

This document defines the Phase 1 data contract before Firebase is connected.

## Collections

### users
Recommended Firestore document ID: **Firebase Auth UID**

Fields:
- crmUserId
- name
- email
- department
- role
- active
- createdAt
- updatedAt

Roles:
- Admin
- Management
- Sales
- R&D
- Operations
- Finance
- Staff

### customers
Document ID may use generated CRM ID such as `CUS-001`.

Fields:
- id
- company
- country
- type
- contact
- email
- phone
- owner
- status
- paymentTerms
- notes
- createdAt
- updatedAt

### leads
Fields:
- id
- company
- contact
- email
- phone
- country
- type
- source
- owner
- status
- nextAction
- nextActionDate
- details
- createdAt
- updatedAt

### projects
General project information only.

Fields:
- id
- customerId
- name
- category
- salesOwner
- rdOwner
- targetDate
- moq
- targetPrice
- status
- brief
- concept
- claims
- targetConsumer
- benchmark
- texture
- fragrance
- requestedActives
- excludedIngredients
- launchDate
- packagingType
- packagingCapacity
- packagingMaterial
- packagingColor
- packagingComponent
- packagingSupplier
- packagingStatus
- compatibilityStatus
- artworkVersion
- artworkStatus
- artworkOwner
- artworkApprovalDate
- artworkNotes
- approvalType
- approvalStatus
- approvalBy
- approvalDate
- approvalComment
- documents
- updatedAt

## Confidential formula data

For Firebase production, formula information should **not** remain inside the general project document if Sales users can read Projects.

Use a separate collection:

### formulas
Recommended document ID: project ID or generated formula version ID.

Fields:
- projectId
- version
- status
- rdOwner
- approvalDate
- comments
- createdAt
- updatedAt

Access:
- Admin
- Management
- R&D

The current local prototype presents formula information as part of the Project UI. The Firebase adapter should transparently join the formula record into the Project detail view.

### samples
Fields:
- id
- projectId
- version
- rdOwner
- createdDate
- quantity
- status
- dispatchDate
- courier
- tracking
- feedbackDate
- feedback
- updatedAt

### quotations
Fields:
- id
- projectId
- version
- moq
- unitPrice
- otherCharges
- paymentTerms
- leadTime
- validUntil
- status
- notes
- updatedAt

### orders
Fields:
- id
- quoteId
- customerId
- projectId
- po
- quantity
- orderDate
- committedDate
- readiness
- productionStatus
- qcStatus
- dispatchStatus
- tracking
- total
- advance
- balance
- paymentDue
- paymentStatus
- operationsNotes
- updatedAt

### activities
Append-only operational timeline.

Fields:
- id
- text
- meta
- createdAt

### auditLogs
Append-only security / change history.

Fields:
- id
- action
- collection
- recordId
- actor
- before
- after
- createdAt

### settings
Recommended single document: `settings/system`.

Fields:
- companyName
- defaultCurrency
- dateFormat
- idPrefixes

## Relationships

```text
Customer
 ├─ Leads
 ├─ Projects
 │   ├─ Formula (restricted)
 │   ├─ Samples
 │   ├─ Quotations
 │   └─ Orders
 └─ Orders
```

## Delete policy

Do not hard-delete records that still have linked children.

Current prototype already blocks:
- Customer deletion when Projects or Orders exist
- Project deletion when Samples, Quotations or Orders exist
- Quotation deletion when an Order was created from it

In Firebase production, prefer archive / inactive flags for important commercial records.

## Timestamps

When Firebase is connected:
- replace browser ISO timestamps with Firestore server timestamps
- keep display conversion in the UI layer
- never trust the client clock for audit records
