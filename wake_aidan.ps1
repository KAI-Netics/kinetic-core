Write-Host "Waking up KAI-Netics Foundry Engine..."

$webhooks = @(
    @{name="Aidan WhatsApp Bridge"; url="http://localhost:5678/webhook/whatsapp-inbound"; body='{"event":"startup","data":{"key":{"fromMe":true}}}'; timeout=5},
    @{name="Iris Compliance Monitor"; url="http://localhost:5678/webhook/iris-monitor"; body='{"trigger":"startup"}'; timeout=15},
    @{name="Atlas Technical Architect"; url="http://localhost:5678/webhook/atlas-architect"; body='{"command":"Atlas status","detail":"startup check"}'; timeout=30}
)

foreach ($webhook in $webhooks) {
    try {
        Invoke-RestMethod -Uri $webhook.url -Method POST -Headers @{"Content-Type"="application/json"} -Body $webhook.body -TimeoutSec $webhook.timeout | Out-Null
        Write-Host "$($webhook.name): OK"
    } catch {
        Write-Host "$($webhook.name): $($_.Exception.Message)"
    }
}

Write-Host "Foundry Engine is awake. Scout fires 7AM, Jordan fires 8AM Eastern."
