# Instalação do RTK (Rust Token Killer) no Claude Code — Windows

RTK é um **proxy de CLI** que filtra/comprime a saída de comandos antes de chegar no contexto do LLM (economia de 60-90% de tokens em operações de dev). Integra no Claude Code via **hook `PreToolUse` no Bash** — reescreve `git status` → `rtk git status` de forma transparente.

Repo: https://github.com/rtk-ai/rtk

## Limitações importantes (ler antes)

- O hook **só intercepta o Bash tool**. Ferramentas nativas (`Read`, `Grep`, `Glob`) e **MCP tools** (ex.: `mcp__qmd__*`) **não passam** pelo hook → RTK não toca nelas.
- **Windows nativo = suporte limitado** (o `install.sh` oficial não suporta Windows; só Linux/macOS). Funciona via binário pré-built + Git Bash. Para suporte completo, o projeto recomenda **WSL**.
- O hook carrega **no início da sessão** → depois de instalar, **reiniciar o Claude Code**.

## Pré-requisitos

- **Claude Code** instalado (CLI `claude` no PATH).
- **Git Bash** (vem com Git for Windows) — usado p/ baixar/extrair.
- Pasta `~/.local/bin` no PATH (no Windows: `C:\Users\<usuario>\.local\bin`). Já costuma estar, pois o `claude.exe` mora lá.

## 1. Baixar o binário Windows (com verificação de checksum)

Descobrir a versão mais recente e baixar o asset Windows + checksums (Git Bash):

```bash
# versão mais recente
curl -fsSL https://api.github.com/repos/rtk-ai/rtk/releases/latest | grep '"tag_name"'

# trocar VER pela tag retornada (ex.: v0.42.4)
VER=v0.42.4
cd /tmp
curl -fsSL -o rtk.zip "https://github.com/rtk-ai/rtk/releases/download/$VER/rtk-x86_64-pc-windows-msvc.zip"
curl -fsSL -o rtk-checksums.txt "https://github.com/rtk-ai/rtk/releases/download/$VER/checksums.txt"

# conferir checksum (tem que bater)
EXP=$(grep -i 'windows-msvc.zip' rtk-checksums.txt | awk '{print $1}')
ACT=$(sha256sum rtk.zip | awk '{print $1}')
[ "$EXP" = "$ACT" ] && echo "CHECKSUM OK" || echo "MISMATCH — NÃO instalar"
```

## 2. Extrair pro `~/.local/bin` e verificar

```bash
unzip -o /tmp/rtk.zip -d "$HOME/.local/bin"
"$HOME/.local/bin/rtk.exe" --version   # rtk X.Y.Z
command -v rtk                          # tem que resolver o nome 'rtk'
```

Se `command -v rtk` não resolver, `~/.local/bin` não está no PATH — adicionar.

## 3. Registrar o hook no Claude Code

`init` instala o hook + `RTK.md` + referência `@RTK.md` no `~/.claude/CLAUDE.md` + entrada no `settings.json` (faz backup em `settings.json.bak`).

```bash
rtk init -g --show          # mostra o que falta (read-only)
rtk init -g --auto-patch    # aplica sem prompt (non-interactive)
rtk init -g --show          # confirmar: tudo [ok]
```

Resultado esperado do `--show`:

```
[ok] Hook: rtk hook claude (native binary command)
[ok] RTK.md: ...\.claude\RTK.md
[ok] Global (~/.claude/CLAUDE.md): @RTK.md reference
[ok] settings.json: RTK hook configured
```

A entrada criada no `settings.json`:

```json
"PreToolUse": [
  {
    "matcher": "Bash",
    "hooks": [ { "type": "command", "command": "rtk hook claude" } ]
  }
]
```

## 4. Reiniciar o Claude Code

Fechar e reabrir. Hooks só carregam em sessão nova. Testar:

```bash
git status     # roda via rtk transparente
rtk gain       # mostra economia de tokens acumulada
```

## 5. (Opcional) Filtro custom — comprimir saída de um CLI

RTK já tem filtros embutidos (git, ls, npm, grep, wc, ...). Para adicionar um CLI próprio, editar `filters.toml` (user-global):

- Windows: `C:\Users\<usuario>\AppData\Roaming\rtk\filters.toml`

Exemplo — filtro pro CLI do **qmd** (markdown search). ⚠️ Só dispara se `qmd` for chamado **via Bash**; chamadas MCP (`mcp__qmd__*`) não passam pelo hook:

```toml
[filters.qmd]
description = "Compact qmd CLI output"
match_command = "^qmd\\b"
strip_ansi = true
strip_lines_matching = ["^\\s*$"]
max_lines = 60
```

Validar parse rodando qualquer comando que carregue a config:

```bash
rtk git status   # se o toml tiver erro, aparece aqui
```

> **Caveman não dá pra adicionar ao rtk** — caveman é skill/hook/persona, não tem CLI. RTK filtra output de CLI; não há comando pra interceptar.

## 6. Badge `[RTK]` no statusline

Ver `instalar-badges-statusline.md` — a badge `[RTK]` aparece entre `[CAVEMAN]` e `[QMD:...]`.

## Verificação rápida (resumo)

| Check | Comando | Esperado |
|---|---|---|
| Binário | `rtk --version` | `rtk X.Y.Z` |
| No PATH | `command -v rtk` | caminho do rtk |
| Hook | `rtk init -g --show` | linhas `[ok]` |
| Funcionando | `git status` (pós-restart) + `rtk gain` | comando roda + savings > 0 |

## Desinstalar

```bash
rtk init -g --uninstall     # remove hook, RTK.md, @RTK.md, entrada do settings.json
rm "$HOME/.local/bin/rtk.exe"
```

## Referências

- Repo + docs: https://github.com/rtk-ai/rtk
- Custom filters: https://github.com/rtk-ai/rtk#custom-filters
