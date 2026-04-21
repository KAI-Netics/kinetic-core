# ============================================================
# KAI-NETICS ROLLBACK SCRIPT
# Run this IF v2 imports break your live system
# Usage: .\rollback.ps1
# Auto-selects most recent preflight backup
# ============================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupDir = ""
)

# Auto-find most recent backup if not specified
if (-not $BackupDir) {
    $latest = Get-ChildItem "C:\Kinetic_Core\Backups" -Directory |
              Where-Object { $_.Name -like "preflight_*" } |
              Sort-Object CreationTime -Descending |
              Select-Object -First 1
    if ($latest) {
        $BackupDir = $latest.FullName
        Write-Host "Auto-selected most recent backup: $BackupDir" -ForegroundColor Cyan
    } else {
        Write-Host "ERROR: No preflight backup found. Cannot rollback." -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path $BackupDir)) {
    Write-Host "ERROR: Backup directory not found: $BackupDir" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Red
Write-Host "  KAI-NETICS ROLLBACK — RESTORING BACKUP" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host "Source: $BackupDir" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "This will OVERWRITE your current n8n database. Type YES to proceed"
if ($confirm -ne "YES") {
    Write-Host "Rollback cancelled." -ForegroundColor Gray
    exit 0
}

# --- STEP 1: Stop n8n ---
Write-Host "`n[1/4] Stopping n8n container..." -ForegroundColor Yellow
docker stop kinetic-core-n8n
Start-Sleep -Seconds 3
Write-Host "  n8n stopped." -ForegroundColor Green

# --- STEP 2: Restore SQLite ---
Write-Host "`n[2/4] Restoring SQLite database..." -ForegroundColor Yellow
$sqliteFile = Get-ChildItem "$BackupDir\*.sqlite" | Select-Object -First 1
if ($sqliteFile) {
    docker cp "$($sqliteFile.FullName)" "kinetic-core-n8n:/home/node/.n8n/database.sqlite"
    Write-Host "  Restored: $($sqliteFile.Name)" -ForegroundColor Green
} else {
    Write-Host "  WARNING: No SQLite file found in backup." -ForegroundColor Red
}

# --- STEP 3: Start n8n ---
Write-Host "`n[3/4] Starting n8n container..." -ForegroundColor Yellow
docker start kinetic-core-n8n
Start-Sleep -Seconds 5
Write-Host "  n8n started." -ForegroundColor Green

# --- STEP 4: Verify ---
Write-Host "`n[4/4] Verifying n8n is responsive..." -ForegroundColor Yellow
$maxAttempts = 10
$attempt = 0
$ready = $false
while ($attempt -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) { $ready = $true }
    } catch { }
    $attempt++
    Write-Host "  Waiting... attempt $attempt/$maxAttempts" -ForegroundColor Gray
}

if ($ready) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  ROLLBACK COMPLETE — SYSTEM RESTORED" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "n8n is live at: http://localhost:5678" -ForegroundColor Cyan
} else {
    Write-Host "WARNING: n8n may not be ready. Check http://localhost:5678" -ForegroundColor Red
    Write-Host "If it doesn't load: docker restart kinetic-core-n8n" -ForegroundColor Yellow
}
Write-Host ""
