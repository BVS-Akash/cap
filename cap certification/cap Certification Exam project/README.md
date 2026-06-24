# SAP CAP Logistics Management System

A cloud-native Logistics Management System built with **SAP Cloud Application Programming Model (CAP)** Node.js, deployed on **SAP Business Technology Platform (BTP)** using **SAP HANA** as the persistence layer.

---

## Overview

This application enables a global shipping provider to manage shipments and packages, calculating shipping fees dynamically based on package weight and transport mode. All calculations are performed on-the-fly via OData — no calculated values are stored in the database.

---

## Features

- Manage shipments with customer details and transport mode
- Track packages associated with each shipment
- Dynamically calculate total weight and shipping fee per shipment
- RESTful OData API exposed via SAP CAP
- Production-ready deployment to SAP BTP Cloud Foundry with SAP HANA

---

## Shipping Fee Rates

| Transport Mode | Code | Rate (per kg) |
|---|---|---|
| Air | A | × 15 |
| Sea | S | × 5 |
| Rail | R | × 8 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | SAP Cloud Application Programming Model (CAP) Node.js |
| Language | Node.js (JavaScript) |
| Local DB | SQLite (via @cap-js/sqlite) |
| Production DB | SAP HANA Cloud (via @cap-js/hana) |
| API | OData v4 |
| Deployment | SAP BTP Cloud Foundry |
| Packaging | Multi-Target Application (MTA) |
| Build Tool | Cloud MTA Build Tool (MBT) |
| IDE | SAP Business Application Studio (BAS) |

---

## Project Structure

```
btp-developer-training-exam/
├── db/
│   ├── schema.cds                          # Data model definitions
│   └── data/
│       ├── exam.logistics-Shipments.csv    # Seed data for Shipments
│       └── exam.logistics-Packages.csv     # Seed data for Packages
├── srv/
│   ├── logistics-service.cds              # Service definition
│   └── logistics-service.js              # Service handler (business logic)
├── package.json                           # Dependencies and CDS config
├── mta.yaml                               # MTA deployment descriptor
└── README.md                              # This file
```

---

## Prerequisites

- SAP Business Technology Platform (BTP) account
- SAP Business Application Studio (BAS) — Full Stack Cloud Application dev space
- SAP HANA Cloud instance in the target BTP subaccount
- Cloud Foundry CLI (`cf`)
- Cloud MTA Build Tool (`mbt`)
- Node.js 18 or higher

---

## Local Development Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/logistics-cap-app.git
cd logistics-cap-app

# Install dependencies (clean install)
npm ci

# Start local development server
cds watch
```

Open `http://localhost:4004` to access the CAP welcome page.

---

## API Endpoints (Local)

| Endpoint | Method | Description |
|---|---|---|
| `/logistics` | GET | Service root — lists all entities |
| `/logistics/Shipments` | GET | List all shipments with calculated fields |
| `/logistics/Shipments('AA-123')` | GET | Get a single shipment |
| `/logistics/Packages` | GET | List all packages (read-only) |
| `/logistics/Shipments?$expand=packages` | GET | Shipments with packages expanded |

---

## Deployment to SAP BTP

```bash
# Build the MTA archive
mbt build

# Login to Cloud Foundry
cf login

# Target the SUBMISSION space
cf target -s SUBMISSION

# Deploy
cf deploy mta_archives/*.mtar

# Verify deployment
cf apps
```

---

## Mock Data

### Shipments

| ID | Customer | Mode |
|---|---|---|
| AA-123 | Alpha Corp | Air (A) |
| BB-456 | Beta Ltd | Sea (S) |

### Packages

| ID | Contents | Weight | Shipment |
|---|---|---|---|
| P1 | Package 1 | 10 kg | AA-123 |
| P2 | Package 2 | 5.5 kg | AA-123 |
| P3 | Package 3 | 100 kg | BB-456 |

### Expected Calculated Results

| Shipment | Total Weight | Shipping Fee |
|---|---|---|
| AA-123 (Air × 15) | 15.5 kg | 232.50 |
| BB-456 (Sea × 5) | 100 kg | 500.00 |

---

## License

This project is developed as part of the SAP Certified Backend Developer — SAP Cloud Application Programming Model (C_CPE_2601) certification exam.
