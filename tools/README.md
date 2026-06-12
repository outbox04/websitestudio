# Copy RAW files for editing

Tool nay dung tren Windows de copy file RAW can chinh tu mot thu muc RAW sang thu muc `FILE CAN CHINH`.

## App co giao dien

Chay app:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\raw-copy-app.ps1
```

Trong app:

1. Dan danh sach ten file can sua.
2. Chon hoac nhap duong dan thu muc chua file RAW.
3. Bam `Tao thu muc va copy RAW`.

App se tao thu muc `FILE CAN CHINH` ngay trong thu muc RAW va copy cac file RAW cung ten vao do.

## Cach dung nhanh bang lenh

1. Copy danh sach file khach chon, vi du:

```text
6Z0A2854.JPG
6Z0A2860. JPG
6Z0A2871
```

2. Chay PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\copy-raw-selection.ps1 -RawDir "D:\Album\FILE GOC RAW"
```

Tool se tu tao thu muc `FILE CAN CHINH` trong thu muc RAW, roi copy cac file RAW cung ten nhu `.CR3`, `.CR2`, `.NEF`, `.ARW`, `.RAF`, `.DNG`.

## Tuy chon

Chi dinh thu muc dich:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\copy-raw-selection.ps1 -RawDir "D:\Album\FILE GOC RAW" -OutputDir "D:\Album\FILE CAN CHINH"
```

Dung file `.txt` thay vi clipboard:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\copy-raw-selection.ps1 -RawDir "D:\Album\FILE GOC RAW" -NamesFile ".\selected-files.txt"
```

Khong tim trong thu muc con:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\copy-raw-selection.ps1 -RawDir "D:\Album\FILE GOC RAW" -Recurse $false
```
