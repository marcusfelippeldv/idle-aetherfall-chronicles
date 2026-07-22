
-- characters
CREATE POLICY "Users insert own characters" ON public.characters
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own characters" ON public.characters
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own characters" ON public.characters
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.characters DROP CONSTRAINT IF EXISTS characters_name_key;
DROP INDEX IF EXISTS public.characters_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS characters_user_name_key
  ON public.characters (user_id, name);

-- expeditions (owned via character)
CREATE POLICY "Users insert own expeditions" ON public.expeditions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid()));
CREATE POLICY "Users update own expeditions" ON public.expeditions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid()));
CREATE POLICY "Users delete own expeditions" ON public.expeditions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid()));

-- inventory_items (owned via character)
CREATE POLICY "Users insert own inventory" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid()));
CREATE POLICY "Users update own inventory" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid()));
CREATE POLICY "Users delete own inventory" ON public.inventory_items
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid()));

-- wallets
CREATE POLICY "Users update own wallet" ON public.wallets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- currency_transactions
CREATE POLICY "Users insert own currency tx" ON public.currency_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- orders
CREATE POLICY "Users insert own orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own orders" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- profiles
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- guilds
CREATE POLICY "Users create own guild" ON public.guilds
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leader deletes guild" ON public.guilds
  FOR DELETE TO authenticated USING (auth.uid() = leader_id);

-- guild_members
CREATE POLICY "Users join guild as self" ON public.guild_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leader updates members" ON public.guild_members
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.guilds g WHERE g.id = guild_id AND g.leader_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.guilds g WHERE g.id = guild_id AND g.leader_id = auth.uid()));

-- guild_invites
CREATE POLICY "Members create invites" ON public.guild_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_guild_member(auth.uid(), guild_id));

-- raids: qualquer autenticado pode criar/atualizar (a lógica fica no servidor)
CREATE POLICY "Users insert raids" ON public.raids
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update raids" ON public.raids
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- raid_contributions
CREATE POLICY "Users insert own raid contribs" ON public.raid_contributions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- raid_rewards
CREATE POLICY "Users update own raid rewards" ON public.raid_rewards
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
