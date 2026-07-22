# Instalação de Plugins do Claude Code — Caveman + QMD + Frontend Design

Tutorial para replicar a instalação dos plugins **caveman** (compressão de tokens) e **qmd** (busca local em markdown) em outros PCs, mais o hook `SessionStart` que carrega as duas skills automaticamente toda sessão.

## Pré-requisitos

- **Claude Code** instalado (CLI `claude` no PATH).
- **Node.js** ≥ 22 no PATH (`node --version` deve responder). O QMD declara `engines.node >=22`.
- **Git Bash** (já vem com Git for Windows) — o hook usa `shell: bash`.
- **Bun** no PATH — o `bin/qmd` detecta `bun.lock` no plugin e tenta executar via `bun`. Sem ele: `error: exec: bun: not found`.

Instalar Bun (escolher um):

```bash
npm install -g bun
# ou (PowerShell):
# irm bun.sh/install.ps1 | iex
```

Verificar:

```bash
bun --version
```

## 1. Instalar o Caveman

Plugin de compressão de tokens (~75% menos verbosidade na resposta).

```bash
claude plugin marketplace add JuliusBrussee/caveman
claude plugin install caveman@caveman
```

Verifica:

```bash
claude plugin list
```

Deve aparecer `caveman@caveman`.

## 2. Instalar o QMD

Busca local em markdown (BM25 + semântica), expõe MCP server.

```bash
claude plugin marketplace add tobi/qmd
claude plugin install qmd@qmd
```

Verifica:

```bash
claude plugin list
```

Deve aparecer `qmd@qmd`.

### 2.1. Buildar o QMD (versão atual do plugin vem source-only)

O plugin `qmd@0.1.0` no marketplace **não inclui o diretório `dist/`** — só o código TypeScript. Sem build, ao rodar `qmd status` aparece:

```
error: Module not found "C:/Users/<user>/.claude/plugins/cache/qmd/qmd/0.1.0/dist/cli/qmd.js"
```

Fix: instalar dependências e buildar dentro da pasta do cache do plugin.

```bash
cd "C:/Users/<usuario>/.claude/plugins/cache/qmd/qmd/0.1.0"
bun install                    # ~3 min — baixa native deps (better-sqlite3, node-llama-cpp)
bun run build                  # tsc + prepend de shebang
```

**Atenção (Windows / Git Bash):** o script `build` do `package.json` usa `cat - dist/cli/qmd.js`. Em Git Bash o `cat` rejeita `-` como flag e o build falha com:

```
cat: illegal option --
```

Mesmo com o erro, o `tsc` já produziu `dist/cli/qmd.js`. Basta prepender o shebang manualmente:

```bash
cd "C:/Users/<usuario>/.claude/plugins/cache/qmd/qmd/0.1.0/dist/cli"
rm -f qmd.tmp
(printf '#!/usr/bin/env node\n'; cat qmd.js) > qmd.new && mv qmd.new qmd.js
chmod +x qmd.js
head -1 qmd.js                 # deve mostrar  #!/usr/bin/env node
```

Validar:

```bash
qmd status
```

Deve listar `Index`, `Documents`, `Models` etc. Se ainda falhar com `Module not found`, repetir o passo de prepend.

## 3. Configurar o Hook `SessionStart`

Faz o Claude carregar as duas SKILL.md como contexto a cada sessão — sem precisar digitar `/caveman` toda vez e sem esquecer de usar o qmd.

Abrir o `settings.json` do Claude (caminho global do usuário):

- **Windows**: `C:\Users\<seu-usuário>\.claude\settings.json`
- **macOS/Linux**: `~/.claude/settings.json`

Adicionar o bloco `hooks` no nível raiz do JSON (mesmo nível de `model`, `permissions`, etc.). Se já houver `hooks`, mesclar dentro do array `SessionStart`:

