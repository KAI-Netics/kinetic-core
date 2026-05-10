$N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjI3N2M4My1hNjI4LTQxZWMtYmE4MC0zZTJlMzVjNGI5OWUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZGYzYjBmZWQtNmU5OS00NGRjLWFjYjAtYTM2YmRlN2Q2NDc4IiwiaWF0IjoxNzc3NzI0ODg4fQ.QAkj7PCSH_fFBJ6HNYOdeILhTf2Q7v94QOCwztC-lbk"
$BASE = "http://localhost:5678/api/v1/workflows"
$DIR  = "C:\Kinetic_Core\workflows"

$headers = @{
    "X-N8N-API-KEY" = $N8N_API_KEY
    "Content-Type"  = "application/json"
}

$targets = @(
    @{ Name="Atlas - Technical Architect v2";  ID="uWar6a3rBK9yUZHt"; File="1_atlas_v2.json" },
    @{ Name="Jordan - Grant Writer v3";        ID="We59v45CMvrrmEAr"; File="3_jordan_v3.json" },
    @{ Name="Nova - RFP Intelligence Agent";   ID="SVzmB2AzqiyGtsJF"; File="9_nova_rfp.json" }
)

Write-Host "FIXING 3 REMAINING WORKFLOWS"
Write-Host "=============================="

$ok  = 0
$bad = 0

foreach ($wf in $targets) {
    $path = Join-Path $DIR $wf.File
    $url  = "$BASE/$($wf.ID)"
    Write-Host "Pushing: $($wf.Name)" -NoNewline

    $raw    = Get-Content $path -Raw -Encoding UTF8
    $parsed = $raw | ConvertFrom-Json

    # Strip tags to name-only — n8n rejects tag objects with id/createdAt/updatedAt
    $cleanTags = @()
    foreach ($tag in $parsed.tags) {
        $cleanTags += @{ name = $tag.name }
    }

    $payload = @{
        name        = $parsed.name
        nodes       = $parsed.nodes
        connections = $parsed.connections
        settings    = $parsed.settings
        staticData  = $null
        tags        = $cleanTags
    }

    try {
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
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errMsg = $reader.ReadToEnd()
            Write-Host " FAIL - HTTP $code - $errMsg"
        } catch {
            Write-Host " FAIL - HTTP $code"
        }
        $bad++
    }

    Start-Sleep -Milliseconds 300
}

Write-Host "=============================="
Write-Host "DONE: $ok OK, $bad issues"
