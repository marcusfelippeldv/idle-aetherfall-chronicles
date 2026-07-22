# RTK statusline badge. Renders [RTK] only when the rtk binary is installed.
# Mirrors the hardening style of caveman/qmd statusline scripts.
$RtkExe = Join-Path $HOME ".local/bin/rtk.exe"
$RtkCmd = Get-Command rtk -ErrorAction SilentlyContinue
if (-not $RtkCmd -and -not (Test-Path $RtkExe)) { exit 0 }

$Esc = [char]27
[Console]::Write("${Esc}[38;5;39m[RTK]${Esc}[0m")
