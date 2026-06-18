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

$script:GalleryItems = @()
$script:VisibleGalleryItems = @()
$script:PrivateFonts = New-Object System.Drawing.Text.PrivateFontCollection

function Initialize-AppFonts {
  $regularFontPath = Join-Path $PSScriptRoot "BeVietnamPro-Regular.ttf"
  $semiBoldFontPath = Join-Path $PSScriptRoot "BeVietnamPro-SemiBold.ttf"

  if (Test-Path -LiteralPath $regularFontPath) {
    $script:PrivateFonts.AddFontFile($regularFontPath)
  }

  if (Test-Path -LiteralPath $semiBoldFontPath) {
    $script:PrivateFonts.AddFontFile($semiBoldFontPath)
  }
}

function New-AppFont {
  param(
    [float]$Size,
    [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
  )

  if ($script:PrivateFonts.Families.Count -gt 0) {
    return New-Object System.Drawing.Font($script:PrivateFonts.Families[0], $Size, $Style)
  }

  return New-Object System.Drawing.Font("Segoe UI", $Size, $Style)
}

function Read-DotEnv {
  param([string]$Path)

  $values = @{}

  if (-not (Test-Path -LiteralPath $Path)) {
    return $values
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()

    if (-not $trimmed -or $trimmed.StartsWith("#") -or -not $trimmed.Contains("=")) {
      continue
    }

    $parts = $trimmed.Split("=", 2)
    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"', "'")
    $values[$key] = $value
  }

  return $values
}

function Normalize-SupabaseUrl {
  param([string]$Url)

  $cleanUrl = $Url.Trim().TrimEnd("/")

  if ($cleanUrl -match "supabase\.com/dashboard/project/([a-zA-Z0-9-]+)") {
    $cleanUrl = "https://$($Matches[1]).supabase.co"
  }

  $cleanUrl = $cleanUrl -replace "/rest/v1$", ""
  $cleanUrl = $cleanUrl.TrimEnd("/")

  if ($cleanUrl -notmatch "^https?://") {
    throw "NEXT_PUBLIC_SUPABASE_URL phải có dạng https://project-ref.supabase.co"
  }

  return $cleanUrl
}

function Get-SupabaseConfig {
  $envPath = Join-Path $PSScriptRoot "raw-copy-supabase.env"
  $values = Read-DotEnv $envPath

  $url = $values["NEXT_PUBLIC_SUPABASE_URL"]
  $key = $values["SUPABASE_SERVICE_ROLE_KEY"]

  if (-not $key) {
    $key = $values["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
  }

  if (-not $url -or -not $key) {
    throw "Chưa cấu hình kết nối dữ liệu. Hãy tạo file raw-copy-supabase.env từ file mẫu raw-copy-supabase.env.example."
  }

  return [pscustomobject]@{
    Url = Normalize-SupabaseUrl $url
    Key = $key
  }
}

function Invoke-SupabaseGet {
  param(
    [Parameter(Mandatory = $true)]
    [string]$PathAndQuery
  )

  $config = Get-SupabaseConfig
  $headers = @{
    "apikey" = $config.Key
    "Authorization" = "Bearer $($config.Key)"
    "Accept-Profile" = "public"
    "Content-Profile" = "public"
  }

  $uri = "$($config.Url)/rest/v1/$PathAndQuery"

  try {
    $response = Invoke-WebRequest -Method Get -Uri $uri -Headers $headers -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json

    if ($null -eq $json) {
      return @()
    }

    return @($json)
  } catch {
    $message = $_.Exception.Message

    if ($message -like "*404*") {
      throw "Không tìm thấy dữ liệu album. Hãy kiểm tra địa chỉ kết nối và cấu hình database."
    }

    throw "Không kết nối được dữ liệu: $message"
  }
}

function Search-CustomerGalleries {
  param([string]$Query)

  $normalizedQuery = $Query.Trim()
  $select = [uri]::EscapeDataString("id,customer_name,customer_name_slug,shoot_date")
  $path = "customer_galleries?select=$select&order=created_at.desc&limit=30"

  if ($normalizedQuery) {
    $escaped = $normalizedQuery.Replace("*", "")
    $or = [uri]::EscapeDataString("customer_name.ilike.*$escaped*,customer_name_slug.ilike.*$escaped*")
    $path = "$path&or=($or)"
  }

  return @(Invoke-SupabaseGet $path)
}

function Format-GalleryItem {
  param($Gallery)

  $dateText = if ($Gallery.shoot_date) { $Gallery.shoot_date } else { "-" }
  return "$($Gallery.customer_name)  |  $dateText  |  /$($Gallery.customer_name_slug)"
}

function Get-GalleryEditFileNames {
  param([string]$GalleryId)

  $select = [uri]::EscapeDataString("file_name,selected,edit_note")
  $path = "customer_gallery_photos?select=$select&gallery_id=eq.$GalleryId&kind=eq.raw&order=file_name.asc"
  $photos = @(Invoke-SupabaseGet $path)

  return @(
    $photos |
      Where-Object { $_.selected -eq $true -or -not [string]::IsNullOrWhiteSpace([string]$_.edit_note) } |
      Select-Object -ExpandProperty file_name -Unique
  )
}

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
    throw "Danh sách tên file cần sửa đang trống. Hãy chọn album trước."
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

    [bool]$Recurse = $true,

    [bool]$UseJpegFallback = $true
  )

  if (-not (Test-Path -LiteralPath $RawDir -PathType Container)) {
    throw "Thư mục file gốc không tồn tại."
  }

  $resolvedRawDir = (Resolve-Path -LiteralPath $RawDir).Path
  $safeOutputFolderName = $OutputFolderName.Trim()

  if (-not $safeOutputFolderName) {
    $safeOutputFolderName = "FILE CAN CHINH"
  }

  foreach ($invalidChar in [System.IO.Path]::GetInvalidFileNameChars()) {
    if ($safeOutputFolderName.Contains($invalidChar)) {
      throw "Tên thư mục đích có ký tự không hợp lệ."
    }
  }

  $outputDir = Join-Path $resolvedRawDir $safeOutputFolderName

  if (-not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
  }

  $selectedStems = @(Get-SelectedStemsFromText $NamesText)
  $normalizedRawExtensions = $rawExtensions | ForEach-Object { $_.ToLowerInvariant() }
  $jpegExtensions = @(".jpg", ".jpeg")
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
  $jpegFilesByStem = @{}

  foreach ($file in $rawFiles) {
    $key = $file.BaseName.ToLowerInvariant()

    if (-not $filesByStem.ContainsKey($key)) {
      $filesByStem[$key] = New-Object System.Collections.Generic.List[System.IO.FileInfo]
    }

    $filesByStem[$key].Add($file)
  }

  if ($UseJpegFallback) {
    $jpegFiles = Get-ChildItem @searchOptions | Where-Object {
      ($_.DirectoryName -ne $outputDir) -and ($jpegExtensions -contains $_.Extension.ToLowerInvariant())
    }

    foreach ($file in $jpegFiles) {
      $key = $file.BaseName.ToLowerInvariant()

      if (-not $jpegFilesByStem.ContainsKey($key)) {
        $jpegFilesByStem[$key] = New-Object System.Collections.Generic.List[System.IO.FileInfo]
      }

      $jpegFilesByStem[$key].Add($file)
    }
  }

  $copied = New-Object System.Collections.Generic.List[string]
  $missing = New-Object System.Collections.Generic.List[string]

  foreach ($stem in $selectedStems) {
    $key = $stem.ToLowerInvariant()

    if (-not $filesByStem.ContainsKey($key) -and -not $jpegFilesByStem.ContainsKey($key)) {
      $missing.Add($stem)
      continue
    }

    $sourceFiles = if ($filesByStem.ContainsKey($key)) {
      $filesByStem[$key]
    } else {
      $jpegFilesByStem[$key]
    }

    foreach ($sourceFile in $sourceFiles) {
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

Initialize-AppFonts
[System.Windows.Forms.Application]::EnableVisualStyles()

$form = New-Object System.Windows.Forms.Form
$form.Text = "TLORA RAW Selector"
$form.StartPosition = "CenterScreen"
$form.Size = New-Object System.Drawing.Size(980, 760)
$form.MinimumSize = New-Object System.Drawing.Size(900, 700)
$form.BackColor = [System.Drawing.Color]::FromArgb(246, 247, 249)
$form.Font = New-AppFont 9

$headerLabel = New-Object System.Windows.Forms.Label
$headerLabel.Text = "TLORA RAW Selector"
$headerLabel.Font = New-AppFont 17 ([System.Drawing.FontStyle]::Bold)
$headerLabel.Location = New-Object System.Drawing.Point(22, 18)
$headerLabel.Size = New-Object System.Drawing.Size(360, 34)
$form.Controls.Add($headerLabel)

$hintLabel = New-Object System.Windows.Forms.Label
$hintLabel.Text = "Chọn album khách hàng, chọn thư mục ảnh gốc trên máy, app sẽ copy file cùng tên vào thư mục cần chỉnh."
$hintLabel.Location = New-Object System.Drawing.Point(24, 54)
$hintLabel.Size = New-Object System.Drawing.Size(860, 22)
$hintLabel.ForeColor = [System.Drawing.Color]::FromArgb(82, 82, 91)
$form.Controls.Add($hintLabel)

$albumGroup = New-Object System.Windows.Forms.GroupBox
$albumGroup.Text = "1. Chọn album"
$albumGroup.Location = New-Object System.Drawing.Point(22, 88)
$albumGroup.Size = New-Object System.Drawing.Size(918, 112)
$albumGroup.Anchor = "Top,Left,Right"
$form.Controls.Add($albumGroup)

$refreshButton = New-Object System.Windows.Forms.Button
$refreshButton.Text = "Tải lại"
$refreshButton.Location = New-Object System.Drawing.Point(16, 50)
$refreshButton.Size = New-Object System.Drawing.Size(92, 32)
$albumGroup.Controls.Add($refreshButton)

$galleryComboBox = New-Object System.Windows.Forms.ComboBox
$galleryComboBox.DropDownStyle = "DropDownList"
$galleryComboBox.Location = New-Object System.Drawing.Point(124, 52)
$galleryComboBox.Size = New-Object System.Drawing.Size(606, 28)
$galleryComboBox.Anchor = "Top,Left,Right"
$albumGroup.Controls.Add($galleryComboBox)

$loadButton = New-Object System.Windows.Forms.Button
$loadButton.Text = "Lấy file cần chỉnh"
$loadButton.Location = New-Object System.Drawing.Point(744, 50)
$loadButton.Size = New-Object System.Drawing.Size(150, 32)
$loadButton.Anchor = "Top,Right"
$albumGroup.Controls.Add($loadButton)

$filesGroup = New-Object System.Windows.Forms.GroupBox
$filesGroup.Text = "2. Danh sách file cần chỉnh"
$filesGroup.Location = New-Object System.Drawing.Point(22, 214)
$filesGroup.Size = New-Object System.Drawing.Size(918, 248)
$filesGroup.Anchor = "Top,Left,Right"
$form.Controls.Add($filesGroup)

$labelNames = New-Object System.Windows.Forms.Label
$labelNames.Text = "File khách đã chọn"
$labelNames.Location = New-Object System.Drawing.Point(16, 28)
$labelNames.Size = New-Object System.Drawing.Size(200, 22)
$filesGroup.Controls.Add($labelNames)

$fileCountLabel = New-Object System.Windows.Forms.Label
$fileCountLabel.Text = "0 file"
$fileCountLabel.Location = New-Object System.Drawing.Point(740, 28)
$fileCountLabel.Size = New-Object System.Drawing.Size(150, 22)
$fileCountLabel.Anchor = "Top,Right"
$fileCountLabel.TextAlign = "MiddleRight"
$fileCountLabel.ForeColor = [System.Drawing.Color]::FromArgb(82, 82, 91)
$filesGroup.Controls.Add($fileCountLabel)

$namesTextBox = New-Object System.Windows.Forms.TextBox
$namesTextBox.Multiline = $true
$namesTextBox.ScrollBars = "Vertical"
$namesTextBox.AcceptsReturn = $true
$namesTextBox.AcceptsTab = $true
$namesTextBox.Location = New-Object System.Drawing.Point(16, 54)
$namesTextBox.Size = New-Object System.Drawing.Size(884, 142)
$namesTextBox.Anchor = "Top,Left,Right"
$namesTextBox.Font = New-AppFont 9
$filesGroup.Controls.Add($namesTextBox)

$copyNamesButton = New-Object System.Windows.Forms.Button
$copyNamesButton.Text = "Copy danh sách"
$copyNamesButton.Location = New-Object System.Drawing.Point(16, 206)
$copyNamesButton.Size = New-Object System.Drawing.Size(130, 32)
$copyNamesButton.Add_Click({
  if ($namesTextBox.Text.Trim()) {
    [System.Windows.Forms.Clipboard]::SetText($namesTextBox.Text.Trim())
  }
})
$filesGroup.Controls.Add($copyNamesButton)

$rawGroup = New-Object System.Windows.Forms.GroupBox
$rawGroup.Text = "3. Copy file gốc trên máy"
$rawGroup.Location = New-Object System.Drawing.Point(22, 476)
$rawGroup.Size = New-Object System.Drawing.Size(918, 218)
$rawGroup.Anchor = "Top,Left,Right,Bottom"
$form.Controls.Add($rawGroup)

$labelRawDir = New-Object System.Windows.Forms.Label
$labelRawDir.Text = "Đường dẫn thư mục chứa file gốc:"
$labelRawDir.Location = New-Object System.Drawing.Point(16, 28)
$labelRawDir.Size = New-Object System.Drawing.Size(720, 22)
$rawGroup.Controls.Add($labelRawDir)

$rawDirTextBox = New-Object System.Windows.Forms.TextBox
$rawDirTextBox.Location = New-Object System.Drawing.Point(16, 54)
$rawDirTextBox.Size = New-Object System.Drawing.Size(744, 26)
$rawDirTextBox.Anchor = "Top,Left,Right"
$rawGroup.Controls.Add($rawDirTextBox)

$browseButton = New-Object System.Windows.Forms.Button
$browseButton.Text = "Chọn..."
$browseButton.Location = New-Object System.Drawing.Point(772, 52)
$browseButton.Size = New-Object System.Drawing.Size(128, 30)
$browseButton.Anchor = "Top,Right"
$browseButton.Add_Click({
  $folderDialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $folderDialog.Description = "Chọn thư mục chứa file gốc"

  if ($rawDirTextBox.Text.Trim() -and (Test-Path -LiteralPath $rawDirTextBox.Text.Trim() -PathType Container)) {
    $folderDialog.SelectedPath = $rawDirTextBox.Text.Trim()
  }

  if ($folderDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    $rawDirTextBox.Text = $folderDialog.SelectedPath
  }
})
$rawGroup.Controls.Add($browseButton)

$labelOutput = New-Object System.Windows.Forms.Label
$labelOutput.Text = "Tên thư mục sẽ tạo trong thư mục file gốc:"
$labelOutput.Location = New-Object System.Drawing.Point(16, 94)
$labelOutput.Size = New-Object System.Drawing.Size(300, 22)
$rawGroup.Controls.Add($labelOutput)

$outputTextBox = New-Object System.Windows.Forms.TextBox
$outputTextBox.Text = "FILE CAN CHINH"
$outputTextBox.Location = New-Object System.Drawing.Point(16, 120)
$outputTextBox.Size = New-Object System.Drawing.Size(320, 26)
$rawGroup.Controls.Add($outputTextBox)

$recurseCheckBox = New-Object System.Windows.Forms.CheckBox
$recurseCheckBox.Text = "Tìm cả trong thư mục con"
$recurseCheckBox.Checked = $true
$recurseCheckBox.Location = New-Object System.Drawing.Point(360, 120)
$recurseCheckBox.Size = New-Object System.Drawing.Size(240, 28)
$rawGroup.Controls.Add($recurseCheckBox)

$jpegFallbackCheckBox = New-Object System.Windows.Forms.CheckBox
$jpegFallbackCheckBox.Text = "Nếu không có RAW thì copy JPG"
$jpegFallbackCheckBox.Checked = $true
$jpegFallbackCheckBox.Location = New-Object System.Drawing.Point(590, 120)
$jpegFallbackCheckBox.Size = New-Object System.Drawing.Size(260, 28)
$rawGroup.Controls.Add($jpegFallbackCheckBox)

$runButton = New-Object System.Windows.Forms.Button
$runButton.Text = "Tạo thư mục và copy file"
$runButton.Location = New-Object System.Drawing.Point(16, 164)
$runButton.Size = New-Object System.Drawing.Size(220, 38)
$rawGroup.Controls.Add($runButton)

$statusTextBox = New-Object System.Windows.Forms.TextBox
$statusTextBox.Multiline = $true
$statusTextBox.ScrollBars = "Vertical"
$statusTextBox.ReadOnly = $true
$statusTextBox.Location = New-Object System.Drawing.Point(252, 158)
$statusTextBox.Size = New-Object System.Drawing.Size(648, 48)
$statusTextBox.Anchor = "Top,Left,Right,Bottom"
$rawGroup.Controls.Add($statusTextBox)

function Apply-GalleryFilter {
  $galleryComboBox.Items.Clear()
  $script:VisibleGalleryItems = @($script:GalleryItems)

  foreach ($gallery in $script:VisibleGalleryItems) {
    [void]$galleryComboBox.Items.Add((Format-GalleryItem $gallery))
  }

  if ($galleryComboBox.Items.Count -gt 0) {
    $galleryComboBox.SelectedIndex = 0
  } else {
    $namesTextBox.Clear()
    $fileCountLabel.Text = "0 file"
  }
}

function Load-Galleries {
  $refreshButton.Enabled = $false
  $loadButton.Enabled = $false
  $statusTextBox.Text = "Äang táº£i danh sÃ¡ch album..."
  $form.Refresh()

  try {
    $script:GalleryItems = @(Search-CustomerGalleries "")
    Apply-GalleryFilter
    $statusTextBox.Text = "ÄÃ£ táº£i $($script:GalleryItems.Count) album. Chá»n album Ä‘á»ƒ láº¥y file cáº§n chá»‰nh."
  } catch {
    $statusTextBox.Text = $_.Exception.Message
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Lá»—i táº£i dá»¯ liá»‡u", "OK", "Error") | Out-Null
  } finally {
    $refreshButton.Enabled = $true
    $loadButton.Enabled = $true
  }
}

function Load-SelectedGalleryFiles {
  if ($galleryComboBox.SelectedIndex -lt 0) {
    return
  }

  $loadButton.Enabled = $false
  $statusTextBox.Text = "Äang láº¥y danh sÃ¡ch file..."
  $form.Refresh()

  try {
    $gallery = $script:VisibleGalleryItems[$galleryComboBox.SelectedIndex]
    $fileNames = @(Get-GalleryEditFileNames $gallery.id)
    $namesTextBox.Text = $fileNames -join [Environment]::NewLine
    $fileCountLabel.Text = "$($fileNames.Count) file"
    $statusTextBox.Text = "ÄÃ£ láº¥y $($fileNames.Count) file cáº§n chá»‰nh cho $($gallery.customer_name)."
  } catch {
    $statusTextBox.Text = $_.Exception.Message
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Lá»—i táº£i file", "OK", "Error") | Out-Null
  } finally {
    $loadButton.Enabled = $true
  }
}

$refreshButton.Add_Click({
  Load-Galleries
})

$galleryComboBox.Add_SelectedIndexChanged({
  Load-SelectedGalleryFiles
})

$loadButton.Add_Click({
  if ($galleryComboBox.SelectedIndex -lt 0) {
    [System.Windows.Forms.MessageBox]::Show("HÃ£y chá»n má»™t album trong danh sÃ¡ch.", "Thiáº¿u lá»±a chá»n", "OK", "Warning") | Out-Null
    return
  }

  Load-SelectedGalleryFiles
})

$runButton.Add_Click({
  $runButton.Enabled = $false
  $statusTextBox.Text = "Äang tÃ¬m vÃ  copy file..."
  $form.Refresh()

  try {
    $result = Copy-RawSelection `
      -RawDir $rawDirTextBox.Text.Trim() `
      -NamesText $namesTextBox.Text `
      -OutputFolderName $outputTextBox.Text `
      -Recurse $recurseCheckBox.Checked `
      -UseJpegFallback $jpegFallbackCheckBox.Checked

    $message = "ThÆ° má»¥c: $($result.OutputDir). ÄÃ£ copy $($result.Copied.Count) file."

    if ($result.Missing.Count -gt 0) {
      $message = "$message KhÃ´ng tÃ¬m tháº¥y $($result.Missing.Count): $($result.Missing -join ', ')"
      [System.Windows.Forms.MessageBox]::Show($message, "HoÃ n táº¥t má»™t pháº§n", "OK", "Warning") | Out-Null
    } else {
      [System.Windows.Forms.MessageBox]::Show($message, "HoÃ n táº¥t", "OK", "Information") | Out-Null
    }

    $statusTextBox.Text = $message
  } catch {
    $statusTextBox.Text = $_.Exception.Message
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Loi", "OK", "Error") | Out-Null
  } finally {
    $runButton.Enabled = $true
  }
})

$form.Add_Shown({
  Load-Galleries
})

[void]$form.ShowDialog()

