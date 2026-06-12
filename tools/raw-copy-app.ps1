Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$rawExtensions = @(
  ".3fr", ".ari", ".arw", ".bay", ".cr2", ".cr3", ".crw", ".dcr",
  ".dng", ".erf", ".fff", ".iiq", ".k25", ".kdc", ".mef", ".mos",
  ".mrw", ".nef", ".nrw", ".orf", ".pef", ".raf", ".raw", ".rw2",
  ".rwl", ".sr2", ".srf", ".srw", ".x3f"
)

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

function Get-SelectedStemsFromText {
  param([string]$Text)

  if (-not $Text.Trim()) {
    throw "Hay nhap danh sach ten file can sua."
  }

  $normalizedText = $Text -replace "\.\s+", "."
  $items = $normalizedText -split "[\r\n,;`t]+"
  $stems = foreach ($item in $items) {
    Normalize-SelectedName $item
  }

  return @($stems | Where-Object { $_ } | Select-Object -Unique)
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

function Copy-RawSelection {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RawDir,

    [Parameter(Mandatory = $true)]
    [string]$NamesText,

    [Parameter(Mandatory = $true)]
    [string]$OutputFolderName,

    [bool]$Recurse = $true
  )

  if (-not (Test-Path -LiteralPath $RawDir -PathType Container)) {
    throw "Thu muc RAW khong ton tai."
  }

  $resolvedRawDir = (Resolve-Path -LiteralPath $RawDir).Path
  $safeOutputFolderName = $OutputFolderName.Trim()

  if (-not $safeOutputFolderName) {
    $safeOutputFolderName = "FILE CAN CHINH"
  }

  foreach ($invalidChar in [System.IO.Path]::GetInvalidFileNameChars()) {
    if ($safeOutputFolderName.Contains($invalidChar)) {
      throw "Ten thu muc dich co ky tu khong hop le."
    }
  }

  $outputDir = Join-Path $resolvedRawDir $safeOutputFolderName

  if (-not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
  }

  $selectedStems = @(Get-SelectedStemsFromText $NamesText)
  $normalizedRawExtensions = $rawExtensions | ForEach-Object { $_.ToLowerInvariant() }
  $searchOptions = @{
    LiteralPath = $resolvedRawDir
    File = $true
  }

  if ($Recurse) {
    $searchOptions.Recurse = $true
  }

  $rawFiles = Get-ChildItem @searchOptions | Where-Object {
    ($_.DirectoryName -ne $outputDir) -and ($normalizedRawExtensions -contains $_.Extension.ToLowerInvariant())
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
      $destination = Get-UniqueDestinationPath -Directory $outputDir -FileName $sourceFile.Name
      Copy-Item -LiteralPath $sourceFile.FullName -Destination $destination
      $copied.Add($sourceFile.Name)
    }
  }

  return [pscustomobject]@{
    OutputDir = $outputDir
    Copied = @($copied)
    Missing = @($missing)
  }
}

[System.Windows.Forms.Application]::EnableVisualStyles()

$form = New-Object System.Windows.Forms.Form
$form.Text = "Copy RAW can chinh"
$form.StartPosition = "CenterScreen"
$form.Size = New-Object System.Drawing.Size(780, 620)
$form.MinimumSize = New-Object System.Drawing.Size(680, 540)

$labelNames = New-Object System.Windows.Forms.Label
$labelNames.Text = "Ten file can sua (moi file mot dong, co the dan tu Excel):"
$labelNames.Location = New-Object System.Drawing.Point(18, 16)
$labelNames.Size = New-Object System.Drawing.Size(720, 22)
$form.Controls.Add($labelNames)

$namesTextBox = New-Object System.Windows.Forms.TextBox
$namesTextBox.Multiline = $true
$namesTextBox.ScrollBars = "Vertical"
$namesTextBox.AcceptsReturn = $true
$namesTextBox.AcceptsTab = $true
$namesTextBox.Location = New-Object System.Drawing.Point(18, 42)
$namesTextBox.Size = New-Object System.Drawing.Size(728, 180)
$namesTextBox.Anchor = "Top,Left,Right"
$form.Controls.Add($namesTextBox)

$pasteButton = New-Object System.Windows.Forms.Button
$pasteButton.Text = "Dan tu clipboard"
$pasteButton.Location = New-Object System.Drawing.Point(18, 232)
$pasteButton.Size = New-Object System.Drawing.Size(130, 32)
$pasteButton.Add_Click({
  if ([System.Windows.Forms.Clipboard]::ContainsText()) {
    $namesTextBox.Text = [System.Windows.Forms.Clipboard]::GetText()
  }
})
$form.Controls.Add($pasteButton)

