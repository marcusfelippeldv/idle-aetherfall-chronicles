
-- 1. Colunas novas em items
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS sell_price integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buyable boolean NOT NULL DEFAULT false;

UPDATE public.items SET sell_price = GREATEST(1, gold_value / 2) WHERE sell_price = 0;
UPDATE public.items SET buyable = true WHERE rarity IN ('comum','incomum');

-- 2. Slots de equipamento no personagem
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS equipped_arma uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipped_ofmao uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipped_elmo uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipped_peito uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipped_pernas uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipped_pes uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipped_amuleto uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipped_anel uuid REFERENCES public.inventory(id) ON DELETE SET NULL;

-- 3. Trigger de validação: item pertence ao dono e slot bate com a coluna, sem duplicar entre slots.
CREATE OR REPLACE FUNCTION public.tg_validate_equipment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  slot_col text;
  inv_id uuid;
  inv_user uuid;
  inv_slot item_slot;
  ids uuid[];
BEGIN
  FOREACH slot_col IN ARRAY ARRAY['arma','ofmao','elmo','peito','pernas','pes','amuleto','anel']
  LOOP
    EXECUTE format('SELECT ($1).equipped_%I', slot_col) INTO inv_id USING NEW;
    IF inv_id IS NOT NULL THEN
      SELECT inv.user_id, it.slot INTO inv_user, inv_slot
        FROM public.inventory inv
        JOIN public.items it ON it.id = inv.item_id
       WHERE inv.id = inv_id;
      IF inv_user IS NULL THEN
        RAISE EXCEPTION 'Item de inventário % não existe', inv_id;
      END IF;
      IF inv_user <> NEW.user_id THEN
        RAISE EXCEPTION 'Item de inventário não pertence ao dono do herói';
      END IF;
      IF inv_slot::text <> slot_col THEN
        RAISE EXCEPTION 'Item de inventário tem slot % e não pode ir em %', inv_slot, slot_col;
      END IF;
    END IF;
  END LOOP;

  ids := ARRAY[NEW.equipped_arma, NEW.equipped_ofmao, NEW.equipped_elmo, NEW.equipped_peito,
               NEW.equipped_pernas, NEW.equipped_pes, NEW.equipped_amuleto, NEW.equipped_anel];
  IF (SELECT count(DISTINCT x) FROM unnest(ids) x WHERE x IS NOT NULL) <>
     (SELECT count(x) FROM unnest(ids) x WHERE x IS NOT NULL) THEN
    RAISE EXCEPTION 'Mesmo item não pode ocupar dois slots';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_equipment ON public.characters;
CREATE TRIGGER trg_validate_equipment
  BEFORE INSERT OR UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.tg_validate_equipment();

-- 4. Catálogo: 8 slots × 6 raridades = 48 equipamentos.
DO $$
DECLARE
  base RECORD;
  tr RECORD;
BEGIN
  FOR base IN
    SELECT * FROM (VALUES
      ('arma',    'Lâmina',    6, 0, 0, 0, 0, 60),
      ('ofmao',   'Escudo',    2, 3, 0, 0, 0, 55),
      ('elmo',    'Elmo',      0, 3, 10, 0, 0, 50),
      ('peito',   'Peitoral',  0, 6, 20, 0, 0, 80),
      ('pernas',  'Grevas',    0, 4, 15, 0, 0, 65),
      ('pes',     'Botas',     0, 2, 0, 0, 2, 45),
      ('amuleto', 'Amuleto',   0, 0, 15, 15, 0, 70),
      ('anel',    'Anel',      1, 1, 0, 0, 1, 60)
    ) AS b(slot, base_name, atk, def, hp, mana, spd, gold)
  LOOP
    FOR tr IN
      SELECT * FROM (VALUES
        (1, 'comum',    1.0, 'Rústico',     true),
        (1, 'incomum',  1.4, 'Reforçado',   true),
        (2, 'raro',     2.0, 'Élfico',      false),
        (2, 'epico',    3.0, 'Aetheriano',  false),
        (3, 'lendario', 4.5, 'Estelar',     false),
        (3, 'mitico',   6.5, 'Primordial',  false)
      ) AS t(tier, rarity, mult, suffix, buyable)
    LOOP
      INSERT INTO public.items
        (slug, name, description, slot, tier, rarity,
         attack_bonus, defense_bonus, hp_bonus, mana_bonus, speed_bonus,
         gold_value, sell_price, buyable)
      VALUES (
        base.slot || '-' || tr.rarity || '-t' || tr.tier,
        base.base_name || ' ' || tr.suffix,
        'Equipamento ' || tr.rarity || ' de tier ' || tr.tier || '.',
        base.slot::item_slot,
        tr.tier,
        tr.rarity::item_rarity,
        ceil(base.atk  * tr.mult)::int,
        ceil(base.def  * tr.mult)::int,
        ceil(base.hp   * tr.mult)::int,
        ceil(base.mana * tr.mult)::int,
        ceil(base.spd  * tr.mult)::int,
        ceil(base.gold * tr.mult * tr.tier)::int,
        ceil(base.gold * tr.mult * tr.tier / 2)::int,
        tr.buyable
      )
      ON CONFLICT (slug) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
