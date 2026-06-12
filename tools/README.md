# Copy RAW files for editing

Tool này dùng trên Windows để copy file RAW cần chỉnh từ một thư mục RAW sang thư mục `FILE CAN CHINH`.

## Cách dùng nhanh

1. Copy danh sách file khách chọn, ví dụ:

```text
6Z0A2854.JPG
6Z0A2860. JPG
6Z0A2871
```

2. Chạy PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\copy-raw-selection.ps1 -RawDir "D:\Album\FILE GOC RAW"
```

Tool sẽ tự tạo thư mục `FILE CAN CHINH` nằm cạnh thư mục RAW, rồi copy các file RAW cùng tên như `.CR3`, `.CR2`, `.NEF`, `.ARW`, `.RAF`, `.DNG`.

## Tùy chọn

Chỉ định thư mục đích:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\copy-raw-selection.ps1 -RawDir "D:\Album\FILE GOC RAW" -OutputDir "D:\Album\FILE CAN CHINH"
```

Dùng file `.txt` thay vì clipboard:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\copy-raw-selection.ps1 -RawDir "D:\Album\FILE GOC RAW" -NamesFile ".\selected-files.txt"
```

Không tìm trong thư mục con:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\copy-raw-selection.ps1 -RawDir "D:\Album\FILE GOC RAW" -Recurse $false
```
