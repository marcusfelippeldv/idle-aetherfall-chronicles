
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_currency_tx_user_created ON public.currency_transactions(user_id, created_at DESC);

INSERT INTO public.products (name, slug, description, product_kind, price_cents, currency, premium_amount, active, order_index, metadata)
VALUES
  ('100 Cristais', 'crystals-100', 'Comece com um pequeno pacote de cristais arcanos.', 'premium_pack', 490, 'BRL', 100, true, 1, '{}'::jsonb),
  ('2.800 Cristais', 'crystals-2800', 'Melhor valor. +30% de bônus para heróis dedicados.', 'premium_pack', 7990, 'BRL', 2800, true, 4, '{"bonus_pct": 30}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, product_kind, price_cents, currency, premium_amount, active, order_index, metadata)
SELECT p.name, p.slug, p.description, 'shop_item'::product_kind, 0, 'BRL', p.premium_amount, true, p.order_index, jsonb_build_object('item_id', p.item_id, 'quantity', 1)
FROM (VALUES
  ('Cetro de Aetheril (Bazar)', 'bazar-cetro-aetheril', 'Cetro raro forjado com cristais arcanos.', 250, 10, 'b9937000-e4d5-48a3-8957-3e7582cad8a7'::uuid),
  ('Runa do Alvorecer (Bazar)', 'bazar-runa-alvorecer', 'Acessório lendário. Aumenta o poder do herói.', 900, 11, '5acb2715-bb38-4fc5-bbf8-0723d8ff7bd7'::uuid),
  ('Amuleto Cristalino (Bazar)', 'bazar-amuleto-cristalino', 'Amuleto raro cravejado de cristais.', 150, 12, 'ba500af7-90bc-40b1-86f5-fc2adfe6f808'::uuid)
) AS p(name, slug, description, premium_amount, order_index, item_id)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, product_kind, price_cents, currency, premium_amount, active, order_index, metadata)
SELECT p.name, p.slug, p.description, 'shop_item'::product_kind, 0, 'BRL', 0, true, p.order_index, jsonb_build_object('item_id', p.item_id, 'quantity', 1, 'gold_price', p.gold_price)
FROM (VALUES
  ('Poção Menor de Cura (Mercado)', 'mercado-pocao-menor', 'Consumível básico para reidratar seu herói.', 20, 20, '65f5fbf8-0c46-4464-b85a-323b670069ff'::uuid),
  ('Cristal Bruto (Mercado)', 'mercado-cristal-bruto', 'Material valioso para reforjar equipamentos.', 60, 21, '1aa35327-482a-454f-a34a-d4a7d757b377'::uuid),
  ('Elmo Enferrujado (Mercado)', 'mercado-elmo-enferrujado', 'Um começo humilde para novos heróis.', 30, 22, 'f83db6be-1bc0-4105-825a-f253e4dbd4d8'::uuid)
) AS p(name, slug, description, gold_price, order_index, item_id)
ON CONFLICT (slug) DO NOTHING;
