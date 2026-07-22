export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievement_templates: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          goal_type: string
          id: string
          order_index: number
          reward_gold: number
          reward_premium: number
          slug: string
          threshold: number
          title: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          goal_type: string
          id?: string
          order_index?: number
          reward_gold?: number
          reward_premium?: number
          slug: string
          threshold: number
          title: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          goal_type?: string
          id?: string
          order_index?: number
          reward_gold?: number
          reward_premium?: number
          slug?: string
          threshold?: number
          title?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          claimed_at: string | null
          id: string
          template_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          template_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          id?: string
          template_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "achievement_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          justification: string
          new_data: Json | null
          previous_data: Json | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          justification: string
          new_data?: Json | null
          previous_data?: Json | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          justification?: string
          new_data?: Json | null
          previous_data?: Json | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          attack: number
          class_id: string
          created_at: string
          current_hp: number
          current_xp: number
          defeated_bosses: string[]
          defense: number
          id: string
          is_active: boolean
          last_combat: Json | null
          level: number
          max_hp: number
          name: string
          power: number
          speed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attack?: number
          class_id: string
          created_at?: string
          current_hp?: number
          current_xp?: number
          defeated_bosses?: string[]
          defense?: number
          id?: string
          is_active?: boolean
          last_combat?: Json | null
          level?: number
          max_hp?: number
          name: string
          power?: number
          speed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attack?: number
          class_id?: string
          created_at?: string
          current_hp?: number
          current_xp?: number
          defeated_bosses?: string[]
          defense?: number
          id?: string
          is_active?: boolean
          last_combat?: Json | null
          level?: number
          max_hp?: number
          name?: string
          power?: number
          speed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_key: string
          character_name: string
          content: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          channel_key: string
          character_name: string
          content: string
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          channel_key?: string
          character_name?: string
          content?: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          active: boolean
          base_attack: number
          base_defense: number
          base_hp: number
          base_speed: number
          created_at: string
          description: string
          icon_url: string | null
          id: string
          name: string
          order_index: number
          slug: string
        }
        Insert: {
          active?: boolean
          base_attack?: number
          base_defense?: number
          base_hp?: number
          base_speed?: number
          created_at?: string
          description: string
          icon_url?: string | null
          id?: string
          name: string
          order_index?: number
          slug: string
        }
        Update: {
          active?: boolean
          base_attack?: number
          base_defense?: number
          base_hp?: number
          base_speed?: number
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          name?: string
          order_index?: number
          slug?: string
        }
        Relationships: []
      }
      currency_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          currency_type: Database["public"]["Enums"]["currency_type"]
          description: string | null
          id: string
          source_id: string | null
          source_type: string
          transaction_kind: Database["public"]["Enums"]["transaction_kind"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          currency_type: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          id?: string
          source_id?: string | null
          source_type: string
          transaction_kind: Database["public"]["Enums"]["transaction_kind"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          currency_type?: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          transaction_kind?: Database["public"]["Enums"]["transaction_kind"]
          user_id?: string
        }
        Relationships: []
      }
      daily_quest_templates: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          goal_type: string
          id: string
          reward_gold: number
          reward_season_xp: number
          reward_xp: number
          slug: string
          target: number
          title: string
          weight: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          goal_type: string
          id?: string
          reward_gold?: number
          reward_season_xp?: number
          reward_xp?: number
          slug: string
          target: number
          title: string
          weight?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          goal_type?: string
          id?: string
          reward_gold?: number
          reward_season_xp?: number
          reward_xp?: number
          slug?: string
          target?: number
          title?: string
          weight?: number
        }
        Relationships: []
      }
      daily_quests: {
        Row: {
          claimed_at: string | null
          created_at: string
          id: string
          progress: number
          quest_date: string
          target: number
          template_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          quest_date?: string
          target: number
          template_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          quest_date?: string
          target?: number
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_quests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "daily_quest_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      enemies: {
        Row: {
          active: boolean
          attack: number
          defense: number
          gold_max: number
          gold_min: number
          hp: number
          id: string
          image_url: string | null
          is_boss: boolean
          level: number
          name: string
          region_id: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          attack?: number
          defense?: number
          gold_max?: number
          gold_min?: number
          hp?: number
          id?: string
          image_url?: string | null
          is_boss?: boolean
          level?: number
          name: string
          region_id: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          attack?: number
          defense?: number
          gold_max?: number
          gold_min?: number
          hp?: number
          id?: string
          image_url?: string | null
          is_boss?: boolean
          level?: number
          name?: string
          region_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "enemies_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      expeditions: {
        Row: {
          character_id: string
          claimed_at: string | null
          duration_minutes: number
          expected_end_at: string
          generated_gold: number
          generated_xp: number
          id: string
          region_id: string
          result_data: Json | null
          rng_seed: number
          started_at: string
          status: Database["public"]["Enums"]["expedition_status"]
        }
        Insert: {
          character_id: string
          claimed_at?: string | null
          duration_minutes: number
          expected_end_at: string
          generated_gold?: number
          generated_xp?: number
          id?: string
          region_id: string
          result_data?: Json | null
          rng_seed?: number
          started_at?: string
          status?: Database["public"]["Enums"]["expedition_status"]
        }
        Update: {
          character_id?: string
          claimed_at?: string | null
          duration_minutes?: number
          expected_end_at?: string
          generated_gold?: number
          generated_xp?: number
          id?: string
          region_id?: string
          result_data?: Json | null
          rng_seed?: number
          started_at?: string
          status?: Database["public"]["Enums"]["expedition_status"]
        }
        Relationships: [
          {
            foreignKeyName: "expeditions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expeditions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_invites: {
        Row: {
          created_at: string
          expires_at: string
          guild_id: string
          id: string
          invited_by: string
          invited_user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          guild_id: string
          id?: string
          invited_by: string
          invited_user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          guild_id?: string
          id?: string
          invited_by?: string
          invited_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_invites_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_members: {
        Row: {
          character_id: string | null
          contribution: number
          guild_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["guild_role"]
          user_id: string
        }
        Insert: {
          character_id?: string | null
          contribution?: number
          guild_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["guild_role"]
          user_id: string
        }
        Update: {
          character_id?: string | null
          contribution?: number
          guild_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["guild_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_members_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          created_at: string
          description: string
          emblem: string
          id: string
          leader_id: string
          member_count: number
          name: string
          tag: string
          total_power: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          emblem?: string
          id?: string
          leader_id: string
          member_count?: number
          name: string
          tag: string
          total_power?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          emblem?: string
          id?: string
          leader_id?: string
          member_count?: number
          name?: string
          tag?: string
          total_power?: number
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          acquired_at: string
          character_id: string
          equipped: boolean
          id: string
          item_id: string
          quantity: number
        }
        Insert: {
          acquired_at?: string
          character_id: string
          equipped?: boolean
          id?: string
          item_id: string
          quantity?: number
        }
        Update: {
          acquired_at?: string
          character_id?: string
          equipped?: boolean
          id?: string
          item_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          active: boolean
          attack_bonus: number
          defense_bonus: number
          description: string
          hp_bonus: number
          id: string
          image_url: string | null
          item_type: Database["public"]["Enums"]["item_type"]
          name: string
          rarity: Database["public"]["Enums"]["item_rarity"]
          required_level: number
          sell_price: number
          slug: string
          speed_bonus: number
        }
        Insert: {
          active?: boolean
          attack_bonus?: number
          defense_bonus?: number
          description: string
          hp_bonus?: number
          id?: string
          image_url?: string | null
          item_type: Database["public"]["Enums"]["item_type"]
          name: string
          rarity?: Database["public"]["Enums"]["item_rarity"]
          required_level?: number
          sell_price?: number
          slug: string
          speed_bonus?: number
        }
        Update: {
          active?: boolean
          attack_bonus?: number
          defense_bonus?: number
          description?: string
          hp_bonus?: number
          id?: string
          image_url?: string | null
          item_type?: Database["public"]["Enums"]["item_type"]
          name?: string
          rarity?: Database["public"]["Enums"]["item_rarity"]
          required_level?: number
          sell_price?: number
          slug?: string
          speed_bonus?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          delivered_at: string | null
          id: string
          paid_at: string | null
          payment_provider: string | null
          product_id: string
          provider_order_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          delivered_at?: string | null
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          product_id: string
          provider_order_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          delivered_at?: string | null
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          product_id?: string
          provider_order_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string
          id: string
          metadata: Json
          name: string
          order_index: number
          premium_amount: number
          price_cents: number
          product_kind: Database["public"]["Enums"]["product_kind"]
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description: string
          id?: string
          metadata?: Json
          name: string
          order_index?: number
          premium_amount?: number
          price_cents: number
          product_kind: Database["public"]["Enums"]["product_kind"]
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string
          id?: string
          metadata?: Json
          name?: string
          order_index?: number
          premium_amount?: number
          price_cents?: number
          product_kind?: Database["public"]["Enums"]["product_kind"]
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          last_login_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          last_login_at?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          last_login_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      raid_contributions: {
        Row: {
          character_id: string
          created_at: string
          damage: number
          hits: number
          id: string
          last_hit_at: string | null
          raid_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          damage?: number
          hits?: number
          id?: string
          last_hit_at?: string | null
          raid_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          damage?: number
          hits?: number
          id?: string
          last_hit_at?: string | null
          raid_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raid_contributions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raid_contributions_raid_id_fkey"
            columns: ["raid_id"]
            isOneToOne: false
            referencedRelation: "raids"
            referencedColumns: ["id"]
          },
        ]
      }
      raid_rewards: {
        Row: {
          claimed_at: string | null
          created_at: string
          crystals: number
          gold: number
          id: string
          raid_id: string
          user_id: string
          xp: number
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          crystals?: number
          gold?: number
          id?: string
          raid_id: string
          user_id: string
          xp?: number
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          crystals?: number
          gold?: number
          id?: string
          raid_id?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "raid_rewards_raid_id_fkey"
            columns: ["raid_id"]
            isOneToOne: false
            referencedRelation: "raids"
            referencedColumns: ["id"]
          },
        ]
      }
      raid_templates: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          min_level: number
          name: string
          order_index: number
          reward_crystals: number
          reward_gold: number
          reward_xp: number
          slug: string
          total_hp: number
          updated_at: string
          window_hours: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          min_level?: number
          name: string
          order_index?: number
          reward_crystals?: number
          reward_gold?: number
          reward_xp?: number
          slug: string
          total_hp: number
          updated_at?: string
          window_hours?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          min_level?: number
          name?: string
          order_index?: number
          reward_crystals?: number
          reward_gold?: number
          reward_xp?: number
          slug?: string
          total_hp?: number
          updated_at?: string
          window_hours?: number
        }
        Relationships: []
      }
      raids: {
        Row: {
          created_at: string
          current_hp: number
          defeated_at: string | null
          ends_at: string
          guild_id: string | null
          id: string
          settled_at: string | null
          starts_at: string
          status: Database["public"]["Enums"]["raid_status"]
          template_id: string
          total_hp: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_hp: number
          defeated_at?: string | null
          ends_at: string
          guild_id?: string | null
          id?: string
          settled_at?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["raid_status"]
          template_id: string
          total_hp: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_hp?: number
          defeated_at?: string | null
          ends_at?: string
          guild_id?: string | null
          id?: string
          settled_at?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["raid_status"]
          template_id?: string
          total_hp?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raids_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raids_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "raid_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          active: boolean
          background_url: string | null
          created_at: string
          description: string
          id: string
          name: string
          order_index: number
          required_level: number
          slug: string
        }
        Insert: {
          active?: boolean
          background_url?: string | null
          created_at?: string
          description: string
          id?: string
          name: string
          order_index?: number
          required_level?: number
          slug: string
        }
        Update: {
          active?: boolean
          background_url?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          order_index?: number
          required_level?: number
          slug?: string
        }
        Relationships: []
      }
      season_progress: {
        Row: {
          claimed_levels: number[]
          id: string
          season_id: string
          season_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed_levels?: number[]
          id?: string
          season_id: string
          season_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed_levels?: number[]
          id?: string
          season_id?: string
          season_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_progress_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      season_rewards: {
        Row: {
          id: string
          level: number
          reward_gold: number
          reward_item_id: string | null
          reward_premium: number
          season_id: string
          xp_required: number
        }
        Insert: {
          id?: string
          level: number
          reward_gold?: number
          reward_item_id?: string | null
          reward_premium?: number
          season_id: string
          xp_required: number
        }
        Update: {
          id?: string
          level?: number
          reward_gold?: number
          reward_item_id?: string | null
          reward_premium?: number
          season_id?: string
          xp_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "season_rewards_reward_item_id_fkey"
            columns: ["reward_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_rewards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          ends_at: string
          id: string
          name: string
          slug: string
          starts_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          name: string
          slug: string
          starts_at: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          name?: string
          slug?: string
          starts_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          gold_balance: number
          premium_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          gold_balance?: number
          premium_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          gold_balance?: number
          premium_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_guild_member: {
        Args: { _guild_id: string; _user_id: string }
        Returns: boolean
      }
      my_guild_id: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      account_status: "active" | "suspended" | "banned"
      app_role: "user" | "moderator" | "admin"
      currency_type: "gold" | "premium"
      expedition_status: "running" | "ready" | "claimed" | "cancelled"
      guild_role: "leader" | "officer" | "member"
      item_rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
      item_type:
        | "weapon"
        | "armor"
        | "helmet"
        | "accessory"
        | "material"
        | "consumable"
      order_status: "pending" | "paid" | "delivered" | "refunded" | "cancelled"
      product_kind:
        | "premium_pack"
        | "season_pass"
        | "founder_pack"
        | "subscription"
        | "shop_item"
      raid_status: "active" | "defeated" | "expired" | "settled"
      transaction_kind: "credit" | "debit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "suspended", "banned"],
      app_role: ["user", "moderator", "admin"],
      currency_type: ["gold", "premium"],
      expedition_status: ["running", "ready", "claimed", "cancelled"],
      guild_role: ["leader", "officer", "member"],
      item_rarity: ["common", "uncommon", "rare", "epic", "legendary"],
      item_type: [
        "weapon",
        "armor",
        "helmet",
        "accessory",
        "material",
        "consumable",
      ],
      order_status: ["pending", "paid", "delivered", "refunded", "cancelled"],
      product_kind: [
        "premium_pack",
        "season_pass",
        "founder_pack",
        "subscription",
        "shop_item",
      ],
      raid_status: ["active", "defeated", "expired", "settled"],
      transaction_kind: ["credit", "debit"],
    },
  },
} as const
