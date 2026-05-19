# ============================================
# KAI-Netics Claude Desktop Auto Start
# ============================================

Write-Host ""
Write-Host "Starting Claude Desktop recovery sequence..."
Write-Host ""

# Kill stale processes
taskkill /F /IM "claude.exe" /T 2>$null
taskkill /F /IM "electron.exe" /T 2>$null
taskkill /F /IM "node.exe" /T 2>$null

Start-Sleep -Seconds 2

# Clear Electron cache
Remove-Item "$env:APPDATA\Claude\Cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:APPDATA\Claude\Code Cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:APPDATA\Claude\GPUCache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Cache cleared."

# Locate newest Claude package dynamically
$claudePath = Get-ChildItem "C:\Program Files\WindowsApps" -Directory `
| Where-Object { $_.Name -like "Claude_*" } `
| Sort-Object LastWriteTime -Descending `
| Select-Object -First 1 `
| ForEach-Object { Join-Path $_.FullName "app\claude.exe" }

if (-not $claudePath) {
    Write-Host "Claude Desktop package not found."
    exit
}

Write-Host "Launching Claude:"
Write-Host $claudePath
Write-Host ""

# Launch Claude Desktop
Start-Process $claudePath

Write-Host "Claude Desktop launch command sent."
