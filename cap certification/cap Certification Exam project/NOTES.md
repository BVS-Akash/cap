# Project Notes
## SAP CAP Logistics Management System
### Commands, Explanations & Lessons Learned

---

## 1. Environment Setup

### Clone the Repository
```bash
git clone https://github.com/sap-samples/btp-developer-training-exam
```
**What it does:** Downloads the exam template project from GitHub into your BAS workspace.

---

### Navigate into the Project
```bash
cd btp-developer-training-exam
```
**What it does:** Changes the terminal working directory to the cloned project folder.

---

### Clean Install Dependencies
```bash
npm ci
```
**What it does:** Installs all dependencies exactly as defined in `package-lock.json`. Deletes `node_modules` first and reinstalls fresh. Stricter than `npm install`.

**Why `npm ci` and not `npm install`:**
- `npm install` may update versions and modify `package-lock.json`
- `npm ci` guarantees exact versions — required for exam submission consistency

---

### Verify Tool Versions
```bash
cds --version
node --version
mbt --version
cf --version
```
**What it does:** Confirms all required tools are available in the BAS dev space before starting development.

---

## 2. Local Development

### Start Local Development Server
```bash
cds watch
```
**What it does:** Starts the CAP server in watch mode. Automatically reloads when any `.cds`, `.js`, or `.json` file changes. Uses SQLite in-memory database by default.

**Access:** `http://localhost:4004`

---

### Why `cds watch` Shows "No models found" Initially
This is expected when `db/` and `srv/` folders are empty. CAP needs at least one `.cds` file to start serving. Once `db/schema.cds` is created, this error disappears.

---

### Test OData Endpoints Locally
```
http://localhost:4004/logistics               → Service root
http://localhost:4004/logistics/Shipments     → All shipments
http://localhost:4004/logistics/Packages      → All packages
http://localhost:4004/logistics/Shipments?$expand=packages → With packages
```

---

## 3. CDS Commands

### Add MTA Support
```bash
cds add mta
```
**What it does:** Generates the `mta.yaml` deployment descriptor pre-configured for CAP with Node.js runtime and HDI container. No XSUAA is added by default when no auth is configured.

---

### Build for Production (manual)
```bash
npx cds build --production
```
**What it does:** Compiles CDS models into the `gen/` folder — generates `gen/srv` (Node.js app) and `gen/db` (HANA artifacts). This is automatically called by `mbt build`.

---

## 4. NPM Package Management

### Remove Incompatible Package
```bash
npm remove @sap/cds-hana
```
**What it does:** Removes the old `@sap/cds-hana` package which is incompatible with CDS 9.x. The replacement is `@cap-js/hana` which was already present in the template.

**Lesson learned:** CDS 9.x uses `@cap-js/hana` — not `@sap/cds-hana`. The old package throws an error on startup.

---

### Check Installed Packages
```bash
cat package.json
```
**What it does:** Displays the current project dependencies and CDS configuration.

---

## 5. MTA Build and Deploy

### Build MTA Archive
```bash
mbt build
```
**What it does:**
1. Runs `npm ci` to install dependencies
2. Runs `npx cds build --production` to compile CDS models
3. Packages everything into a `.mtar` archive in `mta_archives/`

**Output file:** `mta_archives/c_cpe_template_1.0.0.mtar`

---

### Login to Cloud Foundry
```bash
cf login
```
**What it does:** Authenticates with the SAP BTP Cloud Foundry environment. Prompts for API endpoint, email, and password.

---

### Target a Specific Space
```bash
cf target -s SUBMISSION
```
**What it does:** Sets the active Cloud Foundry space to `SUBMISSION` — all subsequent CF commands will operate in this space.

---

### Deploy MTA Archive
```bash
cf deploy mta_archives/*.mtar
```
**What it does:**
1. Uploads the `.mtar` archive to BTP
2. Creates the HDI container (HANA DB) if it doesn't exist
3. Runs the DB deployer to create HANA tables from CDS schema
4. Deploys and starts the Node.js application
5. Maps the configured route to the app

---

### Retry a Failed Deployment
```bash
cf deploy -i <OPERATION_ID> -a retry
```
**What it does:** Retries a failed MTA deployment using the operation ID shown in the deploy output.

---

### Abort a Failed Deployment
```bash
cf deploy -i <OPERATION_ID> -a abort
```
**What it does:** Aborts an ongoing or stuck MTA deployment operation.

---

### Verify Deployment Status
```bash
cf apps
```
**What it does:** Lists all deployed apps in the current CF space with their status (`started` / `stopped` / `crashed`), instances, memory, and URLs.

---

### View App Logs
```bash
cf logs SUBMISSION-c_cpe_submission-srv --recent
```
**What it does:** Shows the most recent log output from the deployed app. Essential for debugging startup crashes.

---

### Stream Live Logs
```bash
cf logs SUBMISSION-c_cpe_submission-srv
```
**What it does:** Streams real-time logs from the app. Press `Ctrl+C` to stop.

---

### Download MTA Operation Logs
```bash
cf dmol -i <OPERATION_ID>
```
**What it does:** Downloads detailed MTA deployment logs for a specific operation. Useful for debugging complex deployment failures.

---

## 6. Git Commands

### Check Repository Status
```bash
git status
```
**What it does:** Shows which files have been modified, added, or deleted since the last commit.

