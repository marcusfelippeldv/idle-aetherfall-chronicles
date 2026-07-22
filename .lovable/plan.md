## Objetivo
Conectar o workspace ao GitHub para que eu consiga ler pull requests e arquivos do repositório `marcusfelippeldv/idle-aetherfall-chronicles` e revisar a contribuição do Marcus.

## Plano

1. **Conectar o GitHub API connector**
   - Usar o conector `github` (já disponível no workspace) e vincular ao projeto.
   - O usuário precisará autorizar o acesso à conta GitHub na tela de OAuth do Lovable.
   - Como o repositório agora é público, o token pode usar escopo mínimo (`public_repo` ou `repo` se houver repos privados futuros).

2. **Listar pull requests abertos**
   - Chamar a API REST do GitHub via connector gateway para listar PRs abertos no repo.
   - Identificar o PR que o Marcus criou para `main`.

3. **Ler diff e arquivos alterados**
   - Obter o diff do PR (`/repos/{owner}/{repo}/pulls/{number}/files`).
   - Ler o conteúdo dos arquivos alterados quando necessário.

4. **Revisar e reportar**
   - Analisar mudanças em relação ao motor idle/combate, RLS, tipos e estrutura do projeto.
   - Apontar riscos, sugestões e aprovação.

## Observação
Essa conexão é do tipo **App connector**: as credenciais ficam disponíveis como variáveis de ambiente no projeto, então só deve ser mantida se o app também for usar a API do GitHub em runtime. Se o objetivo for apenas revisão pontual de PRs, posso fazer a leitura do repo público via API sem vincular o conector ao projeto. Qual caminho prefere?