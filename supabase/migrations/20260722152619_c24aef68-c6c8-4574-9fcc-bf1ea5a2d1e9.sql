
CREATE TYPE public.guild_role AS ENUM ('leader', 'officer', 'member');
CREATE TYPE public.raid_status AS ENUM ('active', 'defeated', 'expired', 'settled');

CREATE TABLE public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  tag TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  emblem TEXT NOT NULL DEFAULT 'shield',
  leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count INT NOT NULL DEFAULT 1,
  total_power INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guilds_name_len CHECK (char_length(name) BETWEEN 3 AND 32),
  CONSTRAINT guilds_tag_len CHECK (char_length(tag) BETWEEN 2 AND 5),
  CONSTRAINT guilds_desc_len CHECK (char_length(description) <= 400)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guilds TO authenticated;
GRANT ALL ON public.guilds TO service_role;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guilds readable" ON public.guilds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leader updates guild" ON public.guilds FOR UPDATE TO authenticated USING (leader_id = auth.uid()) WITH CHECK (leader_id = auth.uid());
CREATE TRIGGER trg_guilds_updated_at BEFORE UPDATE ON public.guilds FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  role public.guild_role NOT NULL DEFAULT 'member',
  contribution INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE INDEX idx_guild_members_guild ON public.guild_members(guild_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guild_members TO authenticated;
GRANT ALL ON public.guild_members TO service_role;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members readable" ON public.guild_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leave own membership" ON public.guild_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_guild_member(_user_id UUID, _guild_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.guild_members WHERE user_id = _user_id AND guild_id = _guild_id)
$$;
CREATE OR REPLACE FUNCTION public.my_guild_id(_user_id UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT guild_id FROM public.guild_members WHERE user_id = _user_id LIMIT 1
$$;

CREATE TABLE public.guild_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  UNIQUE (guild_id, invited_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guild_invites TO authenticated;
GRANT ALL ON public.guild_invites TO service_role;
ALTER TABLE public.guild_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Invitee reads invites" ON public.guild_invites FOR SELECT TO authenticated
  USING (invited_user_id = auth.uid() OR public.is_guild_member(auth.uid(), guild_id));
CREATE POLICY "Invitee deletes invites" ON public.guild_invites FOR DELETE TO authenticated USING (invited_user_id = auth.uid());

CREATE TABLE public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  channel_key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chat_content_len CHECK (char_length(content) BETWEEN 1 AND 500)
);
CREATE INDEX idx_chat_messages_channel_time ON public.chat_messages(channel_key, created_at DESC);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.chat_messages_id_seq TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read chat" ON public.chat_messages FOR SELECT TO authenticated USING (
  channel_key = 'global'
  OR (channel_key LIKE 'guild:%' AND public.is_guild_member(auth.uid(), NULLIF(substring(channel_key FROM 7), '')::uuid))
);
CREATE POLICY "Write own chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND (
    channel_key = 'global'
    OR (channel_key LIKE 'guild:%' AND public.is_guild_member(auth.uid(), NULLIF(substring(channel_key FROM 7), '')::uuid))
  )
);

CREATE TABLE public.raid_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  total_hp BIGINT NOT NULL,
  window_hours INT NOT NULL DEFAULT 24,
  min_level INT NOT NULL DEFAULT 1,
  reward_gold INT NOT NULL DEFAULT 0,
  reward_crystals INT NOT NULL DEFAULT 0,
  reward_xp INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.raid_templates TO authenticated;
GRANT ALL ON public.raid_templates TO service_role;
ALTER TABLE public.raid_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Raid tpl readable" ON public.raid_templates FOR SELECT TO authenticated USING (true);

CREATE TABLE public.raids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.raid_templates(id) ON DELETE CASCADE,
  guild_id UUID REFERENCES public.guilds(id) ON DELETE CASCADE,
  status public.raid_status NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  current_hp BIGINT NOT NULL,
  total_hp BIGINT NOT NULL,
  defeated_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_raids_status ON public.raids(status);
GRANT SELECT ON public.raids TO authenticated;
GRANT ALL ON public.raids TO service_role;
ALTER TABLE public.raids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Raids readable" ON public.raids FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_raids_updated_at BEFORE UPDATE ON public.raids FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.raid_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_id UUID NOT NULL REFERENCES public.raids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  damage BIGINT NOT NULL DEFAULT 0,
  hits INT NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (raid_id, character_id)
);
CREATE INDEX idx_raid_contrib_dmg ON public.raid_contributions(raid_id, damage DESC);
GRANT SELECT ON public.raid_contributions TO authenticated;
GRANT ALL ON public.raid_contributions TO service_role;
ALTER TABLE public.raid_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contribs readable" ON public.raid_contributions FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_raid_contrib_updated_at BEFORE UPDATE ON public.raid_contributions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.raid_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_id UUID NOT NULL REFERENCES public.raids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gold INT NOT NULL DEFAULT 0,
  crystals INT NOT NULL DEFAULT 0,
  xp INT NOT NULL DEFAULT 0,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (raid_id, user_id)
);
GRANT SELECT, UPDATE ON public.raid_rewards TO authenticated;
GRANT ALL ON public.raid_rewards TO service_role;
ALTER TABLE public.raid_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own rewards readable" ON public.raid_rewards FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.raids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.raid_contributions;

INSERT INTO public.raid_templates (slug, name, description, total_hp, window_hours, min_level, reward_gold, reward_crystals, reward_xp, order_index) VALUES
  ('leviata-do-veu', 'Leviatã do Véu', 'Colosso marinho que emerge da névoa arcana. Coordene ataques antes do amanhecer.', 500000, 24, 3, 1500, 30, 800, 1),
  ('tita-de-obsidiana', 'Titã de Obsidiana', 'Antigo guardião de rocha viva. Cada golpe rasga fragmentos preciosos.', 900000, 36, 6, 3000, 60, 1500, 2),
  ('fenix-umbral', 'Fênix Umbral', 'Renasce em cinzas negras. Só heróis experientes derrubam esta ave sombria.', 1400000, 48, 10, 5500, 120, 2500, 3);

INSERT INTO public.raids (template_id, status, starts_at, ends_at, current_hp, total_hp)
SELECT id, 'active', now(), now() + (window_hours || ' hours')::interval, total_hp, total_hp
FROM public.raid_templates;

INSERT INTO public.achievement_templates (slug, title, description, goal_type, threshold, reward_premium, category, order_index, active) VALUES
  ('primeira-raid', 'Investida Cooperativa', 'Contribua com sua primeira raid.', 'raid_hits', 1, 10, 'social', 30, true),
  ('destruidor-de-raids', 'Destruidor de Raids', 'Acumule 100 investidas em raids.', 'raid_hits', 100, 50, 'social', 31, true),
  ('fundador', 'Fundador de Guilda', 'Funde uma guilda.', 'guild_founded', 1, 25, 'social', 32, true);
