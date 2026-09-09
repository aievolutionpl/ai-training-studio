param([Parameter(Mandatory=$true)][string]$InputFile,[Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference='Stop'
$resolvedInput=(Resolve-Path -LiteralPath $InputFile).Path
$resolvedOutput=[IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null
$app=New-Object -ComObject PowerPoint.Application
$presentation=$null
try {
 $presentation=$app.Presentations.Open($resolvedInput,$true,$false,$false)
 $presentation.Export($resolvedOutput,'PNG',1600,900)
 $presentation.SaveAs((Join-Path $resolvedOutput 'presentation.pdf'),32)
} finally {
 if($presentation){$presentation.Close();[Runtime.InteropServices.Marshal]::ReleaseComObject($presentation)|Out-Null}
 [Runtime.InteropServices.Marshal]::ReleaseComObject($app)|Out-Null
}
Get-ChildItem -LiteralPath $resolvedOutput | Select-Object Name,Length
