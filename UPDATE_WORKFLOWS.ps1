$N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjI3N2M4My1hNjI4LTQxZWMtYmE4MC0zZTJlMzVjNGI5OWUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZGYzYjBmZWQtNmU5OS00NGRjLWFjYjAtYTM2YmRlN2Q2NDc4IiwiaWF0IjoxNzc3NzI0ODg4fQ.QAkj7PCSH_fFBJ6HNYOdeILhTf2Q7v94QOCwztC-lbk"
$BASE = "http://localhost:5678/api/v1/workflows"
$DIR  = "C:\Kinetic_Core\workflows"

$headers = @{
    "X-N8N-API-KEY" = $N8N_API_KEY
    "Content-Type"  = "application/json"
}

$targets = @(
    @{ Name="Atlas - Technical Architect v2";  ID="uWar6a3rBK9yUZHt"; File="1_atlas_v2.json" },
    @{ Name="Scout - BD Research v5";          ID="E42nCnCDMNyqXBUa"; File="2_scout_v5.json" },
    @{ Name="Jordan - Grant Writer v3";        ID="We59v45CMvrrmEAr"; File="3_jordan_v3.json" },
    @{ Name="Aidan - Callback Consolidator";   ID="fWCfTlmkQNtTINFB"; File="5b_callback_consolidator.json" },
    @{ Name="Nova - RFP Intelligence Agent";   ID="SVzmB2AzqiyGtsJF"; File="9_nova_rfp.json" },
    @{ Name="Nova - Proactive Intelligence";   ID="1nk5lrbsv0tgUSi4"; File="13_nova_proactive.json" },
    @{ Name="Jordan - Grant Reader v1";        ID="JdRaAgDawGyNHQty"; File="16_jordan_grant_reader_v1.json" }
)

Write-Host "KAI-NETICS WORKFLOW UPDATER"
Write-Host "============================"

# First - fetch one workflow to see exact schema n8n expects
Write-Host "Fetching schema from n8n..."
try {
    $sample = Invoke-WebRequest -Uri "$BASE/$($targets[0].ID)" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "GET response (first 500 chars):"
    Write-Host $sample.Content.Substring(0, [Math]::Min(500, $sample.Content.Length))
    Write-Host "---"
} catch {
    Write-Host "GET failed: $($_.Exception.Message)"
}

$ok  = 0
$bad = 0

foreach ($wf in $targets) {
    $path = Join-Path $DIR $wf.File
    $url  = "$BASE/$($wf.ID)"
    Write-Host "Pushing: $($wf.Name)" -NoNewline

    if (-not (Test-Path $path)) {
        Write-Host " SKIP - file not found"
        $bad++
        continue
    }

    try {
        # Read and parse the workflow JSON
        $raw    = Get-Content $path -Raw -Encoding UTF8
        $parsed = $raw | ConvertFrom-Json

        # Inject the n8n ID into the workflow object
        $parsed | Add-Member -NotePropertyName "id" -NotePropertyValue $wf.ID -Force

        # n8n PUT /workflows/:id expects: { name, nodes, connections, settings, staticData }
        # Build minimal valid payload
        $payload = @{
            name        = $parsed.name
            nodes       = $parsed.nodes
            connections = $parsed.connections
            settings    = $parsed.settings
            staticData  = $null
        }

        $body = $payload | ConvertTo-Json -Depth 20 -Compress
        $resp = Invoke-WebRequest -Uri $url -Method PUT -Headers $headers -Body $body -UseBasicParsing

        if ($resp.StatusCode -eq 200) {
            $json = $resp.Content | ConvertFrom-Json
            Write-Host " OK - $($json.name)"
            $ok++
        } else {
            Write-Host " WARN - HTTP $($resp.StatusCode)"
            $bad++
        }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        # Get error body for diagnosis
        try {
            $errStream = $_.Exception.Response.GetResponseStream()
            $reader    = New-Object System.IO.StreamReader($errStream)
            $errBody   = $reader.ReadToEnd()
            Write-Host " FAIL - HTTP $code - $($errBody.Substring(0,[Math]::Min(200,$errBody.Length)))"
        } catch {
            Write-Host " FAIL - HTTP $code"
        }
        $bad++
    }

    Start-Sleep -Milliseconds 300
}

Write-Host "============================"
Write-Host "DONE: $ok OK, $bad issues"
