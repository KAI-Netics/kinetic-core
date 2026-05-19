# KAI-Netics Core Server Startup
# Starts Evolution API, local web/API server, and Claude MCP support

Write-Host "Starting KAI-Netics Core servers..." -ForegroundColor Cyan

# 1. Start Evolution API / Docker stack
Write-Host "`n[1/3] Starting Evolution / Docker services..." -ForegroundColor Yellow
Set-Location "C:\Kinetic_Core"

docker compose up -d

Start-Sleep -Seconds 5

# 2. Start local web/API server on :3030
Write-Host "`n[2/3] Starting local web/API server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd C:\Kinetic_Core; node server.js"
)

Start-Sleep -Seconds 3

# 3. Start KAI Core Dashboard / Vite web app
Write-Host "`n[3/3] Starting KAI-Core dashboard..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd C:\Kinetic_Core\kai-core; npm run dev"
)

Write-Host "`nClaude MCP:" -ForegroundColor Cyan
Write-Host "Open or restart Claude Desktop after these services are running."
Write-Host "If MCP still times out, fully quit Claude from the system tray and reopen it."

Write-Host "`nExpected URLs:" -ForegroundColor Green
Write-Host "Evolution API: http://localhost:8081"
Write-Host "n8n:           http://localhost:5678"
Write-Host "Supabase API:  http://localhost:8000"
Write-Host "Local server:  http://localhost:3030"
Write-Host "Dashboard:     http://localhost:5173 or http://localhost:5174"

Write-Host "`nStartup command complete." -ForegroundColor Green