$ClaudeDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME ".claude" }
$Cache = Join-Path $ClaudeDir ".qmd-statusline-cache"
if (-not (Test-Path $Cache)) { exit 0 }

try {
    $Item = Get-Item -LiteralPath $Cache -Force -ErrorAction Stop
    if ($Item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) { exit 0 }
    if ($Item.Length -gt 256) { exit 0 }
} catch {
    exit 0
}

$Raw = ""
try {
    $Raw = (Get-Content -LiteralPath $Cache -TotalCount 1 -ErrorAction Stop).Trim()
} catch {
    exit 0
}

$Raw = ($Raw -replace '[^a-zA-Z0-9_/\-\.]', '')
if ([string]::IsNullOrEmpty($Raw)) { exit 0 }

$Parts = $Raw.Split('/')
if ($Parts.Length -lt 3) { exit 0 }
$Status = $Parts[2]

$Esc = [char]27
$Color = switch ($Status) {
    "ok"    { "38;5;42" }
    "stale" { "38;5;214" }
    default { "38;5;244" }
}
[Console]::Write("${Esc}[${Color}m[QMD:$Raw]${Esc}[0m")