---

### Stage All Changes
```bash
git add .
```
**What it does:** Stages all changed files for the next commit. The `.` means "all files in current directory".

---

### Commit Changes
```bash
git commit -m "Complete SAP CAP Logistics Management System"
```
**What it does:** Creates a commit with all staged changes and a descriptive message.

---

### Change Remote Origin
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/repo-name.git
```
**What it does:** Removes the original SAP samples remote and adds your own GitHub repo as the new remote.

---

### Push to GitHub
```bash
git push -u origin main
```
**What it does:** Pushes your local commits to the remote GitHub repository. `-u` sets the upstream so future pushes only need `git push`.

---

## 7. File Utility Commands

### Create a ZIP Archive (Excluding Unnecessary Folders)
```bash
zip -r logistics-app.zip btp-developer-training-exam \
  --exclude "*/node_modules/*" \
  --exclude "*/.git/*" \
  --exclude "*/mta_archives/*"
```
**What it does:** Creates a zip of the project folder, skipping `node_modules` (large, auto-generated), `.git` (version history), and `mta_archives` (build output).

---

### List Files in a Directory
```bash
ls -la
```
**What it does:** Lists all files including hidden files (`-a`) with detailed info like permissions, size, and date (`-l`).

---

### Read a File's Contents
```bash
cat package.json
cat mta.yaml
```
**What it does:** Prints the full contents of a file to the terminal.

---

### Create a File with Content (heredoc)
```bash
cat > db/schema.cds << 'EOF'
... content ...
EOF
```
**What it does:** Creates a new file and writes the content between `EOF` markers into it. Overwrites the file if it already exists.

---

### Create a Directory
```bash
mkdir -p db/data
```
**What it does:** Creates the `db/data` directory. `-p` means create parent directories if they don't exist and don't error if the directory already exists.

---

## 8. Errors Encountered & Fixes

### Error: No models found
```
TypeError: (e.files || cds.resolve(...)).filter is not a function
```
**Cause:** `db/` and `srv/` folders exist but have no `.cds` files yet.
**Fix:** Create `db/schema.cds` — the error disappears automatically.

---

### Error: Virtual keyword misplaced
```
Mismatched 'virtual', expecting ';', '}', '@'
```
**Cause:** In CDS 9.x, `virtual` goes BEFORE the field name, not after the type.
**Wrong:** `totalWeight : Decimal(10,2) virtual;`
**Correct:** `virtual totalWeight : Decimal(10,2);`

---

### Error: @sap/cds-hana incompatible
```
Error: @sap/cds-hana is incompatible with @sap/cds version 9 and higher
```
**Cause:** `@sap/cds-hana` is the old package, replaced by `@cap-js/hana` in CDS 9.x.
**Fix:** `npm remove @sap/cds-hana` — `@cap-js/hana` was already in the template.

---

### Error: JWT auth — no XSUAA bound
```
Error: Authentication kind "jwt" configured, but no XSUAA instance bound
```
**Cause:** In production, CAP defaults to JWT auth which requires XSUAA. The exam disables auth.
**Fix:** Add `"auth": { "kind": "dummy" }` to both the root and `[production]` profile in `package.json`.

---

### Error: Didn't find auth implementation for `none`
```
Error: Didn't find auth implementation for { kind: 'none' }
```
**Cause:** In CDS 9.x, `"auth": "none"` is no longer valid syntax.
**Fix:** Replace with `"auth": { "kind": "dummy" }`.

---

### Error: app-name uses `${cap}` instead of `${space}`
**Cause:** Typo in `mta.yaml` — used `${cap}` instead of the correct `${space}` placeholder.
**Fix:** Change `app-name: ${cap}-c_cpe_submission-srv` to `app-name: ${space}-c_cpe_submission-srv`.

---

## 9. Key Concepts

### What is `virtual` in CDS?
A `virtual` field exists in the OData API but is never stored in the database. Its value is always `null` until populated by a service handler at runtime.

---

### What is an HDI Container?
HANA Deployment Infrastructure (HDI) container is a managed database schema on SAP HANA Cloud. The MTA deployer automatically creates it during deployment — no manual HANA setup needed.

---

### What is MTA?
Multi-Target Application (MTA) is a deployment format for SAP BTP. A single `.mtar` archive can contain multiple modules (Node.js app, DB deployer) and resources (HANA service) that are deployed together as a unit.

---

### Why does the CAP welcome page not show in production?
The welcome page (`http://localhost:4004`) is only available in development mode (`cds watch`). In production (`cds-serve`), only the actual OData endpoints are served. Always append `/logistics` or `/logistics/Shipments` to the production URL.

---

### `$expand` in OData
Adding `?$expand=packages` to a Shipments request tells CAP to include the related Packages in the response. Without it, only the Shipments fields are returned. The JS handler handles both cases.

---

## 10. Important File Naming Conventions

| File | Naming Rule |
|---|---|
| CSV seed files | Must match `<namespace>-<EntityName>.csv` exactly |
| JS handler | Must have same base name as `.cds` service file |
| MTA module name | Auto-generated by `cds add mta` based on `package.json` name |

**Example:**
- Entity namespace: `exam.logistics`
- Entity name: `Shipments`
- CSV file must be: `exam.logistics-Shipments.csv`
