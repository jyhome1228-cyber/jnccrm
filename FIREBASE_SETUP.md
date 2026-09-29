# Firebase Connection Checklist

The frontend is now prepared so Firebase can be connected without redesigning the CRM screens.

## Already prepared

- Swappable data provider: `data-provider.js`
- Local adapter interface: `crm-store.js`
- Firebase adapter placeholder: `firebase-adapter.js`
- Firebase config template: `firebase-config.example.js`
- Role and permission model: `app-config.js`
- Schema version and local migrations
- Audit log structure
- JSON export / import for migration
- Referential delete protection
- Firestore rules draft
- Storage rules draft
- Firestore indexes draft
- Data model documentation

## When Firebase project details are available

### 1. Create Firebase Web App
Copy:

`firebase-config.example.js` → `firebase-config.js`

Fill in the Firebase web configuration.

`firebase-config.js` is already ignored by Git.

### 2. Enable Authentication
Recommended initial provider:
- Email / Password

Create the first Admin account.

Create a matching Firestore user document:

`users/{firebaseAuthUid}`

Example:

```json
{
  "crmUserId": "USR-000",
  "name": "CRM Administrator",
  "email": "admin@jncostech.com",
  "department": "Management",
  "role": "Admin",
  "active": true
}
```

### 3. Create Firestore
Recommended location should be selected based on the operating region and data requirements before production data is entered.

Collections:
- users
- customers
- leads
- projects
- formulas
- samples
- quotations
- orders
- activities
- auditLogs
- settings

### 4. Deploy Security Rules
Use `firestore.rules` as the starting point.

Important:
- Formula data is separated into `formulas` for restricted access.
- Firestore rules should remain the source of truth for permissions.
- UI permission hiding is convenience only, not security.

### 5. Enable Storage
Use folders by record type:

```text
customers/{customerId}/
projects/{projectId}/brief/
projects/{projectId}/artwork/
projects/{projectId}/formula/
samples/{sampleId}/
orders/{orderId}/
```

Before real confidential files are uploaded, replace the broad signed-in Storage rule with role-aware custom claims.

### 6. Implement firebase-adapter.js
The adapter must expose the same methods currently used by `CRMData`:

- ready()
- list(collection)
- get(collection, id)
- create(collection, data)
- update(collection, id, data)
- remove(collection, id)
- getDependencies(collection, id)
- search(query)
- getState()
- setSession()
- getSession()
- logout()
- exportData()
- importData()
- subscribe()

The UI should not call Firestore directly.

### 7. Migrate local test data
In Settings:
1. Export JSON
2. Convert / validate records
3. Import into Firestore
4. Verify relationships
5. Keep exported JSON as rollback backup

### 8. Switch provider
After the Firebase adapter is tested:

In `app-config.js`:

```js
dataProvider: 'firebase'
```

No page-level rewrite should be required.

## Production checks before launch

- Admin can manage users
- Inactive user cannot access CRM
- Sales cannot access confidential Formula data
- R&D can manage Formula and Samples
- Operations can update Production / QC / Dispatch
- Finance can update payment-related Order fields
- Audit log cannot be edited by normal users
- Customer → Project → Sample → Quote → Order links remain intact
- File access is permission-controlled
- Backup and recovery process is documented
