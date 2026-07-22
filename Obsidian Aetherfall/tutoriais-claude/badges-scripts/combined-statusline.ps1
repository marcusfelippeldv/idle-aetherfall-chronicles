$ClaudeDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME ".claude" }

$CavBase = Join-Path $ClaudeDir "plugins/cache/caveman/caveman"
$CavWrote = $false
if (Test-Path $CavBase)
{
    $CavVer = Get-ChildItem -LiteralPath $CavBase -Directory -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -ne $CavVer)
    {
        $CavScript = Join-Path $CavVer.FullName "hooks/caveman-statusline.ps1"
        if (Test-Path $CavScript)
        {
            & $CavScript
            $CavWrote = $true
        }
    }
}

$Wrote = $CavWrote

# RTK badge — between caveman and qmd. Gated on rtk being installed so we never
# emit a stray separator when it's absent.
$RtkScript = Join-Path $ClaudeDir "hooks/rtk-statusline.ps1"
$RtkExe = Join-Path $HOME ".local/bin/rtk.exe"
$RtkActive = ($null -ne (Get-Command rtk -ErrorAction SilentlyContinue)) -or (Test-Path $RtkExe)
if ((Test-Path $RtkScript) -and $RtkActive)
{
    if ($Wrote) { [Console]::Write(" ") }
    & $RtkScript
    $Wrote = $true
}

$QmdScript = Join-Path $ClaudeDir "hooks/qmd-statusline.ps1"
$QmdCache = Join-Path $ClaudeDir ".qmd-statusline-cache"
if ((Test-Path $QmdScript) -and (Test-Path $QmdCache))
{
    if ($Wrote) { [Console]::Write(" ") }
    & $QmdScript
    $Wrote = $true
}
