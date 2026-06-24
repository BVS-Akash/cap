# Technical Design Document
## SAP CAP Logistics Management System

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│               Client (Browser / HTTP)                │
└────────────────────────┬────────────────────────────┘
                         │ OData v4 requests
┌────────────────────────▼────────────────────────────┐
│           SAP CAP Node.js Application               │
│                                                      │
│   ┌──────────────────────────────────────────────┐  │
│   │           LogisticsService                    │  │
│   │   /logistics/Shipments                        │  │
│   │   /logistics/Packages (read-only)             │  │
│   └──────────────────────────────────────────────┘  │
│                                                      │
│   ┌──────────────────────────────────────────────┐  │
│   │         logistics-service.js (Handler)        │  │
│   │   after('READ', 'Shipments') →               │  │
│   │     fetch packages → calculate fields         │  │
│   └──────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
┌─────────▼──────────┐      ┌──────────▼──────────┐
│  SQLite (local dev) │      │  SAP HANA (production)│
│  in-memory          │      │  HDI Container        │
└─────────────────────┘      └──────────────────────┘
```

---

## 2. Data Model

### Namespace
```
exam.logistics
```

### Enum: TransportMode
```cds
type TransportMode : String enum {
    Sea  = 'S';
    Air  = 'A';
    Rail = 'R';
}
```

### Entity: Shipments
| Field | Type | Description |
|---|---|---|
| ID | UUID (key) | Unique identifier |
| customer | String | Customer name |
| mode | TransportMode | Transport mode (A/S/R) |
| packages | Composition of many Packages | Associated packages |
| totalWeight | Decimal(10,2) virtual | Sum of all package weights |
| shippingFee | Decimal(10,2) virtual | totalWeight × mode rate |

### Entity: Packages
| Field | Type | Description |
|---|---|---|
| ID | UUID (key) | Unique identifier |
| contents | String | Description of package contents |
| weight | Decimal(10,2) | Weight in kg |
| parent | Association to Shipments | Back-link to parent shipment |

### Entity Relationship
```
Shipments (1) ──────── (many) Packages
   │                              │
   └── Composition                └── Association (parent)
```

---

## 3. Service Definition

### File: `srv/logistics-service.cds`

```cds
using exam.logistics as logistics from '../db/schema';

service LogisticsService @(path: '/logistics') {
    entity Shipments as projection on logistics.Shipments;
    @readonly entity Packages as projection on logistics.Packages;
}
```

- `LogisticsService` is exposed at path `/logistics`
- `Shipments` — full CRUD access
- `Packages` — read-only (`@readonly`)

---

## 4. Business Logic

### File: `srv/logistics-service.js`

#### Logic Flow

```
Client sends GET /logistics/Shipments
           │
           ▼
CAP fetches Shipments from DB
           │
           ▼
after('READ', 'Shipments') handler fires
           │
           ▼
For each shipment:
  ┌─────────────────────────────────┐
  │ Are packages already expanded?  │
  │  (e.g. via $expand=packages)    │
  └────────────┬────────────────────┘
               │
       YES ────┘──── NO
       │              │
       │              ▼
       │     SELECT packages WHERE
       │     parent_ID = shipment.ID
       │              │
       └──────────────┘
               │
               ▼
    totalWeight = sum of all package weights
               │
               ▼
    rate = RATES[shipment.mode]
    (A=15, S=5, R=8)
               │
               ▼
    shippingFee = totalWeight × rate
               │
               ▼
    Return enriched shipment to client
