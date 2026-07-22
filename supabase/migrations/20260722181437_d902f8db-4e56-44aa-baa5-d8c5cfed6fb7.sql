
DROP POLICY IF EXISTS "wb bater" ON public.world_bosses;
REVOKE UPDATE ON public.world_bosses FROM authenticated;

CREATE OR REPLACE FUNCTION public.hit_world_boss(_slug text, _damage integer)
RETURNS TABLE (remaining_hp bigint, killed boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current bigint;
  v_max bigint;
  v_new bigint;
  v_username text;
  v_dmg integer := GREATEST(1, LEAST(_damage, 50000));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT username INTO v_username FROM public.profiles WHERE id = auth.uid();
  IF v_username IS NULL THEN v_username := 'Anon'; END IF;

  UPDATE public.world_bosses
     SET current_hp = GREATEST(0, current_hp - v_dmg), updated_at = now()
   WHERE slug = _slug
   RETURNING current_hp, max_hp INTO v_new, v_max;

  IF v_new IS NULL THEN RAISE EXCEPTION 'boss not found'; END IF;

  INSERT INTO public.world_boss_hits (boss_slug, user_id, username, damage)
  VALUES (_slug, auth.uid(), v_username, v_dmg);

  RETURN QUERY SELECT v_new, v_new = 0;
END;
$$;

REVOKE ALL ON FUNCTION public.hit_world_boss(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hit_world_boss(text, integer) TO authenticated;
