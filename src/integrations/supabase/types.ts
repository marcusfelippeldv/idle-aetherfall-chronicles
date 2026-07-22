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
      abilities: {
        Row: {
          class_slug: string | null
          description: string
          element: Database["public"]["Enums"]["element"]
          icon_url: string | null
          kind: string
          mana_cost: number
          name: string
          power: number
          slug: string
          target: string
        }
        Insert: {
          class_slug?: string | null
          description: string
          element?: Database["public"]["Enums"]["element"]
          icon_url?: string | null
          kind: string
          mana_cost?: number
          name: string
          power?: number
          slug: string
          target?: string
        }
        Update: {
          class_slug?: string | null
          description?: string
          element?: Database["public"]["Enums"]["element"]
          icon_url?: string | null
          kind?: string
          mana_cost?: number
          name?: string
          power?: number
          slug?: string
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "abilities_class_slug_fkey"
            columns: ["class_slug"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["slug"]
          },
        ]
      }
      achievements: {
        Row: {
          description: string
          metric: string
          name: string
          reward_gold: number
          reward_premium: number
          slug: string
          sort_order: number
          target: number
        }
        Insert: {
          description: string
          metric: string
          name: string
          reward_gold?: number
          reward_premium?: number
          slug: string
          sort_order?: number
          target: number
        }
        Update: {
          description?: string
          metric?: string
          name?: string
          reward_gold?: number
          reward_premium?: number
          slug?: string
          sort_order?: number
          target?: number
        }
        Relationships: []
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
      ancestral_entities: {
        Row: {
          cooldown_min: number
          description: string
          effect: string
          element: Database["public"]["Enums"]["element"]
          icon_url: string | null
          name: string
          portrait_url: string | null
          slug: string
        }
        Insert: {
          cooldown_min?: number
          description: string
          effect: string
          element: Database["public"]["Enums"]["element"]
          icon_url?: string | null
          name: string
          portrait_url?: string | null
          slug: string
        }
        Update: {
          cooldown_min?: number
          description?: string
          effect?: string
          element?: Database["public"]["Enums"]["element"]
          icon_url?: string | null
          name?: string
          portrait_url?: string | null
          slug?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          user_id: string
          username: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          id?: string
          user_id: string
          username: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          atk_per_level: number
          awakening_desc: string
          awakening_name: string
          base_atk: number
          base_def: number
          base_hp: number
          base_mana: number
          base_spd: number
          created_at: string
          def_per_level: number
          description: string
          full_url: string | null
          hp_per_level: number
          icon_url: string | null
          name: string
          parent_slug: string | null
          portrait_url: string | null
          role: Database["public"]["Enums"]["class_role"]
          slug: string
          tier: number
        }
        Insert: {
          atk_per_level?: number
          awakening_desc: string
          awakening_name: string
          base_atk?: number
          base_def?: number
          base_hp?: number
          base_mana?: number
          base_spd?: number
          created_at?: string
          def_per_level?: number
          description: string
          full_url?: string | null
          hp_per_level?: number
          icon_url?: string | null
          name: string
          parent_slug?: string | null
          portrait_url?: string | null
          role: Database["public"]["Enums"]["class_role"]
          slug: string
          tier?: number
        }
        Update: {
          atk_per_level?: number
          awakening_desc?: string
          awakening_name?: string
          base_atk?: number
          base_def?: number
          base_hp?: number
          base_mana?: number
          base_spd?: number
          created_at?: string
          def_per_level?: number
          description?: string
          full_url?: string | null
          hp_per_level?: number
          icon_url?: string | null
          name?: string
          parent_slug?: string | null
          portrait_url?: string | null
          role?: Database["public"]["Enums"]["class_role"]
          slug?: string
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "classes_parent_slug_fkey"
            columns: ["parent_slug"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["slug"]
          },
        ]
      }
      daily_missions: {
        Row: {
          description: string
          metric: string
          name: string
          reward_gold: number
          reward_xp: number
          slug: string
          sort_order: number
          target: number
        }
        Insert: {
          description: string
          metric: string
          name: string
          reward_gold?: number
          reward_xp?: number
          slug: string
          sort_order?: number
          target: number
        }
        Update: {
          description?: string
          metric?: string
          name?: string
          reward_gold?: number
          reward_xp?: number
          slug?: string
          sort_order?: number
          target?: number
        }
        Relationships: []
      }
      element_matchups: {
        Row: {
          attacker: Database["public"]["Enums"]["element"]
          defender: Database["public"]["Enums"]["element"]
          multiplier: number
        }
        Insert: {
          attacker: Database["public"]["Enums"]["element"]
          defender: Database["public"]["Enums"]["element"]
          multiplier?: number
        }
        Update: {
          attacker?: Database["public"]["Enums"]["element"]
          defender?: Database["public"]["Enums"]["element"]
          multiplier?: number
        }
        Relationships: []
      }
      enemies: {
        Row: {
          atk: number
          def: number
          element: Database["public"]["Enums"]["element"]
          gold_reward: number
          hp: number
          is_boss: boolean
          level: number
          name: string
          slug: string
          spd: number
          sprite_url: string | null
          xp_reward: number
        }
        Insert: {
          atk: number
          def: number
          element?: Database["public"]["Enums"]["element"]
          gold_reward?: number
          hp: number
          is_boss?: boolean
          level?: number
          name: string
          slug: string
          spd?: number
          sprite_url?: string | null
          xp_reward?: number
        }
        Update: {
          atk?: number
          def?: number
          element?: Database["public"]["Enums"]["element"]
          gold_reward?: number
          hp?: number
          is_boss?: boolean
          level?: number
          name?: string
          slug?: string
          spd?: number
          sprite_url?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      expeditions: {
        Row: {
          claimed_at: string | null
          duration_min: number
          ends_at: string
          id: string
          party_snapshot: Json
          region_slug: string
          report: Json | null
          seed: number
          started_at: string
          status: Database["public"]["Enums"]["expedition_status"]
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          duration_min: number
          ends_at: string
          id?: string
          party_snapshot: Json
          region_slug: string
          report?: Json | null
          seed: number
          started_at?: string
          status?: Database["public"]["Enums"]["expedition_status"]
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          duration_min?: number
          ends_at?: string
          id?: string
          party_snapshot?: Json
          region_slug?: string
          report?: Json | null
          seed?: number
          started_at?: string
          status?: Database["public"]["Enums"]["expedition_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expeditions_region_slug_fkey"
            columns: ["region_slug"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["slug"]
          },
        ]
      }
      guild_members: {
        Row: {
          guild_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          guild_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          guild_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
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
          id: string
          leader_id: string
          member_count: number
          name: string
          tag: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          leader_id: string
          member_count?: number
          name: string
          tag: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          leader_id?: string
          member_count?: number
          name?: string
          tag?: string
        }
        Relationships: []
      }
      heroes: {
        Row: {
          atk: number
          awakening_energy: number
          class_slug: string
          created_at: string
          def: number
          element: Database["public"]["Enums"]["element"]
          equipped_amuleto: string | null
          equipped_anel: string | null
          equipped_arma: string | null
          equipped_elmo: string | null
          equipped_ofmao: string | null
          equipped_peito: string | null
          equipped_pernas: string | null
          equipped_pes: string | null
          hp: number
          id: string
          is_protagonist: boolean
          level: number
          mana: number
          name: string
          portrait_url: string | null
          priorities: Json
          spd: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          atk?: number
          awakening_energy?: number
          class_slug: string
          created_at?: string
          def?: number
          element?: Database["public"]["Enums"]["element"]
          equipped_amuleto?: string | null
          equipped_anel?: string | null
          equipped_arma?: string | null
          equipped_elmo?: string | null
          equipped_ofmao?: string | null
          equipped_peito?: string | null
          equipped_pernas?: string | null
          equipped_pes?: string | null
          hp?: number
          id?: string
          is_protagonist?: boolean
          level?: number
          mana?: number
          name: string
          portrait_url?: string | null
          priorities?: Json
          spd?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          atk?: number
          awakening_energy?: number
          class_slug?: string
          created_at?: string
          def?: number
          element?: Database["public"]["Enums"]["element"]
          equipped_amuleto?: string | null
          equipped_anel?: string | null
          equipped_arma?: string | null
          equipped_elmo?: string | null
          equipped_ofmao?: string | null
          equipped_peito?: string | null
          equipped_pernas?: string | null
          equipped_pes?: string | null
          hp?: number
          id?: string
          is_protagonist?: boolean
          level?: number
          mana?: number
          name?: string
          portrait_url?: string | null
          priorities?: Json
          spd?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "heroes_class_slug_fkey"
            columns: ["class_slug"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["slug"]
          },
        ]
      }
      inventory: {
        Row: {
          acquired_at: string
          id: string
          item_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          item_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          attack_bonus: number
          class_restriction: string[]
          defense_bonus: number
          description: string | null
          element_affinity: Database["public"]["Enums"]["element"] | null
          gold_value: number
          hp_bonus: number
          icon_url: string | null
          id: string
          mana_bonus: number
          name: string
          rarity: Database["public"]["Enums"]["item_rarity"]
          sell_price: number
          slot: Database["public"]["Enums"]["item_slot"]
          slug: string
          sold_in_shop: boolean
          speed_bonus: number
          tier: number
        }
        Insert: {
          attack_bonus?: number
          class_restriction?: string[]
          defense_bonus?: number
          description?: string | null
          element_affinity?: Database["public"]["Enums"]["element"] | null
          gold_value?: number
          hp_bonus?: number
          icon_url?: string | null
          id?: string
          mana_bonus?: number
          name: string
          rarity?: Database["public"]["Enums"]["item_rarity"]
          sell_price?: number
          slot: Database["public"]["Enums"]["item_slot"]
          slug: string
          sold_in_shop?: boolean
          speed_bonus?: number
          tier?: number
        }
        Update: {
          attack_bonus?: number
          class_restriction?: string[]
          defense_bonus?: number
          description?: string | null
          element_affinity?: Database["public"]["Enums"]["element"] | null
          gold_value?: number
          hp_bonus?: number
          icon_url?: string | null
          id?: string
          mana_bonus?: number
          name?: string
          rarity?: Database["public"]["Enums"]["item_rarity"]
          sell_price?: number
          slot?: Database["public"]["Enums"]["item_slot"]
          slug?: string
          sold_in_shop?: boolean
          speed_bonus?: number
          tier?: number
        }
        Relationships: []
      }
      parties: {
        Row: {
          entity_slug: string | null
          id: string
          slot1: string | null
          slot2: string | null
          slot3: string | null
          slot4: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          entity_slug?: string | null
          id?: string
          slot1?: string | null
          slot2?: string | null
          slot3?: string | null
          slot4?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          entity_slug?: string | null
          id?: string
          slot1?: string | null
          slot2?: string | null
          slot3?: string | null
          slot4?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parties_entity_slug_fkey"
            columns: ["entity_slug"]
            isOneToOne: false
            referencedRelation: "ancestral_entities"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "parties_slot1_fkey"
            columns: ["slot1"]
            isOneToOne: false
            referencedRelation: "heroes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parties_slot2_fkey"
            columns: ["slot2"]
            isOneToOne: false
            referencedRelation: "heroes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parties_slot3_fkey"
            columns: ["slot3"]
            isOneToOne: false
            referencedRelation: "heroes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parties_slot4_fkey"
            columns: ["slot4"]
            isOneToOne: false
            referencedRelation: "heroes"
            referencedColumns: ["id"]
          },
        ]
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
      regions: {
        Row: {
          background_url: string | null
          boss_slug: string | null
          chapter: number
          description: string
          name: string
          recommended_level: number
          slug: string
          sort_order: number
        }
        Insert: {
          background_url?: string | null
          boss_slug?: string | null
          chapter?: number
          description: string
          name: string
          recommended_level?: number
          slug: string
          sort_order?: number
        }
        Update: {
          background_url?: string | null
          boss_slug?: string | null
          chapter?: number
          description?: string
          name?: string
          recommended_level?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      stages: {
        Row: {
          boss_slug: string | null
          enemy_pool: string[]
          id: string
          is_boss: boolean
          region_slug: string
          stage_number: number
        }
        Insert: {
          boss_slug?: string | null
          enemy_pool?: string[]
          id?: string
          is_boss?: boolean
          region_slug: string
          stage_number: number
        }
        Update: {
          boss_slug?: string | null
          enemy_pool?: string[]
          id?: string
          is_boss?: boolean
          region_slug?: string
          stage_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "stages_boss_slug_fkey"
            columns: ["boss_slug"]
            isOneToOne: false
            referencedRelation: "enemies"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "stages_region_slug_fkey"
            columns: ["region_slug"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["slug"]
          },
        ]
      }
      story_chapters: {
        Row: {
          body: string
          chapter_number: number
          cover_url: string | null
          slug: string
          title: string
          unlock_condition: string | null
        }
        Insert: {
          body: string
          chapter_number: number
          cover_url?: string | null
          slug: string
          title: string
          unlock_condition?: string | null
        }
        Update: {
          body?: string
          chapter_number?: number
          cover_url?: string | null
          slug?: string
          title?: string
          unlock_condition?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          claimed: boolean
          completed_at: string | null
          progress: number
          slug: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          completed_at?: string | null
          progress?: number
          slug: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          completed_at?: string | null
          progress?: number
          slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_slug_fkey"
            columns: ["slug"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_daily_progress: {
        Row: {
          claimed: boolean
          day: string
          mission_slug: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          day?: string
          mission_slug: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          day?: string
          mission_slug?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_progress_mission_slug_fkey"
            columns: ["mission_slug"]
            isOneToOne: false
            referencedRelation: "daily_missions"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_entities: {
        Row: {
          cooldown_until: string | null
          entity_slug: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          cooldown_until?: string | null
          entity_slug: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          cooldown_until?: string | null
          entity_slug?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entities_entity_slug_fkey"
            columns: ["entity_slug"]
            isOneToOne: false
            referencedRelation: "ancestral_entities"
            referencedColumns: ["slug"]
          },
        ]
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
      user_story_progress: {
        Row: {
          chapter_slug: string
          read_at: string
          user_id: string
        }
        Insert: {
          chapter_slug: string
          read_at?: string
          user_id: string
        }
        Update: {
          chapter_slug?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_story_progress_chapter_slug_fkey"
            columns: ["chapter_slug"]
            isOneToOne: false
            referencedRelation: "story_chapters"
            referencedColumns: ["slug"]
          },
        ]
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
      world_boss_hits: {
        Row: {
          boss_slug: string
          created_at: string
          damage: number
          id: string
          user_id: string
          username: string
        }
        Insert: {
          boss_slug: string
          created_at?: string
          damage: number
          id?: string
          user_id: string
          username: string
        }
        Update: {
          boss_slug?: string
          created_at?: string
          damage?: number
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_boss_hits_boss_slug_fkey"
            columns: ["boss_slug"]
            isOneToOne: false
            referencedRelation: "world_bosses"
            referencedColumns: ["slug"]
          },
        ]
      }
      world_bosses: {
        Row: {
          current_hp: number
          description: string
          element: Database["public"]["Enums"]["element"]
          max_hp: number
          name: string
          reset_at: string | null
          reward_gold: number
          reward_xp: number
          slug: string
          updated_at: string
        }
        Insert: {
          current_hp: number
          description: string
          element?: Database["public"]["Enums"]["element"]
          max_hp: number
          name: string
          reset_at?: string | null
          reward_gold?: number
          reward_xp?: number
          slug: string
          updated_at?: string
        }
        Update: {
          current_hp?: number
          description?: string
          element?: Database["public"]["Enums"]["element"]
          max_hp?: number
          name?: string
          reset_at?: string | null
          reward_gold?: number
          reward_xp?: number
          slug?: string
          updated_at?: string
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
      hit_world_boss: {
        Args: { _damage: number; _slug: string }
        Returns: {
          killed: boolean
          remaining_hp: number
        }[]
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "banned"
      app_role: "user" | "moderator" | "admin"
      archetype_role:
        | "tank_melee"
        | "tank_agile"
        | "ranger"
        | "mage_dps"
        | "mage_support"
      class_role:
        | "tanque"
        | "magico"
        | "suporte"
        | "fisico"
        | "lancista"
        | "assassino"
      currency_type: "gold" | "premium"
      element:
        | "fogo"
        | "gelo"
        | "raio"
        | "terra"
        | "luz"
        | "sombra"
        | "arcano"
        | "neutro"
      expedition_status:
        | "em_andamento"
        | "concluida"
        | "reivindicada"
        | "cancelada"
      guild_role: "leader" | "officer" | "member"
      incursion_mode: "ativa" | "vigilia" | "treino"
      incursion_status: "em_andamento" | "concluida" | "falhou" | "cancelada"
      item_rarity:
        | "comum"
        | "incomum"
        | "raro"
        | "epico"
        | "lendario"
        | "mitico"
      item_slot:
        | "arma"
        | "ofmao"
        | "elmo"
        | "peito"
        | "pernas"
        | "pes"
        | "amuleto"
        | "anel"
        | "consumivel"
        | "material"
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
      archetype_role: [
        "tank_melee",
        "tank_agile",
        "ranger",
        "mage_dps",
        "mage_support",
      ],
      class_role: [
        "tanque",
        "magico",
        "suporte",
        "fisico",
        "lancista",
        "assassino",
      ],
      currency_type: ["gold", "premium"],
      element: [
        "fogo",
        "gelo",
        "raio",
        "terra",
        "luz",
        "sombra",
        "arcano",
        "neutro",
      ],
      expedition_status: [
        "em_andamento",
        "concluida",
        "reivindicada",
        "cancelada",
      ],
      guild_role: ["leader", "officer", "member"],
      incursion_mode: ["ativa", "vigilia", "treino"],
      incursion_status: ["em_andamento", "concluida", "falhou", "cancelada"],
      item_rarity: ["comum", "incomum", "raro", "epico", "lendario", "mitico"],
      item_slot: [
        "arma",
        "ofmao",
        "elmo",
        "peito",
        "pernas",
        "pes",
        "amuleto",
        "anel",
        "consumivel",
        "material",
      ],
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
