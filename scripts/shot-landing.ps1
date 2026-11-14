# scripts/shot-landing.ps1 — capture landing-page screenshots with headless Chrome.
# Uses public/landing-test.html (same-origin iframe at true logical width).
# Usage: powershell -File scripts\shot-landing.ps1
$ErrorActionPreference = 'Continue'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$root = $PSScriptRoot | Split-Path
$outDir = Join-Path $root 'docs\landing-screenshots'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$profileDir = Join-Path $env:TEMP 'venoxa-headless-profile'
if (Test-Path $profileDir) { Remove-Item $profileDir -Recurse -Force -ErrorAction SilentlyContinue }

$variants = @(
  @{ w = 1440; theme = 'light'; lang = 'en' },
  @{ w = 1440; theme = 'light'; lang = 'ar' },
  @{ w = 1440; theme = 'dark';  lang = 'en' },
  @{ w = 1440; theme = 'dark';  lang = 'ar' },
  @{ w = 1024; theme = 'light'; lang = 'en' },
  @{ w = 1024; theme = 'light'; lang = 'ar' },
  @{ w = 1024; theme = 'dark';  lang = 'en' },
  @{ w = 1024; theme = 'dark';  lang = 'ar' },
  @{ w = 768;  theme = 'light'; lang = 'en' },
  @{ w = 768;  theme = 'light'; lang = 'ar' },
  @{ w = 768;  theme = 'dark';  lang = 'en' },
  @{ w = 768;  theme = 'dark';  lang = 'ar' },
  @{ w = 390;  theme = 'light'; lang = 'en' },
  @{ w = 390;  theme = 'light'; lang = 'ar' },
  @{ w = 390;  theme = 'dark';  lang = 'en' },
  @{ w = 390;  theme = 'dark';  lang = 'ar' }
)

function Get-PageHeight([string]$url) {
  $tmp = Join-Path $env:TEMP "dom-$([guid]::NewGuid().ToString('N').Substring(0,8)).html"
  & $chrome --headless=new --disable-gpu --user-data-dir="$profileDir" --no-first-run `
    --virtual-time-budget=20000 --dump-dom $url 2>$null | Out-File $tmp -Encoding utf8
  $title = (Select-String -Path $tmp -Pattern '<title>([^<]*)</title>').Matches.Groups[1].Value
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  if ($title -match 'H=(\d+)') { return [int]$Matches[1] }
  return 0
}

foreach ($v in $variants) {
  $name = "landing-$($v.w)-$($v.theme)-$($v.lang).png"
  $url = "http://127.0.0.1:3000/landing-test.html?w=$($v.w)&theme=$($v.theme)&lang=$($v.lang)"
  $h = Get-PageHeight $url
  if ($h -lt 1200) { Write-Output "SKIP $name (height probe failed: $h)"; continue }
  $winH = $h + 60
  & $chrome --headless=new --disable-gpu --user-data-dir="$profileDir" --no-first-run `
    --hide-scrollbars --force-device-scale-factor=1 --window-size="$($v.w),$winH" `
    --virtual-time-budget=20000 --screenshot="$outDir\$name" $url 2>$null | Out-Null
  if (Test-Path "$outDir\$name") {
    $kb = [math]::Round((Get-Item "$outDir\$name").Length / 1KB)
    Write-Output "OK $name (${h}px tall, $kb KB)"
  } else {
    Write-Output "FAIL $name"
  }
}

# interaction proof shots: register + login modals open (1440 light en)
foreach ($m in @('register', 'login')) {
  $name = "landing-1440-modal-$m.png"
  $url = "http://127.0.0.1:3000/landing-test.html?w=1440&theme=light&lang=en&modal=$m"
  $h = Get-PageHeight $url
  if ($h -lt 1200) { Write-Output "SKIP $name (height probe failed: $h)"; continue }
  $winH = $h + 60
  & $chrome --headless=new --disable-gpu --user-data-dir="$profileDir" --no-first-run `
    --hide-scrollbars --force-device-scale-factor=1 --window-size="1440,$winH" `
    --virtual-time-budget=20000 --screenshot="$outDir\$name" $url 2>$null | Out-Null
  if (Test-Path "$outDir\$name") {
    $kb = [math]::Round((Get-Item "$outDir\$name").Length / 1KB)
    Write-Output "OK $name (${h}px tall, $kb KB)"
  } else {
    Write-Output "FAIL $name"
  }
}
Write-Output 'DONE'
