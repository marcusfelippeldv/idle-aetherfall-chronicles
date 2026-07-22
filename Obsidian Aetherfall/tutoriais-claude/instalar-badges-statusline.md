# Badges Customizadas no Statusline do Claude Code — CAVEMAN + RTK + QMD

Tutorial pra replicar as badges `[RTK]` (proxy de tokens ativo) e `[QMD:coleção/N/status]` (saúde do índice qmd) ao lado da `[CAVEMAN]` no statusline.

Resultado final no rodapé da CLI:

```
[CAVEMAN] [RTK] [QMD:aetherfall/119/ok]
```

- `[CAVEMAN]` laranja — modo de compressão ativo (já vem do plugin caveman).
- `[RTK]` azul — binário rtk instalado (ver `instalar-rtk.md`). Aparece só quando `rtk` está no PATH ou em `~/.local/bin/rtk.exe`.
- `[QMD:...]` verde/âmbar — coleção corrente, total de docs indexados, `ok` ou `stale` (>1h sem reindex).

Scripts prontos em `badges-scripts/` ao lado deste tutorial — copiar direto.

## Pré-requisitos

- Plugins **caveman** + **qmd** já instalados via `claude plugin install` (ver `install-plugins.md`).
- **PowerShell 5.1+** (já vem no Windows 10/11).
- **Node.js** no PATH (já é pré-requisito do qmd).
- **Bun** no PATH (já é pré-requisito do qmd).

## 1. Copiar os scripts para `~/.claude/hooks/`

A pasta `~/.claude/hooks/` é onde os hooks customizados ficam. No Windows: `C:\Users\<usuario>\.claude\hooks\`.

```powershell
$dest = Join-Path $HOME ".claude\hooks"
New-Item -ItemType Directory -Path $dest -Force | Out-Null

