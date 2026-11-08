# Venoxa API Server launcher
# Run this script in a separate terminal window to start the API server on port 3001

Set-Location "$PSScriptRoot\artifacts\api-server"
Write-Host "Starting Venoxa API server on port 3001..." -ForegroundColor Cyan
node --enable-source-maps ./dist/index.mjs
