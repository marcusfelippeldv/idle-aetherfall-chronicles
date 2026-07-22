$ErrorActionPreference = "SilentlyContinue"
$ClaudeDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME ".claude" }
$Cache = Join-Path $ClaudeDir ".qmd-statusline-cache"

$QmdBase = Join-Path $ClaudeDir "plugins/cache/qmd/qmd"
if (-not (Test-Path $QmdBase)) { exit 0 }

$QmdVer = Get-ChildItem -LiteralPath $QmdBase -Directory | Sort-Object Name -Descending | Select-Object -First 1
if ($null -eq $QmdVer) { exit 0 }

$QmdCli = Join-Path $QmdVer.FullName "dist/cli/qmd.js"
if (-not (Test-Path $QmdCli)) { exit 0 }

$Bun = (Get-Command bun -ErrorAction SilentlyContinue).Source
if ([string]::IsNullOrEmpty($Bun)) { exit 0 }

$Out = & $Bun $QmdCli status 2>$null | Out-String
if ([string]::IsNullOrEmpty($Out)) { exit 0 }

$Coll = ""
$Count = ""
$Updated = ""
$InCollections = $false
foreach ($L in ($Out -split "`n")) {
    if ($L -match '^Collections') { $InCollections = $true; continue }
    if (-not $InCollections) { continue }
    if ($L -match '^\s\s([a-zA-Z0-9_\-\.]+)\s+\(qmd://') { $Coll = $Matches[1]; continue }
    if ($L -match 'Files:\s+(\d+)\s+\(updated\s+([^)]+)\)') {
        $Count = $Matches[1]
        $Updated = $Matches[2].Trim()
        break
    }
}

if ([string]::IsNullOrEmpty($Coll) -or [string]::IsNullOrEmpty($Count)) { exit 0 }

$Status = if ($Updated -match '\b(h|d)\s+ago') { "stale" } else { "ok" }

$Line = "$Coll/$Count/$Status"
Set-Content -LiteralPath $Cache -Value $Line -Encoding utf8 -NoNewline
