## Causa raiz

O `createCharacter` (e praticamente toda a lógica de jogo) usa `context.supabase` do middleware `requireSupabaseAuth`, ou seja, escreve **como o usuário logado, com RLS ativa**. Mas na migração inicial as tabelas do jogador receberam **apenas policies de `SELECT`** — nunca `INSERT`/`UPDATE`/`DELETE`. Resultado: o insert em `characters` é bloqueado silenciosamente pela RLS e a criação de herói falha.

Tabelas afetadas hoje (só têm SELECT, sem write policies):
`characters`, `expeditions`, `inventory_items`, `currency_transactions`, `orders`, `wallets`, `user_roles`, `raids`, `raid_contributions`, `raid_rewards`, `guilds` (falta INSERT), `guild_members` (falta INSERT/UPDATE), `guild_invites` (falta INSERT), `profiles` (falta INSERT — hoje só o trigger cria).

Bônus encontrado: `characters_name_key` é **UNIQUE global no nome** — dois jogadores nunca poderiam usar o mesmo nome, e o erro genérico apareceria como "falha ao criar herói".

## O que fazer

Uma única migração SQL que:

1. **Adiciona policies de escrita** escopadas por `auth.uid()` para todas as tabelas do jogador. Padrão:
   - `characters`, `expeditions`, `inventory_items`, `currency_transactions`, `orders`, `wallets`, `daily_quests`, `season_progress`, `achievements`, `raid_contributions`, `raid_rewards`: `INSERT/UPDATE/DELETE` só quando `user_id = auth.uid()`.
   - `profiles`: `INSERT` quando `id = auth.uid()` (o trigger `handle_new_user` roda como SECURITY DEFINER e não precisa, mas evita surpresas futuras).
   - `guilds`: `INSERT` autenticado (leader_id = auth.uid()); `UPDATE`/`DELETE` já cobertos pelo policy do líder.
   - `guild_members`: `INSERT` do próprio usuário (`user_id = auth.uid()`); `UPDATE` do líder da guilda.
   - `guild_invites`: `INSERT` por membro/líder da guilda; `DELETE` pelo convidado (já existe).
   - `chat_messages`: já OK.
   - `user_roles`, `admin_audit_logs`: **sem** policies de escrita para usuários — só service_role (mantém segurança; o bootstrap admin e o `handle_new_user` já usam SECURITY DEFINER / admin client).

2. **Remove o UNIQUE global de `characters.name`** e o substitui por unique parcial por usuário (`UNIQUE (user_id, name)`), permitindo que jogadores diferentes usem nomes iguais. O `createCharacter` continua validando comprimento/regex.

3. **Melhora a mensagem de erro** em `createCharacter` para converter violação de policy/unique em um texto amigável ("Nome já usado por você" / "Você já possui um herói ativo").

Nenhuma mudança de UI é necessária — o fluxo atual (`/jogo` → botão "Criar herói" → `/jogo/novo`) volta a funcionar assim que a RLS de INSERT existir.

## Verificação

Depois de aplicar: entrar como usuário logado, ir em `/jogo/novo`, escolher classe, dar nome, clicar "Iniciar jornada". Herói é criado e a rota redireciona para `/jogo/arena`. Confirmar também que uma expedição pode ser iniciada (mesmo bug de RLS afetaria `expeditions.insert`).