```json
"hooks": {
  "SessionStart": [
    {
      "hooks": [
        {
          "type": "command",
          "shell": "bash",
          "command": "node -e \"const fs=require('fs');const p=require('path');function L(b,r){const v=fs.readdirSync(b).filter(d=>fs.statSync(p.join(b,d)).isDirectory()).sort();return v.length?fs.readFileSync(p.join(b,v[v.length-1],r),'utf8'):''}const cm=L('C:/Users/Marciano/.claude/plugins/cache/caveman/caveman','plugins/caveman/skills/caveman/SKILL.md');const qm=L('C:/Users/Marciano/.claude/plugins/cache/qmd/qmd','skills/qmd/SKILL.md');const ctx=['# caveman skill',cm,'# qmd skill',qm].join('\\n\\n');process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'SessionStart',additionalContext:ctx}}))\""
        }
      ]
    }
  ]
}
```

> **IMPORTANTE — adaptar o caminho ao usuário do PC novo.**
>
> O comando tem `C:/Users/Marciano/...` hardcoded em dois lugares (caveman e qmd). Trocar `Marciano` pelo username do PC, ou usar variável de ambiente:
>
> ```js
> const home = require('os').homedir().replace(/\\/g,'/');
> const cm = L(home + '/.claude/plugins/cache/caveman/caveman', '...');
> ```
>
> Versão portável da `command` (já com `homedir()`):
>
> ```json
> "command": "node -e \"const fs=require('fs');const p=require('path');const h=require('os').homedir().replace(/\\\\\\\\/g,'/');function L(b,r){const v=fs.readdirSync(b).filter(d=>fs.statSync(p.join(b,d)).isDirectory()).sort();return v.length?fs.readFileSync(p.join(b,v[v.length-1],r),'utf8'):''}const cm=L(h+'/.claude/plugins/cache/caveman/caveman','plugins/caveman/skills/caveman/SKILL.md');const qm=L(h+'/.claude/plugins/cache/qmd/qmd','skills/qmd/SKILL.md');const ctx=['# caveman skill',cm,'# qmd skill',qm].join('\\n\\n');process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'SessionStart',additionalContext:ctx}}))\""
> ```

## 4. Validar settings.json

Antes de reiniciar, conferir que o JSON ficou válido:

```bash
node -e "JSON.parse(require('fs').readFileSync('C:/Users/<usuario>/.claude/settings.json','utf8'))"
```

Sem output = JSON válido. Se erro, há vírgula faltando ou aspas/escape mal fechado.

## 5. Restart do Claude Code

`SessionStart` só dispara em sessão nova. Fechar e reabrir o Claude (ou abrir nova sessão).

Conferir após restart:

- `/hooks` — deve listar o hook `SessionStart`.
- `/mcp` — deve listar o MCP server `qmd` ativo.
- O Claude responde no estilo caveman desde o primeiro turno (sem precisar `/caveman`).

## 6. Indexar conteúdo no QMD

QMD precisa de coleção + embeddings pra busca semântica. As **extensões indexadas** são definidas pelo glob `--pattern` no `qmd collection add`. **Sem `--pattern` o default é só markdown (`.md`).**

### 6.1 Decidir QUAIS extensões indexar (antes de criar a coleção)

Pergunta-chave: **quais tipos de arquivo você quer poder buscar?** O pattern monta a partir disso — formato `**/*.{ext1,ext2,...}` (sem ponto, separado por vírgula, sem espaço).

| Caso de uso | Extensões | `--pattern` |
|---|---|---|
| Só notas / docs | `md` | `**/*.md` |
| Projeto .NET | `md,cs,cshtml,html,css,js` | `**/*.{md,cs,cshtml,html,css,js}` |
| + SQL / config | acrescentar `sql,json,xml,yml` | `**/*.{md,cs,cshtml,html,css,js,sql,json,xml,yml}` |
| Front pesado | `md,ts,tsx,js,jsx,css,scss,html` | `**/*.{md,ts,tsx,js,jsx,css,scss,html}` |

> Regra: **mais extensões = índice maior + `qmd embed` mais lento**. Indexar só o que você realmente busca. Ver o que uma coleção já usa: `qmd collection list` (mostra `Pattern:` e `Ignore:`).

Pastas/arquivos a **excluir** vão em `.qmdignore` na raiz da pasta indexada (ex.: `**/bin/**`, `**/obj/**`, `**/node_modules/**`, `**/*.min.js`). O `collection add` também aceita `--ignore`.

