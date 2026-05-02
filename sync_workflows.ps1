# ============================================================
# KAI-Netics Workflow Sync Script
# Reads workflow JSON from disk and pushes to n8n via API
# Usage: .\sync_workflows.ps1 [-workflow "scout"] [-all]
# ============================================================

param(
    [string]$workflow = "",
    [switch]$all = $false,
    [switch]$export = $false
)

$N8N_URL = "http://localhost:5678"
$API_KEY = $env:N8N_API_KEY
if (-not $API_KEY) {
    # Fall back to hardcoded key if env var not set
    $API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjI3N2M4My1hNjI4LTQxZWMtYmE4MC0zZTJlMzVjNGI5OWUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZGYzYjBmZWQtNmU5OS00NGRjLWFjYjAtYTM2YmRlN2Q2NDc4IiwiaWF0IjoxNzc3NzI0ODg4fQ.QAkj7PCSH_fFBJ6HNYOdeILhTf2Q7v94QOCwztC-lbk"
}
$WORKFLOWS_DIR = "C:\Kinetic_Core\workflows"
$EXPORT_DIR = "C:\Kinetic_Core\workflows\export"
$headers = @{ "X-N8N-API-KEY" = $API_KEY; "Authorization" = "Bearer $API_KEY"; "Content-Type" = "application/json" }

# ── EXPORT MODE: pull all workflows from n8n to disk ─────────────────────────
if ($export) {
    Write-Host "EXPORT MODE -- pulling all workflows from n8n to disk..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $EXPORT_DIR | Out-Null
    $response = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows?limit=50" -Headers $headers
    $count = 0
    foreach ($wf in $response.data) {
        # Fetch full workflow detail including nodes
        $detail = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows/$($wf.id)" -Headers $headers
        $safeName = $wf.name -replace '[^a-zA-Z0-9_-]', '_'
        $path = "$EXPORT_DIR\$safeName.json"
        $detail | ConvertTo-Json -Depth 20 | Out-File -FilePath $path -Encoding UTF8
        Write-Host "  Exported: $($wf.name) (ID: $($wf.id)) -> $path" -ForegroundColor Green
        $count++
    }
    Write-Host "`nExported $count workflows to $EXPORT_DIR" -ForegroundColor Cyan
    exit 0
}

# ── SYNC MODE: push workflow JSON from disk to n8n ────────────────────────────

# Get all workflows currently in n8n (for ID lookup)
Write-Host "Fetching workflow list from n8n..." -ForegroundColor Cyan
$existing = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" -Headers $headers
$existingMap = @{}
foreach ($wf in $existing.data) {
    $existingMap[$wf.name] = $wf.id
}
Write-Host "Found $($existing.data.Count) workflows in n8n" -ForegroundColor Gray

# Determine which files to sync
$filesToSync = @()
if ($all) {
    $filesToSync = Get-ChildItem -Path $WORKFLOWS_DIR -Filter "*.json" | Where-Object { $_.Name -notlike "*.bak*" }
} elseif ($workflow) {
    $filesToSync = Get-ChildItem -Path $WORKFLOWS_DIR -Filter "*.json" | Where-Object { $_.Name -like "*$workflow*" }
} else {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  Export all from n8n to disk:  .\sync_workflows.ps1 -export"
    Write-Host "  Sync one workflow to n8n:     .\sync_workflows.ps1 -workflow scout"
    Write-Host "  Sync all workflows to n8n:    .\sync_workflows.ps1 -all"
    exit 0
}

if ($filesToSync.Count -eq 0) {
    Write-Host "No matching workflow files found in $WORKFLOWS_DIR" -ForegroundColor Red
    exit 1
}

# Sync each file
$synced = 0
$failed = 0
foreach ($file in $filesToSync) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $wfData = $content | ConvertFrom-Json
        $wfName = $wfData.name

        if (-not $wfName) {
            Write-Host "  SKIP: $($file.Name) -- no name field found" -ForegroundColor Yellow
            continue
        }

        if ($existingMap.ContainsKey($wfName)) {
            # UPDATE existing workflow
            $wfId = $existingMap[$wfName]
            $result = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows/$wfId" -Method PUT -Headers $headers -Body $content
            Write-Host "  UPDATED: $wfName (ID: $wfId)" -ForegroundColor Green
        } else {
            # CREATE new workflow
            $result = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" -Method POST -Headers $headers -Body $content
            Write-Host "  CREATED: $wfName (ID: $($result.id))" -ForegroundColor Cyan
        }
        $synced++
    } catch {
        Write-Host "  FAILED: $($file.Name) -- $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`nSync complete: $synced succeeded, $failed failed" -ForegroundColor Cyan

# Auto-commit to git if any syncs succeeded
if ($synced -gt 0) {
    Write-Host "`nCommitting to git..." -ForegroundColor Cyan
    Set-Location C:\Kinetic_Core
    git add workflows/
    git commit -m "Workflow sync $(Get-Date -Format 'yyyy-MM-dd HH:mm') -- $synced workflows updated"
    git push origin main
    Write-Host "Git push complete" -ForegroundColor Green
}