```

#### Rate Table
```javascript
const RATES = {
    A: 15,  // Air
    S: 5,   // Sea
    R: 8    // Rail
}
```

#### Handling Unexpanded Packages
The handler explicitly checks if packages are already loaded. This handles two cases:

| Scenario | Request | packages available? | Action |
|---|---|---|---|
| 1 | `GET /logistics/Shipments` | No | Manually fetch from DB |
| 2 | `GET /logistics/Shipments?$expand=packages` | Yes | Use existing data |

---

## 5. Project File Structure

```
btp-developer-training-exam/
│
├── db/                                     # Database layer
│   ├── schema.cds                          # CDS data model
│   └── data/                              # CSV seed data (local dev)
│       ├── exam.logistics-Shipments.csv
│       └── exam.logistics-Packages.csv
│
├── srv/                                    # Service layer
│   ├── logistics-service.cds              # Service exposure definition
│   └── logistics-service.js              # Business logic handler
│
├── gen/                                    # Generated build output (auto)
│   ├── srv/                               # Compiled service for deployment
│   └── db/                               # Compiled DB artifacts for HANA
│
├── mta_archives/                          # MTA build output (auto)
│   └── c_cpe_template_1.0.0.mtar        # Deployable archive
│
├── node_modules/                          # npm dependencies (auto)
├── package.json                           # Project config and CDS settings
├── mta.yaml                               # MTA deployment descriptor
└── README.md                              # Project documentation
```

---

## 6. Configuration

### `package.json` — CDS Configuration

```json
"cds": {
  "requires": {
    "db": "sql",
    "[production]": {
      "db": {
        "kind": "hana"
      },
      "auth": {
        "kind": "dummy"
      }
    }
  },
  "auth": {
    "kind": "dummy"
  }
}
```

| Setting | Local | Production |
|---|---|---|
| Database | SQLite (in-memory) | SAP HANA Cloud |
| Authentication | dummy (none) | dummy (none) |

---

## 7. MTA Deployment Architecture

### `mta.yaml` Modules

```
MTA: c_cpe_template
│
├── Module: c_cpe_template-srv          (Node.js app)
│   ├── type: nodejs
│   ├── path: gen/srv
│   ├── buildpack: nodejs_buildpack
│   ├── app-name: ${space}-c_cpe_submission-srv
│   ├── route: ${org}-cpe-submission.${default-domain}
│   └── requires: c_cpe_template-db
│
├── Module: c_cpe_template-db-deployer  (HANA deployer)
│   ├── type: hdb
│   ├── path: gen/db
│   └── requires: c_cpe_template-db
│
└── Resource: c_cpe_template-db        (HANA HDI Container)
    ├── type: com.sap.xs.hdi-container
    └── service: hana
```

### Deployment Flow

```
mbt build
    │
    ▼
Compiles CDS → gen/srv and gen/db
    │
    ▼
Packages into .mtar archive
    │
    ▼
cf deploy mta_archives/*.mtar
    │
    ├── Creates HDI container (HANA DB)
    ├── Deploys DB schema (db-deployer)
    └── Starts Node.js srv app
```

---

## 8. API Reference

### Base URL (Production)
```
https://sap-exam-c-cpe--c-cpe-cpe-a004231-cf-eu10-sd-cpe-submission.cfapps.eu10-005.hana.ondemand.com
```

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/logistics` | OData service root |
| GET | `/logistics/Shipments` | All shipments with virtual fields |
| GET | `/logistics/Shipments('AA-123')` | Single shipment |
| GET | `/logistics/Shipments?$expand=packages` | Shipments with packages |
| GET | `/logistics/Packages` | All packages (read-only) |

### Sample Response — `GET /logistics/Shipments`

```json
{
  "value": [
    {
      "ID": "AA-123",
      "customer": "Alpha Corp",
      "mode": "A",
      "totalWeight": 15.5,
      "shippingFee": 232.5
    },
    {
      "ID": "BB-456",
      "customer": "Beta Ltd",
      "mode": "S",
      "totalWeight": 100,
      "shippingFee": 500
    }
  ]
}
```

---

## 9. Virtual Fields Explained

Virtual fields (`totalWeight`, `shippingFee`) are declared with the `virtual` keyword in CDS:

```cds
virtual totalWeight : Decimal(10,2);
virtual shippingFee : Decimal(10,2);
```

| Property | Behavior |
|---|---|
| Stored in DB | No — no column created |
| Appears in OData | Yes — visible in API response |
| Default value | null (until handler fills them) |
| Calculated by | `after('READ')` handler in JS |

---

## 10. Environment Differences

| Aspect | Local (`cds watch`) | Production (`cf deploy`) |
|---|---|---|
| Database | SQLite in-memory | SAP HANA Cloud HDI Container |
| Data persistence | Resets on restart | Persistent |
| Seed data | CSV files auto-loaded | Loaded once via db-deployer |
| Auth | dummy | dummy |
| URL | `http://localhost:4004` | BTP Cloud Foundry route |
| Config profile | default | `[production]` |