### 6.2 Criar a coleção com AS SUAS extensões

```bash
# trocar o {…} pelas extensões escolhidas em 6.1
qmd collection add <caminho-pasta> --name <nome> --pattern "**/*.{md,cs,cshtml,html,css,js}"
qmd embed
qmd status
```

Exemplo — indexar este repo inteiro com código + docs (set React/TS):

```bash
qmd collection add "C:/Users/<usuario>/source/repos/idle-aetherfall-chronicles" --name aetherfall --pattern "**/*.{md,ts,tsx,js,jsx,css,html}"
qmd embed
```

> Trocar extensões depois? `qmd collection remove <nome>` + adicionar de novo com o novo `--pattern`, depois `qmd embed` reindexa.

**Primeira execução de `qmd embed` baixa os modelos GGUF para `~/.cache/qmd/models/`:**

- Embedding (`embeddinggemma-300M-Q8_0.gguf`) — ~334 MB
- Reranker (`Qwen3-Reranker-0.6B-Q8_0.gguf`) — baixado on-demand
- Geração (`qmd-query-expansion-1.7B`) — baixado on-demand

Download é serial e pode levar **5–10 minutos** dependendo da banda. Depois o embedding em si é rápido (centenas de chunks/min em CPU).

Validar:

```bash
qmd status                                          # mostra "Vectors: N embedded"
qmd query "como autenticar usuario" -c aetherfall   # busca híbrida (BM25 + vetor + rerank)
qmd search "CombatStage" -c aetherfall              # só BM25, sem rerank
```

Adicionar mais coleções depois:

```bash
qmd collection add "C:/Users/<usuario>/source/repos/idle-aetherfall-chronicles/Obsidian Aetherfall" --name obsidian --pattern "**/*.md"
qmd embed
```

## 7. Instalar o Frontend Design (HTML/CSS — plugin oficial Anthropic)

Plugin **oficial** da Anthropic para construir/revisar frontend com qualidade de design (React/Vue/Svelte + HTML/CSS puro). Vem como **Skill** (`frontend-design:frontend-design`) — sem hook, sem build, sem Bun. Mais simples que o QMD.

O marketplace oficial `claude-plugins-official` **já vem disponível** no Claude Code — NÃO precisa `marketplace add`.

Instalar (no REPL do Claude):

```
/plugin install frontend-design@claude-plugins-official
/reload-plugins
```

Ou via CLI:

```bash
claude plugin install frontend-design@claude-plugins-official
```

Verificar:

```bash
claude plugin list
```

Deve aparecer `frontend-design@claude-plugins-official`. A skill fica disponível como `frontend-design:frontend-design`.

**Uso:** ativa automaticamente quando você pede pra construir um componente/página/UI, ou invoca `/frontend-design`. NÃO precisa de hook `SessionStart` — é skill padrão, o Claude carrega quando relevante. `/reload-plugins` aplica sem reiniciar a sessão.

## Gotchas críticos do QMD (descobertos em produção — 2026-06)

Três armadilhas que custaram horas de debug. Ler antes de "consertar" um índice que parece fantasma.

### Gotcha #1 — o MCP lê um índice DIFERENTE do CLI (`XDG_CACHE_HOME=C:\tmp`)

**O Claude Code lança o MCP server do qmd com `XDG_CACHE_HOME` apontando para `C:\tmp\.cache`.** O qmd resolve o caminho do banco assim: `XDG_CACHE_HOME ? resolve(XDG_CACHE_HOME,"qmd") : resolve(homedir(),".cache","qmd")`. Resultado:

| Quem roda | `XDG_CACHE_HOME` | Banco usado |
|---|---|---|
| **MCP** (dentro do Claude) | `C:\tmp\.cache` | `C:\tmp\.cache\qmd\index.sqlite` |
| **CLI** (terminal/Git Bash normal) | vazio | `C:\Users\<user>\.cache\qmd\index.sqlite` |