$labelRawDir = New-Object System.Windows.Forms.Label
$labelRawDir.Text = "Duong dan thu muc chua file RAW:"
$labelRawDir.Location = New-Object System.Drawing.Point(18, 282)
$labelRawDir.Size = New-Object System.Drawing.Size(720, 22)
$form.Controls.Add($labelRawDir)

$rawDirTextBox = New-Object System.Windows.Forms.TextBox
$rawDirTextBox.Location = New-Object System.Drawing.Point(18, 308)
$rawDirTextBox.Size = New-Object System.Drawing.Size(610, 26)
$rawDirTextBox.Anchor = "Top,Left,Right"
$form.Controls.Add($rawDirTextBox)

$browseButton = New-Object System.Windows.Forms.Button
$browseButton.Text = "Chon..."
$browseButton.Location = New-Object System.Drawing.Point(640, 306)
$browseButton.Size = New-Object System.Drawing.Size(106, 30)
$browseButton.Anchor = "Top,Right"
$browseButton.Add_Click({
  $folderDialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $folderDialog.Description = "Chon thu muc chua file RAW"

  if ($rawDirTextBox.Text.Trim() -and (Test-Path -LiteralPath $rawDirTextBox.Text.Trim() -PathType Container)) {
    $folderDialog.SelectedPath = $rawDirTextBox.Text.Trim()
  }

  if ($folderDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    $rawDirTextBox.Text = $folderDialog.SelectedPath
  }
})
$form.Controls.Add($browseButton)

$labelOutput = New-Object System.Windows.Forms.Label
$labelOutput.Text = "Ten thu muc se tao trong thu muc RAW:"
$labelOutput.Location = New-Object System.Drawing.Point(18, 354)
$labelOutput.Size = New-Object System.Drawing.Size(300, 22)
$form.Controls.Add($labelOutput)

$outputTextBox = New-Object System.Windows.Forms.TextBox
$outputTextBox.Text = "FILE CAN CHINH"
$outputTextBox.Location = New-Object System.Drawing.Point(18, 380)
$outputTextBox.Size = New-Object System.Drawing.Size(320, 26)
$form.Controls.Add($outputTextBox)

$recurseCheckBox = New-Object System.Windows.Forms.CheckBox
$recurseCheckBox.Text = "Tim ca trong thu muc con"
$recurseCheckBox.Checked = $true
$recurseCheckBox.Location = New-Object System.Drawing.Point(368, 380)
$recurseCheckBox.Size = New-Object System.Drawing.Size(240, 28)
$form.Controls.Add($recurseCheckBox)

$runButton = New-Object System.Windows.Forms.Button
$runButton.Text = "Tao thu muc va copy RAW"
$runButton.Location = New-Object System.Drawing.Point(18, 428)
$runButton.Size = New-Object System.Drawing.Size(210, 38)
$form.Controls.Add($runButton)

$statusTextBox = New-Object System.Windows.Forms.TextBox
$statusTextBox.Multiline = $true
$statusTextBox.ScrollBars = "Vertical"
$statusTextBox.ReadOnly = $true
$statusTextBox.Location = New-Object System.Drawing.Point(18, 482)
$statusTextBox.Size = New-Object System.Drawing.Size(728, 78)
$statusTextBox.Anchor = "Top,Left,Right,Bottom"
$form.Controls.Add($statusTextBox)

$runButton.Add_Click({
  $runButton.Enabled = $false
  $statusTextBox.Text = "Dang tim va copy file..."
  $form.Refresh()

  try {
    $result = Copy-RawSelection `
      -RawDir $rawDirTextBox.Text.Trim() `
      -NamesText $namesTextBox.Text `
      -OutputFolderName $outputTextBox.Text `
      -Recurse $recurseCheckBox.Checked

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("Thu muc da tao: $($result.OutputDir)")
    $lines.Add("Da copy: $($result.Copied.Count) file")

    foreach ($fileName in $result.Copied) {
      $lines.Add("OK  $fileName")
    }

    if ($result.Missing.Count -gt 0) {
      $lines.Add("")
      $lines.Add("Khong tim thay RAW cho:")

      foreach ($stem in $result.Missing) {
        $lines.Add("--  $stem")
      }
    }

    $statusTextBox.Text = $lines -join [Environment]::NewLine

    if ($result.Missing.Count -gt 0) {
      [System.Windows.Forms.MessageBox]::Show("Da copy $($result.Copied.Count) file. Co $($result.Missing.Count) ten khong tim thay RAW.", "Hoan tat mot phan", "OK", "Warning") | Out-Null
    } else {
      [System.Windows.Forms.MessageBox]::Show("Da copy $($result.Copied.Count) file vao thu muc can chinh.", "Hoan tat", "OK", "Information") | Out-Null
    }
  } catch {
    $statusTextBox.Text = $_.Exception.Message
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Loi", "OK", "Error") | Out-Null
  } finally {
    $runButton.Enabled = $true
  }
})

[void]$form.ShowDialog()
