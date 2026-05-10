$N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjI3N2M4My1hNjI4LTQxZWMtYmE4MC0zZTJlMzVjNGI5OWUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZGYzYjBmZWQtNmU5OS00NGRjLWFjYjAtYTM2YmRlN2Q2NDc4IiwiaWF0IjoxNzc3NzI0ODg4fQ.QAkj7PCSH_fFBJ6HNYOdeILhTf2Q7v94QOCwztC-lbk"
$BASE = "http://localhost:5678/api/v1/workflows"
$DIR  = "C:\Kinetic_Core\workflows"

$headers = @{
    "X-N8N-API-KEY" = $N8N_API_KEY
    "Content-Type"  = "application/json"
}

# Only the 3 failing ones
$targets = @(
    @{ Name="Atlas - Technical Architect v2";  ID="uWar6a3rBK9yUZHt"; File="1_atlas_v2.json" },
    @{ Name="Jordan - Grant Writer v3";        ID="We59v45CMvrrmEAr"; File="3_jordan_v3.json" },
    @{ Name="Nova - RFP Intelligence Agent";   ID="SVzmB2AzqiyGtsJF"; File="9_nova_rfp.json" }
)

Write-Host "DIAGNOSING 3 FAILING WORKFLOWS"
Write-Host "================================"

foreach ($wf in $targets) {
    $path = Join-Path $DIR $wf.File
    $url  = "$BASE/$($wf.ID)"
    Write-Host ""
    Write-Host "--- $($wf.Name) ---"

    # Fetch live version from n8n
    try {
        $live    = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -UseBasicParsing
        $liveJson = $live.Content | ConvertFrom-Json
        Write-Host "Live n8n keys: $(($liveJson | Get-Member -MemberType NoteProperty).Name -join ', ')"
        Write-Host "Live node count: $($liveJson.nodes.Count)"
        Write-Host "Live active: $($liveJson.active)"
    } catch {
        Write-Host "GET failed: $($_.Exception.Message)"
    }

    # Check disk file
    $raw    = Get-Content $path -Raw -Encoding UTF8
    $parsed = $raw | ConvertFrom-Json
    Write-Host "Disk keys: $(($parsed | Get-Member -MemberType NoteProperty).Name -join ', ')"
    Write-Host "Disk node count: $($parsed.nodes.Count)"

    # Try PUT with just name+nodes+connections+settings
    Write-Host "Attempting PUT..." -NoNewline
    try {
        $payload = @{
            name        = $parsed.name
            nodes       = $parsed.nodes
            connections = $parsed.connections
            settings    = $parsed.settings
            staticData  = $null
        }
        $body = $payload | ConvertTo-Json -Depth 20 -Compress
        $resp = Invoke-WebRequest -Uri $url -Method PUT -Headers $headers -Body $body -UseBasicParsing
        Write-Host " HTTP $($resp.StatusCode)"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errMsg = $reader.ReadToEnd()
            Write-Host " HTTP $code - $errMsg"
        } catch {
            Write-Host " HTTP $code - (no body)"
        }
    }
}
