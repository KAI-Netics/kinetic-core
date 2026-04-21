# ============================================================
# KAI-NETICS PRE-FLIGHT BACKUP
# Run this BEFORE importing any v2 workflows
# Created: 2026-04-09
# ============================================================

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "C:\Kinetic_Core\Backups\preflight_$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Write-Host "Backup target: $backupDir" -ForegroundColor Cyan

# --- STEP 1: SQLite database backup ---
Write-Host "`n[1/4] Backing up n8n SQLite database..." -ForegroundColor Yellow
docker exec kinetic-core-n8n node -e "
const fs = require('fs');
fs.copyFileSync('/home/node/.n8n/database.sqlite', '/data/database_backup.sqlite');
console.log('SQLite backup done');
"
Copy-Item "C:\Kinetic_Core\database_backup.sqlite" "$backupDir\database_backup_$timestamp.sqlite"
Write-Host "  SQLite backed up." -ForegroundColor Green

# --- STEP 2: Export all workflows as JSON ---
Write-Host "`n[2/4] Copying existing JSON backups from Kinetic_Core root..." -ForegroundColor Yellow
$jsonBackups = Get-ChildItem "C:\Kinetic_Core\*.json" -ErrorAction SilentlyContinue
foreach ($f in $jsonBackups) {
    Copy-Item $f.FullName "$backupDir\$($f.Name)"
    Write-Host "  Copied: $($f.Name)" -ForegroundColor Gray
}

# Copy workflows folder
if (Test-Path "C:\Kinetic_Core\workflows") {
    Copy-Item "C:\Kinetic_Core\workflows\*" "$backupDir\" -Recurse -ErrorAction SilentlyContinue
    Write-Host "  Copied workflows folder." -ForegroundColor Gray
}

# Copy KAI_Context.json explicitly
Copy-Item "C:\Kinetic_Core\KAI_Context.json" "$backupDir\KAI_Context_$timestamp.json"
Write-Host "  Copied KAI_Context.json" -ForegroundColor Gray

# --- STEP 3: Write rollback manifest ---
Write-Host "`n[3/4] Writing rollback manifest..." -ForegroundColor Yellow
$manifest = @"
KAI-NETICS ROLLBACK MANIFEST
Backup created: $timestamp
============================================================

TO RESTORE (if v2 import goes wrong):

1. STOP n8n:
   docker stop kinetic-core-n8n

2. RESTORE SQLite:
   docker cp "$backupDir\database_backup_$timestamp.sqlite" kinetic-core-n8n:/home/node/.n8n/database.sqlite

3. START n8n:
   docker start kinetic-core-n8n

4. VERIFY workflows are back at http://localhost:5678

ALTERNATIVE (import individual workflows):
   In n8n UI: Settings > Import Workflow > select file from:
   $backupDir

FILES IN THIS BACKUP:
"@

$files = Get-ChildItem $backupDir
foreach ($f in $files) {
    $manifest += "`n  $($f.Name)"
}

$manifest | Out-File "$backupDir\ROLLBACK_README.txt" -Encoding UTF8
Write-Host "  Manifest written." -ForegroundColor Green

# --- DONE ---
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "PRE-FLIGHT BACKUP COMPLETE" -ForegroundColor Green
Write-Host "Location: $backupDir" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You are now safe to import v2 workflows." -ForegroundColor White
Write-Host "If anything breaks, run rollback.ps1 from this folder." -ForegroundColor Yellow
Write-Host ""
