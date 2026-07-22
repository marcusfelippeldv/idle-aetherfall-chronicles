# Etapa 3 — Economia

Objetivo: transformar a `wallet` num sistema econômico completo, com loja de pacotes de cristais pagos, gasto de cristais/ouro em itens do jogo, e um extrato transparente de tudo que entra e sai.

## O que o jogador vai poder fazer

1. **Comprar cristais com dinheiro real** via Stripe Checkout (BRL). Pacotes: 100, 550 (+10%), 1200 (+20%), 2800 (+30%) cristais.
2. **Trocar cristais por itens** no bazar arcano (potências raras/épicas, poções, pergaminhos de XP, slots de expedição extra).
3. **Trocar ouro por consumíveis básicos** (poções, materiais).
4. **Ver o extrato** completo (créditos e débitos) de ouro e cristais na aba "Carteira".

## Fluxo de pagamento (Stripe)

```text
Jogador clica "Comprar" → server fn cria Checkout Session (metadata: user_id, product_id)
                        → grava order (status: pending)
                        → retorna URL do Stripe
Jogador paga no Stripe  → Stripe envia webhook checkout.session.completed
Webhook /api/public/webhooks/stripe → verifica assinatura HMAC
                                    → marca order paid + delivered_at
                                    → credita wallet.premium_balance
                                    → grava currency_transactions (kind=credit, source=purchase)
Cliente volta para /jogo/loja?success=1 → toast "Cristais creditados"
```

Stripe será habilitado via ferramenta oficial (o segredo do webhook vira variável de ambiente do backend). Sem Stripe configurado, a loja mostra os pacotes mas o botão de compra fica desabilitado com aviso.

## Ações desta etapa

### Banco de dados (1 migração)
- Ampliar `product_kind` para incluir `consumable`, `equipment`, `booster`.
- Popular `products` com: 4 pacotes de cristais (kind=`premium_pack`) + 6 itens da loja arcana (kind=`equipment`/`consumable`, preço em cristais via `premium_amount`) + 4 itens da loja comum (preço em ouro via `metadata.gold_price`).
- Índice em `orders(user_id, created_at desc)` e `currency_transactions(user_id, created_at desc)`.

### Server functions (`src/lib/store.functions.ts`, `wallet.functions.ts`)
- `listStoreCatalog()` — retorna pacotes de cristais, loja arcana e loja de ouro separadamente.
- `purchaseWithCurrency({ productId })` — autenticada. Débita ouro ou cristais, entrega o item (INSERT em `inventory_items`), grava `currency_transactions`. Toda a lógica no servidor.
- `createCheckoutSession({ productId })` — cria Stripe Checkout, grava order pending, retorna URL.
- `getMyOrders()` — histórico de compras reais.
- `getMyTransactions({ currency })` — extrato paginado.

### Server route (`src/routes/api/public/webhooks/stripe.ts`)
- Verifica assinatura Stripe.
- Marca order como paga, credita wallet, insere transação. Idempotente por `provider_order_id`.

### UI
- **Nova rota `/jogo/loja`** com 3 abas: "Cristais" (pacotes reais), "Bazar Arcano" (gasta cristais), "Mercado" (gasta ouro).
- **Nova rota `/jogo/carteira`** com extrato de transações e histórico de pedidos.
- **`/jogo/arena`**: novo item no menu de abas "Loja" que leva para `/jogo/loja`; header já mostra saldos.
- **Admin `/admin/loja`**: listagem de produtos e pedidos recentes (somente leitura nesta etapa).

## Segurança
- Todo cálculo de saldo e entrega de item roda no servidor (`requireSupabaseAuth` + validação Zod).
- Débito e crédito em uma única transação lógica (leitura → validação → update wallet → insert transaction → insert inventory) usando `context.supabase` sob RLS.
- Webhook do Stripe verifica assinatura HMAC antes de qualquer escrita; usa `supabaseAdmin` só dentro do handler.
- RLS já existente em `orders`, `products`, `currency_transactions` mantida; nenhuma escrita direta do cliente.

## Detalhes técnicos
- Preços em cristais ficam em `products.premium_amount`; preços em ouro em `products.metadata.gold_price` (evita nova coluna).
- `product_kind = 'premium_pack'` → dispara fluxo Stripe. Demais kinds → fluxo `purchaseWithCurrency`.
- Stripe SDK importado dinamicamente dentro do handler para não vazar no bundle client.
- Se o usuário não tiver Stripe habilitado ainda, sinalizo antes de criar o webhook para você aprovar.

## Fora do escopo desta etapa
- Reembolso automático, códigos promocionais, assinaturas mensais (ficam para depois).
- Presentes entre jogadores (Etapa 5 — social).
