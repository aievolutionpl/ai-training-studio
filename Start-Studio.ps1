Set-Location -LiteralPath $PSScriptRoot
Start-Process 'http://localhost:4317'
node server.mjs