# Copiar os scripts deste tutorial — ajustar o source ao caminho do repo
$src = "C:\Users\<usuario>\source\repos\idle-aetherfall-chronicles\Obsidian Aetherfall\tutoriais-claude\badges-scripts"
Copy-Item "$src\qmd-statusline.ps1"          $dest -Force
Copy-Item "$src\qmd-statusline-refresh.ps1"  $dest -Force
Copy-Item "$src\rtk-statusline.ps1"          $dest -Force
Copy-Item "$src\combined-statusline.ps1"     $dest -Force
```

> A badge `[RTK]` exige o binário rtk instalado (`instalar-rtk.md`). Sem ele, o `combined-statusline.ps1` simplesmente pula a badge — não quebra nada.

Conferir:

```powershell
Get-ChildItem $HOME\.claude\hooks\*.ps1 | Select-Object Name
```

Deve listar os 3 arquivos.

### O que cada script faz

| Script | Papel |
|---|---|
| `combined-statusline.ps1` | Entrada do `statusLine`. Chama `caveman-statusline.ps1` do plugin, depois `rtk-statusline.ps1`, depois `qmd-statusline.ps1`. Adiciona espaço entre badges não-vazias. |
| `rtk-statusline.ps1` | Renderiza `[RTK]` azul (ANSI 39) só se `rtk` estiver no PATH ou em `~/.local/bin/rtk.exe`. Sem chamar rtk — só checa presença. |
| `qmd-statusline.ps1` | Lê `~/.claude/.qmd-statusline-cache` e renderiza `[QMD:...]` colorido. Não chama qmd — só lê o cache. |
| `qmd-statusline-refresh.ps1` | Roda `bun qmd status`, parseia coleção/contagem/idade do índice, escreve cache. Lento (~1-2s) — roda em background. |

Cache vive em `~/.claude/.qmd-statusline-cache` (texto cru, formato `coll/N/status`).

## 2. Atualizar `settings.json`

Abrir `C:\Users\<usuario>\.claude\settings.json`.

### 2.1 Apontar `statusLine` para o wrapper combinado

Substituir o `statusLine.command` (que provavelmente aponta direto para `caveman-statusline.ps1` do plugin) pelo wrapper:

```json
"statusLine": {
  "type": "command",
  "command": "powershell -ExecutionPolicy Bypass -File \"C:\\Users\\<usuario>\\.claude\\hooks\\combined-statusline.ps1\""
}
```

> Trocar `<usuario>` pelo username real. O `combined-statusline.ps1` resolve o plugin caveman dinamicamente via `Get-ChildItem` — sobrevive a updates de versão sem editar nada.

### 2.2 Adicionar hook de refresh

Dentro de `hooks`, no array `SessionStart` (criar se não existir), acrescentar item novo. Se já existir o hook bash do `install-plugins.md`, manter — só somar:

```json
"hooks": {
  "SessionStart": [
    {
      "hooks": [
        // ... entrada existente do hook bash do install-plugins.md ...
        {
          "type": "command",
          "command": "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','C:\\Users\\<usuario>\\.claude\\hooks\\qmd-statusline-refresh.ps1' -WindowStyle Hidden\""
        }
      ]
    }
  ]
}
```

> **Por que `Start-Process -WindowStyle Hidden`?** Hooks rodam síncronos — bloqueariam o início da sessão (refresh do qmd ~1-2s). `Start-Process` dispara um processo PowerShell desanexado e retorna imediatamente. O cache atualiza alguns segundos depois e o statusline reflete na próxima tecla.

### 2.3 Validar JSON

```powershell
node -e "JSON.parse(require('fs').readFileSync($env:USERPROFILE + '/.claude/settings.json','utf8'))"
```

Sem output = válido.

## 3. Primeira execução manual (popular cache)

Hooks só rodam em sessão nova. Pra ver a badge agora:

```powershell
& "$HOME\.claude\hooks\qmd-statusline-refresh.ps1"
Get-Content "$HOME\.claude\.qmd-statusline-cache"
```

Saída esperada:

```
aetherfall/119/ok
```

Testar render combinado:

```powershell
& "$HOME\.claude\hooks\combined-statusline.ps1"
```

Deve imprimir as 2 badges com cores ANSI.

## 4. Restart do Claude Code

Fechar e reabrir. As badges aparecem no rodapé. Em sessão nova:

- `SessionStart` dispara → refresh em background → cache atualiza.
- Statusline relê cache em todo redraw (toda tecla) — sem latência.

## 5. Convenções de cor — `[QMD:...]`

| Status | Cor (ANSI 256) | Quando |
|---|---|---|
| `ok` | verde 42 | índice atualizado nos últimos minutos |
| `stale` | âmbar 214 | última atualização foi `Xh ago` ou `Xd ago` |
| outro | cinza 244 | fallback |

## 6. Personalizações

### Trocar cores

Editar o `switch` em `qmd-statusline.ps1` (QMD) ou a linha `[Console]::Write` em `rtk-statusline.ps1` (`[RTK]`, hoje azul `38;5;39`). Códigos: `38;5;<N>` onde `<N>` é índice 0-255 da paleta ANSI ([tabela](https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit)).

### Trocar formato

`qmd-statusline.ps1` linha final:

```powershell
[Console]::Write("${Esc}[${Color}m[QMD:$Raw]${Esc}[0m")
```

Pode virar `📚 $Raw` ou só `Q:$Count` etc. Cuidar com largura — statusline corta se passar de ~120 chars.

### Desligar a badge

Apagar o cache:

```powershell
Remove-Item "$HOME\.claude\.qmd-statusline-cache"
```

`combined-statusline.ps1` só renderiza badge se o cache existir.

## Troubleshooting

| Sintoma | Causa | Fix |
|---|---|---|
| Statusline some inteiro | `combined-statusline.ps1` com erro de parse | Rodar manualmente: `& "$HOME\.claude\hooks\combined-statusline.ps1"` — vai mostrar erro. |
| `[CAVEMAN]` aparece mas `[QMD]` não | Cache nunca foi populado | Rodar refresh manual (passo 3). Se cache continua vazio, ver linhas a seguir. |
| `qmd-statusline-refresh.ps1` não popula cache | `bun` ou `dist/cli/qmd.js` ausentes | Conferir com `bun --version` e `Get-ChildItem $HOME\.claude\plugins\cache\qmd\qmd\*\dist\cli\qmd.js`. Se faltar, voltar ao tutorial `install-plugins.md` passo 2.1. |
| `[QMD]` fica em `stale` permanente | `qmd embed` não rodou recentemente | `qmd embed` no diretório do projeto. |
| Refresh trava sessão ao iniciar | Esqueceu `Start-Process -WindowStyle Hidden` no JSON | Conferir que o JSON tem exatamente a string `Start-Process powershell -ArgumentList ...`. |

## Desinstalar

```powershell
# Remover scripts
Remove-Item "$HOME\.claude\hooks\qmd-statusline*.ps1"
Remove-Item "$HOME\.claude\hooks\rtk-statusline.ps1" -ErrorAction SilentlyContinue
Remove-Item "$HOME\.claude\hooks\combined-statusline.ps1"

# Remover cache
Remove-Item "$HOME\.claude\.qmd-statusline-cache" -ErrorAction SilentlyContinue
```

E reverter `settings.json`:

- `statusLine.command` → voltar a apontar para `caveman-statusline.ps1` do plugin (ou remover bloco).
- Remover o item novo de `SessionStart`.

## Referências

- Claude Code statusLine: docs oficiais → setting `statusLine.command`.
- Claude Code hooks: evento `SessionStart`.
- ANSI 256-color codes: https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
