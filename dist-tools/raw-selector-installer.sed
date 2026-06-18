[Version]
Class=IEXPRESS
SEDVersion=3

[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=0
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=TLORA RAW Selector da cai dat xong. Hay dien Supabase key trong file env vua duoc mo.
TargetName=D:\ST\websitestudio\dist-tools\TLORA-Raw-Selector-Setup.exe
FriendlyName=TLORA RAW Selector Setup
AppLaunched=powershell.exe -NoProfile -ExecutionPolicy Bypass -File install-raw-copy-supabase.ps1
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=SourceFiles

[Strings]
FILE0="raw-copy-supabase-app.ps1"
FILE1="RawCopySupabaseApp.bat"
FILE2="RawCopySupabaseApp.vbs"
FILE3="raw-copy-supabase.env.example"
FILE4="BeVietnamPro-Regular.ttf"
FILE5="BeVietnamPro-SemiBold.ttf"
FILE6="install-raw-copy-supabase.ps1"
FILE7="README.md"

[SourceFiles]
SourceFiles0=D:\ST\websitestudio\dist-tools\raw-selector-installer-files

[SourceFiles0]
%FILE0%=
%FILE1%=
%FILE2%=
%FILE3%=
%FILE4%=
%FILE5%=
%FILE6%=
%FILE7%=
