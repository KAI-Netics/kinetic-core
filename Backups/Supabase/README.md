# KAI-Netics Supabase Backup Structure
Created: May 8, 2026

## Folders
- cloud/schema/    — DDL-only exports from cloud Supabase (pg_dump --schema-only)
- cloud/data/      — Full data dumps from cloud Supabase (pg_dump --data-only)
- cloud/snapshots/ — JSON snapshots via REST API (anon key, no service key)
- local/schema/    — DDL exports from local Supabase
- local/data/      — Data dumps from local Supabase
- sync_queue/      — Exported kai_sync_queue JSON files from dashboard

## Rules
- Cloud is ALWAYS the system of record
- Local is DEV/MIRROR only
- Never auto-promote local → cloud
- All imports require Kevin approval
- See KAI_Supabase_Sync_Architecture.md for full procedures
