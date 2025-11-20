# PowerShell script to restart the server
Write-Host "Stopping any running Node processes on port 5173..." -ForegroundColor Yellow

# Find and kill processes using port 5173
$processes = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($pid in $processes) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped process $pid" -ForegroundColor Green
    }
}

Start-Sleep -Seconds 2

Write-Host "Starting server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev" -WindowStyle Normal

Write-Host "Server restart initiated. Check the new window for server logs." -ForegroundColor Green


