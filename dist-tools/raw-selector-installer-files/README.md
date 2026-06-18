# Copy RAW files for editing

## App lay danh sach tu Supabase

Tool nay phu hop workflow moi: khach chon anh tren web, Supabase luu danh sach file can chinh, file RAW van nam tren may/o cung/NAS cua studio.

Giao dien app dung Google Font `Be Vietnam Pro` duoc dong goi kem app, khong can cai font rieng tren may nhan vien.

Thu muc `tools` co the copy rieng sang may nhan vien. Tool khong can chay website va khong doc file env cua website.

Chuan bi file env rieng cua tool:

1. Copy file:

```text
tools\raw-copy-supabase.env.example
```

2. Doi ten file copy thanh:

```text
tools\raw-copy-supabase.env
```

3. Dien thong tin Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Co the dung `NEXT_PUBLIC_SUPABASE_ANON_KEY` neu policy Supabase cho phep public read bang `customer_galleries` va `customer_gallery_photos`, nhung nen dung `SUPABASE_SERVICE_ROLE_KEY` tren may noi bo studio.

Chay app:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\raw-copy-supabase-app.ps1
```

Hoac double-click:

```text
tools\RawCopySupabaseApp.bat
```

Tao shortcut ngoai Desktop:

```text
tools\CreateRawCopySupabaseShortcut.bat
```

Sau khi chay file tren, Desktop se co shortcut `TLORA RAW Selector`. Mo shortcut len se hien giao dien de:

- tim ten khach hang tu Supabase
- chon album
- chon thu muc RAW tren may
- tao thu muc con va copy file RAW can chinh

## Tao ban cai dat EXE

Chay lenh nay tren may Windows co san IExpress:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-raw-selector-installer.ps1
```

File cai dat se duoc tao tai:

```text
dist-tools\TLORA-Raw-Selector-Setup.exe
```

Gui file `.exe` nay cho nhan vien. Khi mo file cai dat:

1. Tool se duoc copy vao `%LOCALAPPDATA%\TLORA\RawSelector`.
2. Shortcut `TLORA RAW Selector` se duoc tao ngoai Desktop.
3. File env rieng se nam tai:

```text
%LOCALAPPDATA%\TLORA\RawSelector\raw-copy-supabase.env
```

Mo file env nay va dien Supabase key truoc khi dung tool.

Khong nen nhung `SUPABASE_SERVICE_ROLE_KEY` vao file `.exe` neu file cai dat se gui cho nhieu may. Moi may nen co file env rieng de de thu hoi/thay key khi can.

Trong app:

1. App tu tai danh sach khach hang tu Supabase khi mo len.
2. Chon album dung ngay chup trong dropdown.
3. Neu danh sach dai, dung o loc nhanh theo ten hoac slug.
4. App se tu nap danh sach file can chinh. Co the bam `Lay file can chinh` de nap lai.
5. Chon thu muc RAW local.
6. Bam `Tao thu muc va copy RAW`.

App se tao thu muc `FILE CAN CHINH` trong thu muc RAW va copy cac file RAW co cung ten goc:

```text
Supabase:  ABC011.JPG
RAW local: ABC011.CR3, ABC011.ARW, ABC011.NEF...
```

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