> A config das coleções (`index.yml`) é resolvida por **HOME** (não por XDG_CACHE_HOME), então fica em `~/.config/qmd/index.yml` e é **compartilhada** pelos dois. Por isso o MCP "conhece" as coleções mas lê os documentos/vetores de um db diferente.

**Consequência crítica:** rodar `qmd update` / `qmd embed` num terminal normal **NÃO atualiza o índice que o MCP serve** — escreve no db de `C:\Users`, enquanto o MCP continua lendo o de `C:\tmp`. Foi exatamente isso que fez um índice parcial/velho (119 docs, data antiga) sobreviver a deletes, kills e reindexações: estávamos mexendo no db errado o tempo todo.

**Reindexar o db que o MCP realmente lê** — exportar o mesmo `XDG_CACHE_HOME`:

```bash
XDG_CACHE_HOME='C:\tmp\.cache' qmd update    # reindexa arquivos no db do MCP
XDG_CACHE_HOME='C:\tmp\.cache' qmd embed     # gera vetores no db do MCP
XDG_CACHE_HOME='C:\tmp\.cache' qmd status    # confere a contagem que o MCP vai servir
```

**Localizar TODOS os índices no disco** (descobre o split na hora):

```bash
powershell.exe -NoProfile -Command "Get-ChildItem C:\ -Recurse -Filter index.sqlite -Force -ErrorAction SilentlyContinue | Select-Object FullName,@{n='MB';e={[math]::Round(\$_.Length/1MB,1)}},LastWriteTime | Format-Table -AutoSize"
```

Dois `index.sqlite` com tamanhos diferentes (ex.: 4 MB em `C:\tmp` vs 163 MB em `C:\Users`) = split confirmado. Atalho sem re-embed (30 min): **copiar** o db cheio por cima do fantasma — sqlite do qmd guarda paths absolutos do repo, é portável entre os HOMEs:

```bash
cp -v "C:/Users/<user>/.cache/qmd/index.sqlite" "C:/tmp/.cache/qmd/index.sqlite"
```

### Gotcha #2 — o índice NÃO atualiza sozinho

