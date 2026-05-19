# ============================================
# KAI-Netics Core Auto Start
# Starts Claude, ChatGPT, Docker/Supabase, n8n, API server, Dashboard
# ============================================

Write-Host ""
Write-Host "Starting KAI-Netics Core..."
Write-Host ""

Set-Location "C:\Kinetic_Core"

function Test-Port {
    param([int]$Port)
    $result = netstat -ano | findstr ":$Port "
    return -not [string]::IsNullOrWhiteSpace($result)
}

# -------------------------------------------------
# CLAUDE DESKTOP
# -------------------------------------------------

Write-Host "[0A/6] Starting Claude Desktop..."

if (Test-Path "C:\Kinetic_Core\start-claude.ps1") {
    powershell -ExecutionPolicy Bypass -File "C:\Kinetic_Core\start-claude.ps1"
} else {
    Write-Host "start-claude.ps1 not found."
}

Start-Sleep -Seconds 5

# -------------------------------------------------
# CHATGPT DESKTOP
# -------------------------------------------------

Write-Host ""
Write-Host "[0B/6] Starting ChatGPT Desktop..."

$chatgptPath = Get-ChildItem "C:\Program Files\WindowsApps" -Directory -ErrorAction SilentlyContinue `
| Where-Object { $_.Name -like "OpenAI.ChatGPT*" } `
| Sort-Object LastWriteTime -Descending `
| Select-Object -First 1 `
| ForEach-Object { Join-Path $_.FullName "app\ChatGPT.exe" }

if ($chatgptPath -and (Test-Path $chatgptPath)) {
    Start-Process $chatgptPath
    Write-Host "ChatGPT Desktop launch command sent."
} else {
    Write-Host "ChatGPT Desktop package not found."
}

# -------------------------------------------------
# DOCKER DESKTOP
# -------------------------------------------------

Write-Host ""
Write-Host "[1/6] Starting Docker Desktop..."

Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue

Start-Sleep -Seconds 20

# -------------------------------------------------
# SUPABASE STACK
# -------------------------------------------------

Write-Host ""
Write-Host "[2/6] Starting Supabase stack..."

if (Test-Path "C:\Kinetic_Core\supabase\docker-compose.yml") {
    docker compose -f "C:\Kinetic_Core\supabase\docker-compose.yml" up -d
} else {
    Write-Host "Supabase compose file not found."
}

# -------------------------------------------------
# LOCAL API SERVER
# -------------------------------------------------

Write-Host ""
Write-Host "[3/6] Starting local web/API server..."

if (Test-Port 3030) {
    Write-Host "Local API server already appears to be running on port 3030."
} elseif (Test-Path "C:\Kinetic_Core\server.js") {
    Start-Process powershell -ArgumentList '-NoExit','-Command','cd C:\Kinetic_Core; node server.js'
} else {
    Write-Host "server.js not found."
}

# -------------------------------------------------
# N8N
# -------------------------------------------------

Write-Host ""
Write-Host "[4/6] Starting n8n..."

if (Test-Port 5678) {
    Write-Host "n8n already appears to be running on port 5678."
} else {
    Start-Process powershell -ArgumentList '-NoExit','-Command','n8n start'
    Start-Sleep -Seconds 5
}

# -------------------------------------------------
# DASHBOARD
# -------------------------------------------------

Write-Host ""
Write-Host "[5/6] Starting KAI-Core dashboard..."

if ((Test-Port 5173) -or (Test-Port 5174)) {
    Write-Host "Dashboard already appears to be running on port 5173 or 5174."
} elseif (Test-Path "C:\Kinetic_Core\kai-core-ui\package.json") {
    Start-Process powershell -ArgumentList '-NoExit','-Command','cd C:\Kinetic_Core\kai-core-ui; npm run dev -- --host 0.0.0.0'
} else {
    Write-Host "Dashboard package.json not found at C:\Kinetic_Core\kai-core-ui."
}

# -------------------------------------------------
# STATUS
# -------------------------------------------------

Write-Host ""
Write-Host "[6/6] Startup check:"
Write-Host ""

Write-Host "Expected URLs:"
Write-Host "Claude Desktop: launched if installed"
Write-Host "ChatGPT Desktop: launched if installed"
Write-Host "Evolution API:   http://localhost:8081"
Write-Host "n8n:             http://localhost:5678"
Write-Host "Supabase API:    http://localhost:8000"
Write-Host "Local server:    http://localhost:3030"
Write-Host "Dashboard:       http://localhost:5173 or http://localhost:5174"
Write-Host ""
Write-Host "KAI-Netics Core startup sequence complete."
Write-Host ""
