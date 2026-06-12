param(
  [Parameter(Mandatory = $true)]
  [string]$RawDir,

  [string]$OutputDir,

  [string]$NamesFile,

  [bool]$Recurse = $true,

  [string[]]$RawExtensions = @(
    ".3fr", ".ari", ".arw", ".bay", ".cr2", ".cr3", ".crw", ".dcr",
    ".dng", ".erf", ".fff", ".iiq", ".k25", ".kdc", ".mef", ".mos",
    ".mrw", ".nef", ".nrw", ".orf", ".pef", ".raf", ".raw", ".rw2",
    ".rwl", ".sr2", ".srf", ".srw", ".x3f"
  )
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-SelectedName {
  param([string]$Name)

  $cleanName = $Name.Trim().Trim('"', "'")
  $cleanName = $cleanName -replace "\s+\.", "."
  $cleanName = $cleanName -replace "\.\s+", "."

  if (-not $cleanName) {
    return $null
  }

  $leafName = Split-Path -Leaf $cleanName
  $stem = [System.IO.Path]::GetFileNameWithoutExtension($leafName)

  if (-not $stem) {
    $stem = $leafName
  }

  return $stem.Trim()
}

function Get-SelectedStems {
  if ($NamesFile) {
    if (-not (Test-Path -LiteralPath $NamesFile)) {
      throw "Không tìm thấy file danh sách: $NamesFile"
    }

    $content = Get-Content -LiteralPath $NamesFile -Raw
  } else {
    $content = Get-Clipboard -Raw
  }

  if (-not $content.Trim()) {
    throw "Danh sách file đang trống. Hãy copy tên file cần sửa hoặc truyền -NamesFile."
  }

  $content = $content -replace "\.\s+", "."
  $items = $content -split "[\r\n,;`t]+"

  $stems = foreach ($item in $items) {
    Normalize-SelectedName $item
  }

  return $stems | Where-Object { $_ } | Select-Object -Unique
}

function Get-UniqueDestinationPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Directory,

    [Parameter(Mandatory = $true)]
    [string]$FileName
  )

  $destination = Join-Path $Directory $FileName

  if (-not (Test-Path -LiteralPath $destination)) {
    return $destination
  }

  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
  $extension = [System.IO.Path]::GetExtension($FileName)
  $index = 2

  do {
    $destination = Join-Path $Directory "$baseName-$index$extension"
    $index++
  } while (Test-Path -LiteralPath $destination)

  return $destination
}

$resolvedRawDir = (Resolve-Path -LiteralPath $RawDir).Path

if (-not $OutputDir) {
  $OutputDir = Join-Path $resolvedRawDir "FILE CAN CHINH"
}

if (-not (Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$resolvedOutputDir = (Resolve-Path -LiteralPath $OutputDir).Path
$selectedStems = @(Get-SelectedStems)
$normalizedRawExtensions = $RawExtensions | ForEach-Object { $_.ToLowerInvariant() }

$searchOptions = @{
  LiteralPath = $resolvedRawDir
  File = $true
}

if ($Recurse) {
  $searchOptions.Recurse = $true
}

$rawFiles = Get-ChildItem @searchOptions | Where-Object {
  $normalizedRawExtensions -contains $_.Extension.ToLowerInvariant()
}

$filesByStem = @{}

foreach ($file in $rawFiles) {
  $key = $file.BaseName.ToLowerInvariant()

  if (-not $filesByStem.ContainsKey($key)) {
    $filesByStem[$key] = New-Object System.Collections.Generic.List[System.IO.FileInfo]
  }

  $filesByStem[$key].Add($file)
}

$copied = New-Object System.Collections.Generic.List[string]
$missing = New-Object System.Collections.Generic.List[string]

foreach ($stem in $selectedStems) {
  $key = $stem.ToLowerInvariant()

  if (-not $filesByStem.ContainsKey($key)) {
    $missing.Add($stem)
    continue
  }

  foreach ($sourceFile in $filesByStem[$key]) {
    $destination = Get-UniqueDestinationPath -Directory $resolvedOutputDir -FileName $sourceFile.Name
    Copy-Item -LiteralPath $sourceFile.FullName -Destination $destination
    $copied.Add($sourceFile.Name)
  }
}

Write-Host ""
Write-Host "Thu muc RAW: $resolvedRawDir"
Write-Host "Thu muc can chinh: $resolvedOutputDir"
Write-Host "Da copy: $($copied.Count) file"

if ($copied.Count -gt 0) {
  $copied | ForEach-Object { Write-Host "  OK  $_" }
}

if ($missing.Count -gt 0) {
  Write-Host ""
  Write-Host "Khong tim thay RAW cho $($missing.Count) ten:"
  $missing | ForEach-Object { Write-Host "  --  $_" }
  exit 1
}
