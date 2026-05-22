# Venoxa AI Platform - Local Run Script
# This script loads environment variables and starts both backend and frontend services.
# Run from the workspace root: .\run-venoxa.ps1

Write-Host "`n=== Venoxa AI Platform Local Launcher ===" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Load root .env file
$envFile = Join-Path $rootDir ".env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env..." -ForegroundColor Gray
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#") -and $line.Contains("=")) {
            $eqIndex = $line.IndexOf("=")
            $key = $line.Substring(0, $eqIndex).Trim()
            $value = $line.Substring($eqIndex + 1).Trim()
            $value = $value -replace '^[\"'']|[\"'']$', ''
            if ($key) {
                [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
                Set-Item -Path "Env:$key" -Value $value
            }
        }
    }
    Write-Host "  Environment loaded." -ForegroundColor DarkGray
} else {
    Write-Warning "No .env file found in root directory!"
}

# 2. Check for pnpm
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Error "pnpm is not installed or not in PATH. Install it with: npm install -g pnpm"
    exit 1
}

# 3. Build the API server first
Write-Host "`nBuilding API server..." -ForegroundColor Yellow
Push-Location (Join-Path $rootDir "artifacts\api-server")
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "API server build FAILED. Fix the build errors above and try again."
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "  Build successful." -ForegroundColor Green

# 4. Start API server (backend on port 3001)
Write-Host "`nStarting API server (backend on port 3001)..." -ForegroundColor Yellow
$backendScript = @"
`$env:PORT = '3001'
node --enable-source-maps '$($rootDir)\artifacts\api-server\dist\index.mjs'
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# 5. Start Vite dev server (frontend on port 3000)
Write-Host "Starting Vite dev server (frontend on port 3000)..." -ForegroundColor Yellow
$frontendScript = @"
`$env:PORT = '3000'
Set-Location '$($rootDir)\artifacts\venoxa'
pnpm run dev
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

# 6. Summary
Start-Sleep -Seconds 2
Write-Host "`n=== Launch Summary ===" -ForegroundColor Green
Write-Host "  Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "`n  Open http://localhost:3000 in your browser." -ForegroundColor Cyan
Write-Host "  Check the two new terminal windows for logs." -ForegroundColor Gray
Write-Host "============================`n" -ForegroundColor Green
