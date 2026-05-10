# KAI-Netics Supabase Sync Architecture
**Version:** 1.0 | **Date:** May 8, 2026 | **Status:** PROPOSED — Pending Kevin Approval

---

## 1. Governing Principles

| Rule | Statement |
|------|-----------|
| **Production** | Cloud Supabase (`raxpmeltyxmtiihxoxpa.supabase.co`) is the system of record. Never replaced. |
| **Mirror** | Local Supabase (`localhost:8000`) is dev/test/fallback only. Never authoritative. |
| **Sync Direction** | Normal: Cloud → Local. Reverse (Local → Cloud) requires explicit Kevin approval. |
| **Local Writes** | All local writes tagged: `source='local'`, `sync_status='pending'`, timestamps. |
| **No Auto-Promote** | Local writes never auto-sync to cloud. Manual review + approval required. |
| **No Service Keys in Browser** | All privileged operations via n8n or server-side PowerShell scripts. |

---

## 2. Environment Modes

### CLOUD (default/production)
- Dashboard reads/writes → Cloud Supabase
- n8n agents → Cloud Supabase
- Status chip: 🟢 CLOUD PRODUCTION
- Used for: all live operations

### LOCAL (dev/disconnected)
- Dashboard reads/writes → Local Supabase (localhost:8000)
- n8n agents → unchanged (still cloud)
- Status chip: 🟡 LOCAL DEV MIRROR
- Used for: offline development, CORS-free testing, disconnected ops
- All writes tagged: source='local', sync_status='pending'

### HYBRID (fallback)
- Dashboard reads → Local (fast, no CORS)
- Dashboard writes → Local queue + attempts cloud in background
- Status chip: 🟠 HYBRID — SYNC QUEUED
- Used for: cloud degraded/slow, network issues
- Sync queue holds local writes pending Kevin approval to promote

---

## 3. Data Flow Diagram

```
CLOUD SUPABASE (Production)
        │
        │  Cloud → Local sync (scheduled or manual)
        │  PowerShell: Export → Import
        ▼
LOCAL SUPABASE (Mirror)
        │
        │  Local writes (tagged source='local', sync_status='pending')
        │
        ▼
KAI SYNC QUEUE (localStorage + kai_sync_queue table)
        │
        │  Kevin reviews + approves
        │
        ▼
CLOUD SUPABASE (via n8n sync workflow — server-side only)
```

---

## 4. Required Schema Additions (local only)

Add two columns to all tables in local Supabase:

```sql
-- Run on LOCAL only, never cloud
ALTER TABLE pipeline ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'cloud';
ALTER TABLE pipeline ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';
ALTER TABLE pipeline ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

ALTER TABLE grant_applications ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'cloud';
ALTER TABLE grant_applications ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';
ALTER TABLE grant_applications ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Repeat for all tables: scout_reports, agent_runs, contacts, etc.
```

Cloud schema is NEVER modified for local sync purposes.

---

## 5. Backup Folder Structure

```
C:\Kinetic_Core\Backups\Supabase\
  cloud\
    schema\
      cloud_schema_YYYYMMDD_HHMM.sql     ← DDL only, no data
    data\
      cloud_data_YYYYMMDD_HHMM.sql       ← full data dump
    snapshots\
      cloud_snapshot_YYYYMMDD_HHMM.json  ← JSON export via REST API
  local\
    schema\
      local_schema_YYYYMMDD_HHMM.sql
    data\
      local_data_YYYYMMDD_HHMM.sql
  sync_queue\
    kai_sync_queue_YYYYMMDD_HHMM.json    ← exported from dashboard
```

---

## 6. PowerShell Commands

### 6A. Create backup folders
```powershell
$base = "C:\Kinetic_Core\Backups\Supabase"
New-Item -ItemType Directory -Force -Path "$base\cloud\schema"
New-Item -ItemType Directory -Force -Path "$base\cloud\data"
New-Item -ItemType Directory -Force -Path "$base\cloud\snapshots"
New-Item -ItemType Directory -Force -Path "$base\local\schema"
New-Item -ItemType Directory -Force -Path "$base\local\data"
New-Item -ItemType Directory -Force -Path "$base\sync_queue"
Write-Host "✓ Backup folders created" -ForegroundColor Green
```

### 6B. Export cloud schema (DDL only — safe, no data)
```powershell
# Requires: psql or pg_dump accessible in PATH
# Connection string uses cloud DB direct connection (from Supabase dashboard → Settings → Database)
# Replace [DB-PASSWORD] with cloud Postgres password from Supabase dashboard

$ts = Get-Date -Format "yyyyMMdd_HHmm"
$out = "C:\Kinetic_Core\Backups\Supabase\cloud\schema\cloud_schema_$ts.sql"
$env:PGPASSWORD = "[DB-PASSWORD]"
pg_dump `
  --host=db.raxpmeltyxmtiihxoxpa.supabase.co `
  --port=5432 `
  --username=postgres `
  --dbname=postgres `
  --schema-only `
  --no-owner `
  --no-acl `
  --schema=public `
  --file=$out
