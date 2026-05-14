# Venoxa AI Platform - Local Run Script
# This script loads environment variables and starts both backend and frontend services.

Write-Host "--- Venoxa AI Platform Local Launcher ---" -ForegroundColor Cyan

# 1. Load root .env file
if (Test-Path ".env") {
    Write-Host "Loading environment variables from .env..." -ForegroundColor Gray
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#") -and $line.Contains("=")) {
            $key, $value = $line.Split("=", 2)
            $key = $key.Trim()
            $value = $value.Trim()
            # Remove quotes if present
            $value = $value -replace '^["'']|["'']$' , ''
            if ($key) {
                [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
} else {
    Write-Warning "No .env file found in root directory!"
}

# 2. Set defaults if missing
if (![System.Environment]::GetEnvironmentVariable("BASE_PATH", "Process")) {
    [System.Environment]::SetEnvironmentVariable("BASE_PATH", "/", "Process")
}

# 3. Check for pnpm
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Error "pnpm is not installed or not in PATH. Please install it: npm install -g pnpm"
    exit 1
}

# 4. Start Services
# We use separate windows for logs visibility.
Write-Host "Starting API Server (Backend)..." -ForegroundColor Yellow
# Override PORT to 3001 for backend to match Vite proxy
$env:PORT = "3001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm -C artifacts/api-server dev" -NoNewWindow:$false

Write-Host "Starting Venoxa (Frontend)..." -ForegroundColor Yellow
# Set a different PORT for frontend (e.g. 5173) to avoid conflict
$env:PORT = "5173"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm -C artifacts/venoxa dev" -NoNewWindow:$false

Write-Host "`n--- Launch Summary ---" -ForegroundColor Green
Write-Host "Backend: http://localhost:3001"
Write-Host "Frontend: http://localhost:5173"
Write-Host "Check the newly opened terminal windows for logs."
Write-Host "-----------------------"
