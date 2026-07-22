
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS icon_url text,
  ADD COLUMN IF NOT EXISTS allowed_archetypes text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.tg_validate_equipment()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  slot_col text;
  inv_id uuid;
  inv_user uuid;
  inv_slot item_slot;
  inv_allowed text[];
  hero_arch text;
  ids uuid[];
BEGIN
  SELECT archetype_slug INTO hero_arch FROM public.characters WHERE id = NEW.id;

  FOREACH slot_col IN ARRAY ARRAY['arma','ofmao','elmo','peito','pernas','pes','amuleto','anel']
  LOOP
    EXECUTE format('SELECT ($1).equipped_%I', slot_col) INTO inv_id USING NEW;
    IF inv_id IS NOT NULL THEN
      SELECT inv.user_id, it.slot, it.allowed_archetypes
        INTO inv_user, inv_slot, inv_allowed
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
      IF inv_allowed IS NOT NULL AND array_length(inv_allowed, 1) IS NOT NULL
         AND NOT (hero_arch = ANY(inv_allowed)) THEN
        RAISE EXCEPTION 'Este item é exclusivo de outro arquétipo';
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
$function$;