O SKILL sugere auto-update após commit/pull/push, mas na prática o índice fica **preso na data do último `qmd embed`/`update` manual**. Sintoma: `qmd status` mostra contagem baixa (ex.: 119 de 1876 arquivos do repo) e `lastUpdated` de semanas/meses atrás. Não é db corrompido nem fantasma — é índice **parcial/velho**. Fix: `qmd update && qmd embed` (no env certo do Gotcha #1).

Conferir se a contagem bate com a realidade do repo:

```bash
# Quantos arquivos o pattern do index.yml deveria indexar (menos ignores)
find . -type f \( -name "*.md" -o -name "*.cs" -o -name "*.cshtml" -o -name "*.html" -o -name "*.css" -o -name "*.js" \) \
  -not -path "*/bin/*" -not -path "*/obj/*" -not -path "*/Migrations/*" \
  -not -path "*/wwwroot/lib/*" -not -path "*/.claude/*" 2>/dev/null | wc -l
```

### Gotcha #3 — DOIS qmd instalados (plugin + global npm); só o global funciona

O `qmd` empacotado no plugin (`~/.claude/plugins/cache/qmd/qmd/0.1.0`) costuma ficar **sem o binário nativo compilado** — falta `node_modules/better-sqlite3/build/Release/better_sqlite3.node`. Rodar o bin do plugin direto dá:

```
Error: Could not locate the bindings file. Tried:
 → .../better-sqlite3/build/Release/better_sqlite3.node
```

O que realmente funciona é o **global npm** (tem native build), instalado à parte:

```bash
npm install -g @tobilu/qmd
```

O MCP chama `qmd` **bare** (`marketplace.json` → `mcpServers: { qmd: { command: "qmd", args: ["mcp"] } }`); o PATH resolve pro global. Por isso:

- **NÃO desinstalar o global** — é o engine que funciona.
- **NÃO remover o plugin** — é ele que **registra o MCP server**. Sem o plugin, o `qmd` MCP some do Claude.
- Os dois coexistem **por design**, não é redundância. (Isso torna o passo 2.1 "buildar o plugin" opcional/secundário na prática — o global resolve.)

Confirmar qual roda: `which qmd` → deve apontar `AppData/Roaming/npm/qmd`; `qmd --version` → `2.1.0`.

### Restart do MCP de verdade (reconnect não reinicia o processo)

`/mcp` reconnect só **reata o transporte** ao processo node que já roda — não relê o db. Pra forçar releitura (após reindex/cópia), **matar o node** e reconectar:

```bash
powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { \$_.Name -eq 'node.exe' -and \$_.CommandLine -match 'qmd' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }"
```

Depois `/mcp` reconnect no REPL. Atenção: matar o node **enquanto um `qmd embed` roda no db de `C:\tmp`** evita briga de lock — reindexe com o MCP desconectado.

## Troubleshooting

| Sintoma | Causa provável | Fix |
|---|---|---|
| `claude plugin: command not found` | Claude Code antigo | Atualizar Claude Code (`claude update`) |
| `node: command not found` no hook | Node fora do PATH | Reinstalar Node ou ajustar PATH do sistema |
| Hook não dispara | Settings watcher não recarregou | Abrir `/hooks` uma vez, ou reiniciar Claude |
| `EACCES` ao instalar plugin | Sem permissão no `~/.claude` | Rodar shell como admin uma vez |
| `additionalContext` não aparece | JSON do hook malformado | Rodar validação do passo 4 |
| `qmd ... exec: bun: not found` | Bun ausente | Instalar Bun (passo Pré-requisitos) |
| `qmd ... Module not found ".../dist/cli/qmd.js"` | Plugin source-only, sem build | Rodar passo 2.1 (build) |
| `cat: illegal option --` no `bun run build` | `cat -` não funciona em Git Bash | Já esperado — fazer prepend manual do shebang (passo 2.1) |
| `qmd embed` trava em "Gathering information" | Download de modelo bloqueado por firewall/proxy | Verificar acesso a `huggingface.co`; tentar novamente |
| `qmd query` retorna 0 hits | Coleção sem vetores | Rodar `qmd embed`; conferir `Vectors: N embedded` em `qmd status` |
| `qmd status` no terminal mostra 1876 docs mas o MCP serve 119 | MCP usa db em `C:\tmp` (XDG_CACHE_HOME); CLI usa `~/.cache` — bancos diferentes | Reindexar com `XDG_CACHE_HOME='C:\tmp\.cache'` ou copiar o db cheio (Gotcha #1) |
| Índice fantasma sobrevive a delete/kill/reindex | Deletando/reindexando o db de `C:\Users` enquanto o MCP lê o de `C:\tmp` | Mexer no db de `C:\tmp` (Gotcha #1); achar todos com o `Get-ChildItem ... index.sqlite` |
| MCP serve contagem antiga mesmo após reindex correto | `/mcp` reconnect não reinicia o processo node | Matar o node qmd + `/mcp` reconnect (seção "Restart do MCP de verdade") |
| `Could not locate the bindings file` (`better_sqlite3.node`) | qmd do plugin sem native build | Usar o global npm: `npm install -g @tobilu/qmd` (Gotcha #3) |
| `qmd status` mostra `lastUpdated` de meses atrás | Índice não auto-atualiza; parcial/velho | `qmd update && qmd embed` no env do MCP (Gotchas #1 e #2) |

## Desinstalar

```bash
claude plugin uninstall caveman@caveman
claude plugin uninstall qmd@qmd
claude plugin uninstall frontend-design@claude-plugins-official
claude plugin marketplace remove caveman
claude plugin marketplace remove qmd
# (frontend-design não tem marketplace remove — claude-plugins-official é built-in)
```

E remover o bloco `hooks.SessionStart` do `settings.json` se quiser limpar.

## Referências

- caveman: https://github.com/JuliusBrussee/caveman
- qmd: https://github.com/tobi/qmd
- frontend-design (oficial): https://claude.com/plugins/frontend-design — marketplace `anthropics/claude-plugins-official`
- Claude Code hooks: docs oficiais → SessionStart event, `hookSpecificOutput.additionalContext`.
