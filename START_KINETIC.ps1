Write-Host "============================================"
Write-Host " KAI-NETICS CORE ENGINE STARTUP"
Write-Host " KAI-Netics | Kevin Alexander Smith"
Write-Host " Version: 2.0 | May 2026"
Write-Host "============================================"

# Step 1 - Docker containers
Write-Host "`n[1/4] Starting Docker containers..."

# n8n -- if start fails, container may not exist, recreate it
docker start kinetic-core-n8n 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  n8n: Container not found -- recreating with full config..."
    & "C:\Kinetic_Core\start_n8n.ps1"
    Start-Sleep -Seconds 5
    docker start kinetic-core-n8n 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  n8n: RECREATED OK (port 5678)"
    } else {
        Write-Host "  n8n: FAILED -- check start_n8n.ps1 and docker logs kinetic-core-n8n"
    }
} else {
    Write-Host "  n8n: OK (port 5678)"
}

docker start kinetic-core-whatsapp 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "  EvolutionAPI: OK (port 8081)" } else { Write-Host "  EvolutionAPI: Already running or failed -- check docker ps" }

Start-Sleep -Seconds 5

# Step 2 - pm2 processes
Write-Host "`n[2/4] Starting pm2 processes..."
Set-Location C:\Kinetic_Core
pm2 restart kai-dashboard 2>$null
pm2 restart supabase-mcp 2>$null
Write-Host "  Dashboard: restarted (port 3030)"
Write-Host "  Supabase MCP: restarted"

Start-Sleep -Seconds 3

# Step 3 - Health checks
Write-Host "`n[3/4] Running health checks..."

try {
    $n8n = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -UseBasicParsing -TimeoutSec 5
    Write-Host "  n8n: HEALTHY (status $($n8n.StatusCode))"
} catch {
    Write-Host "  n8n: NOT RESPONDING -- check docker logs kinetic-core-n8n"
}

try {
    $evo = Invoke-WebRequest -Uri "http://localhost:8081/instance/fetchInstances" -Headers @{"apikey"="Kevin2026"} -UseBasicParsing -TimeoutSec 5
    $evoJson = $evo.Content | ConvertFrom-Json
    $status = $evoJson[0].instance.status
    Write-Host "  EvolutionAPI: $status (Aidan instance)"
} catch {
    Write-Host "  EvolutionAPI: NOT RESPONDING -- may need QR rescan"
}

# Step 4 - Wake agents
Write-Host "`n[4/4] Waking agents..."
$webhooks = @(
    @{name="Aidan Router";   url="http://localhost:5678/webhook/whatsapp-inbound"; body='{"event":"startup","data":{"key":{"fromMe":true}}}'; timeout=5},
    @{name="Iris Monitor";   url="http://localhost:5678/webhook/iris-monitor";     body='{"trigger":"startup"}'; timeout=15},
    @{name="Atlas Architect";url="http://localhost:5678/webhook/atlas-architect";  body='{"command":"architecture status","userPrompt":"Startup architecture check. Confirm platform is live and report any drift or issues.","outputFolder":"Aidan_Outputs/Atlas","outputPrefix":"Atlas_Startup","timestamp":"' + (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ") + '"}'; timeout=30}
)
foreach ($webhook in $webhooks) {
    try {
        Invoke-RestMethod -Uri $webhook.url -Method POST -Headers @{"Content-Type"="application/json"} -Body $webhook.body -TimeoutSec $webhook.timeout | Out-Null
        Write-Host "  $($webhook.name): OK"
    } catch {
        Write-Host "  $($webhook.name): $($_.Exception.Message)"
    }
}

Write-Host "`n============================================"
Write-Host " KAI-NETICS CORE ENGINE IS LIVE"
Write-Host " n8n:          http://localhost:5678"
Write-Host " Dashboard:    http://localhost:3030"
Write-Host " EvolutionAPI: http://localhost:8081"
Write-Host " Atlas:        ACTIVE -- architecture monitor running"
Write-Host "============================================`n"
