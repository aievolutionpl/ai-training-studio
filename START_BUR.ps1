$ErrorActionPreference='Stop'
New-Item -ItemType Directory -Force (Join-Path $PSScriptRoot 'projects') | Out-Null
$studioAddress='http://localhost:4317/bur.html'
$studioRunning=$false
try { $studioCheck=Invoke-RestMethod 'http://localhost:4317/api/bur-modules' -TimeoutSec 2; $studioRunning=$true } catch {}
if(-not $studioRunning){
 if(Get-NetTCPConnection -LocalPort 4317 -State Listen -ErrorAction SilentlyContinue){throw 'Port 4317 jest zajęty przez inny serwer.'}
 $studioNode=(Get-Command node -ErrorAction Stop).Source
 Start-Process -FilePath $studioNode -ArgumentList 'server.mjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'projects/server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'projects/server-error.log')
 for($studioAttempt=0;$studioAttempt -lt 30;$studioAttempt++){
  Start-Sleep -Milliseconds 300
  try { $studioCheck=Invoke-RestMethod 'http://localhost:4317/api/bur-modules' -TimeoutSec 2; $studioRunning=$true;break } catch {}
 }
 if(-not $studioRunning){throw 'Studio nie wystartowało. Sprawdź build/server-error.log.'}
}
Start-Process $studioAddress