Write-Host "✓ Cloud schema exported to $out" -ForegroundColor Green
```

### 6C. Export cloud data (full dump — run before any local import)
```powershell
$ts = Get-Date -Format "yyyyMMdd_HHmm"
$out = "C:\Kinetic_Core\Backups\Supabase\cloud\data\cloud_data_$ts.sql"
$env:PGPASSWORD = "[DB-PASSWORD]"
pg_dump `
  --host=db.raxpmeltyxmtiihxoxpa.supabase.co `
  --port=5432 `
  --username=postgres `
  --dbname=postgres `
  --data-only `
  --no-owner `
  --no-acl `
  --schema=public `
  --file=$out
Write-Host "✓ Cloud data exported to $out" -ForegroundColor Green
```

### 6D. Export cloud snapshot via REST API (no pg_dump required)
```powershell
# Safe — uses anon key, public tables only
$ts = Get-Date -Format "yyyyMMdd_HHmm"
$out = "C:\Kinetic_Core\Backups\Supabase\cloud\snapshots\cloud_snapshot_$ts.json"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheHBtZWx0eXhtdGlpaHhveHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODI5MDIsImV4cCI6MjA5MjM1ODkwMn0.UScReg6BG4pimbjMeIE7NB2glcpdbgUbDLnDhDLURPM"
$base = "https://raxpmeltyxmtiihxoxpa.supabase.co/rest/v1"
$headers = @{ "apikey" = $key; "Authorization" = "Bearer $key" }

$snapshot = @{
  timestamp = (Get-Date -Format "o")
  pipeline = (Invoke-RestMethod "$base/pipeline?select=*" -Headers $headers)
  grant_applications = (Invoke-RestMethod "$base/grant_applications?select=*" -Headers $headers)
  scout_reports = (Invoke-RestMethod "$base/scout_reports?select=*" -Headers $headers)
}
$snapshot | ConvertTo-Json -Depth 10 | Out-File $out -Encoding utf8
Write-Host "✓ Cloud snapshot exported to $out" -ForegroundColor Green
```

### 6E. Import cloud schema to local (after backup confirmed)
```powershell
# Run ONLY after Kevin approves — requires schema backup to exist first
$schema_file = "C:\Kinetic_Core\Backups\Supabase\cloud\schema\[FILENAME].sql"
$env:PGPASSWORD = "bNK0jMXQvygPNYisNyCaGheyVDVexpKk"
psql `
  --host=localhost `
  --port=5432 `
  --username=postgres `
  --dbname=postgres `
  --file=$schema_file
Write-Host "✓ Schema imported to local Supabase" -ForegroundColor Green
```

### 6F. Import cloud data to local (after schema import confirmed)
```powershell
# Run ONLY after schema import confirmed — Kevin approval required
$data_file = "C:\Kinetic_Core\Backups\Supabase\cloud\data\[FILENAME].sql"
$env:PGPASSWORD = "bNK0jMXQvygPNYisNyCaGheyVDVexpKk"
psql `
  --host=localhost `
  --port=5432 `
  --username=postgres `
  --dbname=postgres `
  --file=$data_file
Write-Host "✓ Data imported to local Supabase" -ForegroundColor Green
```

---

## 7. Safe First Implementation Plan

### Phase 1 — Infrastructure (no data changes) ✅ DONE
- [x] Local Supabase running in Docker
- [x] REST API confirmed 200 OK
- [x] Backup folder structure defined
- [ ] Create backup folders (6A above — safe, just mkdir)

### Phase 2 — Cloud Backup (read-only, no changes)
- [ ] Run REST API snapshot export (6D — safe, anon key only)
- [ ] Confirm snapshot file exists and has data
- [ ] Kevin reviews snapshot contents
- [ ] Run pg_dump schema export (6B — requires DB password from Supabase dashboard)

### Phase 3 — Dashboard Mode Selector (UI only, no data)
- [ ] Add CLOUD/LOCAL/HYBRID toggle to dashboard
- [ ] Add visible DB mode label to status strip
- [ ] Mode stored in localStorage, defaults to CLOUD
- [ ] No actual DB switching yet — label only first

### Phase 4 — Local Schema Mirror (after Phase 2 approved)
- [ ] Kevin approves schema import
- [ ] Run 6E (schema import to local)
- [ ] Add source/sync_status columns to local tables only
- [ ] Verify local REST API returns correct table structure

### Phase 5 — Hybrid Mode (after Phase 4 stable)
- [ ] Dashboard LOCAL mode reads from localhost:8000
- [ ] Local writes tagged source='local', sync_status='pending'
- [ ] Sync queue populated on local writes
- [ ] n8n sync workflow built (server-side, service key, never browser)
- [ ] Kevin reviews queue → approves → n8n promotes to cloud

---

## 8. What NOT to Build Yet

- ❌ Auto-sync local → cloud
- ❌ Real-time replication
- ❌ Bi-directional conflict resolution
- ❌ Any service key exposure in browser
- ❌ Any destructive cloud operations

---

## 9. Approval Gates

| Action | Gate |
|--------|------|
| Create backup folders | None — safe mkdir |
| REST API snapshot export | None — read-only |
| pg_dump cloud schema | Kevin approval + DB password |
| Import schema to local | Kevin approval + backup confirmed |
| Import data to local | Kevin approval + schema import confirmed |
| Local → Cloud sync | Kevin WhatsApp approval per item |
| Any cloud schema change | James Scott review for compliance impact |

