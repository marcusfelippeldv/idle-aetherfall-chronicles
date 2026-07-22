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
      archetypes: {
        Row: {
          base_attack: number
          base_defense: number
          base_hp: number
          base_mana: number
          base_speed: number
          created_at: string
          description: string
          hp_per_level: number
          id: string
          mana_per_level: number
          name: string
          role: Database["public"]["Enums"]["archetype_role"]
          slug: string
          sort_order: number
          starting_weapon: string
          uses_mana_potion: boolean
        }
        Insert: {
          base_attack: number
          base_defense: number
          base_hp: number
          base_mana: number
          base_speed: number
          created_at?: string
          description: string
          hp_per_level: number
          id?: string
          mana_per_level: number
          name: string
          role: Database["public"]["Enums"]["archetype_role"]
          slug: string
          sort_order?: number
          starting_weapon: string
          uses_mana_potion?: boolean
        }
        Update: {
          base_attack?: number
          base_defense?: number
          base_hp?: number
          base_mana?: number
          base_speed?: number
          created_at?: string
          description?: string
          hp_per_level?: number
          id?: string
          mana_per_level?: number
          name?: string
          role?: Database["public"]["Enums"]["archetype_role"]
          slug?: string
          sort_order?: number
          starting_weapon?: string
          uses_mana_potion?: boolean
        }
        Relationships: []
      }
      characters: {
        Row: {
          archetype_id: string
          attack: number
          created_at: string
          current_hp: number
          current_mana: number
          current_xp: number
          defense: number
          equipped_amuleto: string | null
          equipped_anel: string | null
          equipped_arma: string | null
          equipped_elmo: string | null
          equipped_ofmao: string | null
          equipped_peito: string | null
          equipped_pernas: string | null
          equipped_pes: string | null
          id: string
          is_active: boolean
          level: number
          max_hp: number
          max_mana: number
          name: string
          skill_fist: number
          skill_magic: number
          skill_melee: number
          skill_ranged: number
          skill_shield: number
          speed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archetype_id: string
          attack: number
          created_at?: string
          current_hp: number
          current_mana: number
          current_xp?: number
          defense: number
          equipped_amuleto?: string | null
          equipped_anel?: string | null
          equipped_arma?: string | null
          equipped_elmo?: string | null
          equipped_ofmao?: string | null
          equipped_peito?: string | null
          equipped_pernas?: string | null
          equipped_pes?: string | null
          id?: string
          is_active?: boolean
          level?: number
          max_hp: number
          max_mana: number
          name: string
          skill_fist?: number
          skill_magic?: number
          skill_melee?: number
          skill_ranged?: number
          skill_shield?: number
          speed: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archetype_id?: string
          attack?: number
          created_at?: string
          current_hp?: number
          current_mana?: number
          current_xp?: number
          defense?: number
          equipped_amuleto?: string | null
          equipped_anel?: string | null
          equipped_arma?: string | null
          equipped_elmo?: string | null
          equipped_ofmao?: string | null
          equipped_peito?: string | null
          equipped_pernas?: string | null
          equipped_pes?: string | null
          id?: string
          is_active?: boolean
          level?: number
          max_hp?: number
          max_mana?: number
          name?: string
          skill_fist?: number
          skill_magic?: number
          skill_melee?: number
          skill_ranged?: number
          skill_shield?: number
          speed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "archetypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_equipped_amuleto_fkey"
            columns: ["equipped_amuleto"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_equipped_anel_fkey"
            columns: ["equipped_anel"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_equipped_arma_fkey"
            columns: ["equipped_arma"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_equipped_elmo_fkey"
            columns: ["equipped_elmo"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_equipped_ofmao_fkey"
            columns: ["equipped_ofmao"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_equipped_peito_fkey"
            columns: ["equipped_peito"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_equipped_pernas_fkey"
            columns: ["equipped_pernas"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_equipped_pes_fkey"
            columns: ["equipped_pes"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          leader_character_id: string | null
          slot2_character_id: string | null
          slot3_character_id: string | null
          slots_unlocked: number
          updated_at: string
          user_id: string
        }
        Insert: {
          leader_character_id?: string | null
          slot2_character_id?: string | null
          slot3_character_id?: string | null
          slots_unlocked?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          leader_character_id?: string | null
          slot2_character_id?: string | null
          slot3_character_id?: string | null
          slots_unlocked?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_leader_character_id_fkey"
            columns: ["leader_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_slot2_character_id_fkey"
            columns: ["slot2_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_slot3_character_id_fkey"
            columns: ["slot3_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      enemies: {
        Row: {
          attack: number
          created_at: string
          defense: number
          gold_max: number
          gold_min: number
          hp: number
          id: string
          is_boss: boolean
          level: number
          name: string
          slug: string
          xp_reward: number
        }
        Insert: {
          attack: number
          created_at?: string
          defense: number
          gold_max?: number
          gold_min?: number
          hp: number
          id?: string
          is_boss?: boolean
          level?: number
          name: string
          slug: string
          xp_reward?: number
        }
        Update: {
          attack?: number
          created_at?: string
          defense?: number
          gold_max?: number
          gold_min?: number
          hp?: number
          id?: string
          is_boss?: boolean
          level?: number
          name?: string
          slug?: string
          xp_reward?: number
        }
        Relationships: []
      }
      incursions: {
        Row: {
          created_at: string
          current_wave: number
          ended_at: string | null
          expected_end_at: string
          id: string
          loop_enabled: boolean
          mode: Database["public"]["Enums"]["incursion_mode"]
          offline_minutes_used: number
          rewards_json: Json
          rng_seed: number
          started_at: string
          status: Database["public"]["Enums"]["incursion_status"]
          updated_at: string
          user_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          current_wave?: number
          ended_at?: string | null
          expected_end_at: string
          id?: string
          loop_enabled?: boolean
          mode?: Database["public"]["Enums"]["incursion_mode"]
          offline_minutes_used?: number
          rewards_json?: Json
          rng_seed: number
          started_at?: string
          status?: Database["public"]["Enums"]["incursion_status"]
          updated_at?: string
          user_id: string
          zone_id: string
        }
        Update: {
          created_at?: string
          current_wave?: number
          ended_at?: string | null
          expected_end_at?: string
          id?: string
          loop_enabled?: boolean
          mode?: Database["public"]["Enums"]["incursion_mode"]
          offline_minutes_used?: number
          rewards_json?: Json
          rng_seed?: number
          started_at?: string
          status?: Database["public"]["Enums"]["incursion_status"]
          updated_at?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incursions_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          created_at: string
          equipped_on_character: string | null
          id: string
          item_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          equipped_on_character?: string | null
          id?: string
          item_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          equipped_on_character?: string | null
          id?: string
          item_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_equipped_on_character_fkey"
            columns: ["equipped_on_character"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
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
          allowed_archetypes: string[]
          attack_bonus: number
          buyable: boolean
          created_at: string
          defense_bonus: number
          description: string
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
          speed_bonus: number
          tier: number
        }
        Insert: {
          allowed_archetypes?: string[]
          attack_bonus?: number
          buyable?: boolean
          created_at?: string
          defense_bonus?: number
          description?: string
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
          speed_bonus?: number
          tier?: number
        }
        Update: {
          allowed_archetypes?: string[]
          attack_bonus?: number
          buyable?: boolean
          created_at?: string
          defense_bonus?: number
          description?: string
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
          speed_bonus?: number
          tier?: number
        }
        Relationships: []
      }
      offline_reserves: {
        Row: {
          hunt_minutes_left: number
          last_tick_at: string
          train_minutes_left: number
          updated_at: string
          user_id: string
        }
        Insert: {
          hunt_minutes_left?: number
          last_tick_at?: string
          train_minutes_left?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          hunt_minutes_left?: number
          last_tick_at?: string
          train_minutes_left?: number
          updated_at?: string
          user_id?: string
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
      zone_waves: {
        Row: {
          enemy_count: number
          enemy_id: string
          id: string
          is_boss: boolean
          wave_number: number
          zone_id: string
        }
        Insert: {
          enemy_count?: number
          enemy_id: string
          id?: string
          is_boss?: boolean
          wave_number: number
          zone_id: string
        }
        Update: {
          enemy_count?: number
          enemy_id?: string
          id?: string
          is_boss?: boolean
          wave_number?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_waves_enemy_id_fkey"
            columns: ["enemy_id"]
            isOneToOne: false
            referencedRelation: "enemies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_waves_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          created_at: string
          description: string
          difficulty_stars: number
          duration_minutes: number
          id: string
          loot_multiplier: number
          name: string
          required_level: number
          slug: string
          sort_order: number
          xp_multiplier: number
        }
        Insert: {
          created_at?: string
          description: string
          difficulty_stars?: number
          duration_minutes?: number
          id?: string
          loot_multiplier?: number
          name: string
          required_level?: number
          slug: string
          sort_order?: number
          xp_multiplier?: number
        }
        Update: {
          created_at?: string
          description?: string
          difficulty_stars?: number
          duration_minutes?: number
          id?: string
          loot_multiplier?: number
          name?: string
          required_level?: number
          slug?: string
          sort_order?: number
          xp_multiplier?: number
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
      currency_type: "gold" | "premium"
      expedition_status: "running" | "ready" | "claimed" | "cancelled"
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
        | "elmo"
        | "peito"
        | "pernas"
        | "pes"
        | "amuleto"
        | "anel"
        | "ofmao"
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
      currency_type: ["gold", "premium"],
      expedition_status: ["running", "ready", "claimed", "cancelled"],
      guild_role: ["leader", "officer", "member"],
      incursion_mode: ["ativa", "vigilia", "treino"],
      incursion_status: ["em_andamento", "concluida", "falhou", "cancelada"],
      item_rarity: ["comum", "incomum", "raro", "epico", "lendario", "mitico"],
      item_slot: [
        "arma",
        "elmo",
        "peito",
        "pernas",
        "pes",
        "amuleto",
        "anel",
        "ofmao",
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
