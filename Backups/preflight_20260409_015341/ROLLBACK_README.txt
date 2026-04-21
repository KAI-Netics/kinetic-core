KAI-NETICS ROLLBACK MANIFEST
Backup created: 20260409_015341
============================================================

FILES IN THIS BACKUP:
  database_backup.sqlite       — n8n full database (9.88MB) ✅
  KAI_Context.json             — shared agent context file ✅
  n8n_backup_atlas_live.json   — Atlas workflow JSON ✅
  logic_c.json                 — Logic C / WhatsApp Bridge JSON ✅
  ROLLBACK_README.txt          — this file

============================================================
TO RESTORE (if v2 import goes wrong):
============================================================

OPTION A — Full database restore (fastest, restores everything):

  1. Stop n8n:
     docker stop kinetic-core-n8n

  2. Restore SQLite:
     docker cp "C:\Kinetic_Core\Backups\preflight_20260409_015341\database_backup.sqlite" kinetic-core-n8n:/home/node/.n8n/database.sqlite

  3. Start n8n:
     docker start kinetic-core-n8n

  4. Verify at: http://localhost:5678

OPTION B — Re-import individual workflows (surgical fix):

  In n8n UI: Settings > Import Workflow
  Select the JSON file for the broken workflow from this folder.
  Available: n8n_backup_atlas_live.json, logic_c.json

OPTION C — Run the rollback script (automated):

  cd C:\Kinetic_Core\Backups
  .\rollback.ps1

  It will auto-find this backup and walk you through the restore.

============================================================
STATUS: BACKUP COMPLETE — SAFE TO IMPORT V2 WORKFLOWS
============================================================
