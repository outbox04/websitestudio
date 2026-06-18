Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$installDir = Join-Path $env:LOCALAPPDATA "TLORA\RawSelector"
$desktopDir = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopDir "TLORA RAW Selector.lnk"

if (-not (Test-Path -LiteralPath $installDir)) {
  New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

$sourceDir = $PSScriptRoot
$files = @(
  "raw-copy-supabase-app.ps1",
  "RawCopySupabaseApp.bat",
  "RawCopySupabaseApp.vbs",
  "raw-copy-supabase.env.example",
  "BeVietnamPro-Regular.ttf",
  "BeVietnamPro-SemiBold.ttf",
  "README.md"
)

foreach ($file in $files) {
  Copy-Item -LiteralPath (Join-Path $sourceDir $file) -Destination (Join-Path $installDir $file) -Force
}

$envPath = Join-Path $installDir "raw-copy-supabase.env"
$envExamplePath = Join-Path $installDir "raw-copy-supabase.env.example"

if (-not (Test-Path -LiteralPath $envPath)) {
  Copy-Item -LiteralPath $envExamplePath -Destination $envPath
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $installDir "RawCopySupabaseApp.vbs"
$shortcut.WorkingDirectory = $installDir
$shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,167"
$shortcut.Save()

Write-Host "Installed TLORA RAW Selector to: $installDir"
Write-Host "Desktop shortcut: $shortcutPath"
Write-Host ""
Write-Host "Before using, edit this file and fill Supabase values:"
Write-Host $envPath

Start-Process explorer.exe -ArgumentList "/select,`"$envPath`""

