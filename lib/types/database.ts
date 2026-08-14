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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_traffic_log: {
        Row: {
          bot_name: string
          created_at: string
          id: string
          path: string
          user_agent: string
        }
        Insert: {
          bot_name: string
          created_at?: string
          id?: string
          path: string
          user_agent: string
        }
        Update: {
          bot_name?: string
          created_at?: string
          id?: string
          path?: string
          user_agent?: string
        }
        Relationships: []
      }
      business_photos: {
        Row: {
          business_id: string
          id: string
          is_primary: boolean
          sort_order: number
          url: string
        }
        Insert: {
          business_id: string
          id?: string
          is_primary?: boolean
          sort_order?: number
          url: string
        }
        Update: {
          business_id?: string
          id?: string
          is_primary?: boolean
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_photos_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          booking_url: string | null
          category: Database["public"]["Enums"]["business_category"]
          city: string | null
          claim_status: Database["public"]["Enums"]["business_claim_status"]
          claimed_by: string | null
          consult_types: string[] | null
          created_at: string
          description: string | null
          facebook_url: string | null
          financing_options: string[] | null
          first_time_friendly: boolean
          hours: Json | null
          id: string
          instagram_url: string | null
          lat: number | null
          listing_tier: Database["public"]["Enums"]["listing_tier"]
          lng: number | null
          metro_id: string | null
          name: string
          phone: string | null
          responds_to_inquiries: boolean
          search_vector: unknown
          slug: string
          state: string | null
          subcategories: string[] | null
          tiktok_url: string | null
          updated_at: string
          verified: boolean
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          booking_url?: string | null
          category: Database["public"]["Enums"]["business_category"]
          city?: string | null
          claim_status?: Database["public"]["Enums"]["business_claim_status"]
          claimed_by?: string | null
          consult_types?: string[] | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          financing_options?: string[] | null
          first_time_friendly?: boolean
          hours?: Json | null
          id?: string
          instagram_url?: string | null
          lat?: number | null
          listing_tier?: Database["public"]["Enums"]["listing_tier"]
          lng?: number | null
          metro_id?: string | null
          name: string
          phone?: string | null
          responds_to_inquiries?: boolean
          search_vector?: unknown
          slug: string
          state?: string | null
          subcategories?: string[] | null
          tiktok_url?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          booking_url?: string | null
          category?: Database["public"]["Enums"]["business_category"]
          city?: string | null
          claim_status?: Database["public"]["Enums"]["business_claim_status"]
          claimed_by?: string | null
          consult_types?: string[] | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          financing_options?: string[] | null
          first_time_friendly?: boolean
          hours?: Json | null
          id?: string
          instagram_url?: string | null
          lat?: number | null
          listing_tier?: Database["public"]["Enums"]["listing_tier"]
          lng?: number | null
          metro_id?: string | null
          name?: string
          phone?: string | null
          responds_to_inquiries?: boolean
          search_vector?: unknown
          slug?: string
          state?: string | null
          subcategories?: string[] | null
          tiktok_url?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_metro_id_fkey"
            columns: ["metro_id"]
            isOneToOne: false
            referencedRelation: "metros"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_verifications: {
        Row: {
          attempts_count: number
          business_id: string
          claimant_user_id: string
          created_at: string
          document_url: string | null
          expires_at: string | null
          id: string
          method: Database["public"]["Enums"]["claim_method"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["claim_verification_status"]
          updated_at: string
        }
        Insert: {
          attempts_count?: number
          business_id: string
          claimant_user_id: string
          created_at?: string
          document_url?: string | null
          expires_at?: string | null
          id?: string
          method: Database["public"]["Enums"]["claim_method"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_verification_status"]
          updated_at?: string
        }
        Update: {
          attempts_count?: number
          business_id?: string
          claimant_user_id?: string
          created_at?: string
          document_url?: string | null
          expires_at?: string | null
          id?: string
          method?: Database["public"]["Enums"]["claim_method"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_verification_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_verifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      data_product_reports: {
        Row: {
          access_type: Database["public"]["Enums"]["access_type"] | null
          category: Database["public"]["Enums"]["business_category"] | null
          file_url: string | null
          generated_at: string
          id: string
          metro_id: string | null
          period_end: string | null
          period_start: string | null
          price: number | null
          purchased_by: string[] | null
          report_type: Database["public"]["Enums"]["report_type"]
          title: string
        }
        Insert: {
          access_type?: Database["public"]["Enums"]["access_type"] | null
          category?: Database["public"]["Enums"]["business_category"] | null
          file_url?: string | null
          generated_at?: string
          id?: string
          metro_id?: string | null
          period_end?: string | null
          period_start?: string | null
          price?: number | null
          purchased_by?: string[] | null
          report_type: Database["public"]["Enums"]["report_type"]
          title: string
        }
        Update: {
          access_type?: Database["public"]["Enums"]["access_type"] | null
          category?: Database["public"]["Enums"]["business_category"] | null
          file_url?: string | null
          generated_at?: string
          id?: string
          metro_id?: string | null
          period_end?: string | null
          period_start?: string | null
          price?: number | null
          purchased_by?: string[] | null
          report_type?: Database["public"]["Enums"]["report_type"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_product_reports_metro_id_fkey"
            columns: ["metro_id"]
            isOneToOne: false
            referencedRelation: "metros"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_charges: {
        Row: {
          amount: number
          business_id: string
          id: string
          lead_id: string
          status: string | null
          stripe_charge_id: string | null
        }
        Insert: {
          amount: number
          business_id: string
          id?: string
          lead_id: string
          status?: string | null
          stripe_charge_id?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          id?: string
          lead_id?: string
          status?: string | null
          stripe_charge_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_charges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_charges_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          business_id: string
          consumer_email: string | null
          consumer_name: string | null
          consumer_phone: string | null
          created_at: string
          id: string
          message: string | null
          referrer: string | null
          service_interest: string | null
          source_page: string | null
          status: Database["public"]["Enums"]["lead_status"]
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          business_id: string
          consumer_email?: string | null
          consumer_name?: string | null
          consumer_phone?: string | null
          created_at?: string
          id?: string
          message?: string | null
          referrer?: string | null
          service_interest?: string | null
          source_page?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          business_id?: string
          consumer_email?: string | null
          consumer_name?: string | null
          consumer_phone?: string | null
          created_at?: string
          id?: string
          message?: string | null
          referrer?: string | null
          service_interest?: string | null
          source_page?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      market_snapshots: {
        Row: {
          avg_price_max: number | null
          avg_price_min: number | null
          category: Database["public"]["Enums"]["business_category"] | null
          closed_listings_30d: number | null
          id: string
          lead_volume_30d: number | null
          listing_count: number | null
          median_price: number | null
          metro_id: string | null
          new_listings_30d: number | null
          price_sample_size: number | null
          snapshot_date: string
          subcategory: string | null
          top_requested_services: Json | null
        }
        Insert: {
          avg_price_max?: number | null
          avg_price_min?: number | null
          category?: Database["public"]["Enums"]["business_category"] | null
          closed_listings_30d?: number | null
          id?: string
          lead_volume_30d?: number | null
          listing_count?: number | null
          median_price?: number | null
          metro_id?: string | null
          new_listings_30d?: number | null
          price_sample_size?: number | null
          snapshot_date: string
          subcategory?: string | null
          top_requested_services?: Json | null
        }
        Update: {
          avg_price_max?: number | null
          avg_price_min?: number | null
          category?: Database["public"]["Enums"]["business_category"] | null
          closed_listings_30d?: number | null
          id?: string
          lead_volume_30d?: number | null
          listing_count?: number | null
          median_price?: number | null
          metro_id?: string | null
          new_listings_30d?: number | null
          price_sample_size?: number | null
          snapshot_date?: string
          subcategory?: string | null
          top_requested_services?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "market_snapshots_metro_id_fkey"
            columns: ["metro_id"]
            isOneToOne: false
            referencedRelation: "metros"
            referencedColumns: ["id"]
          },
        ]
      }
      metros: {
        Row: {
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          radius_miles: number
          slug: string
          state: string
        }
        Insert: {
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          radius_miles?: number
          slug: string
          state: string
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          radius_miles?: number
          slug?: string
          state?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string | null
          business_id: string
          id: string
          rating: number | null
          review_date: string | null
          review_text: string | null
          source: string
        }
        Insert: {
          author_name?: string | null
          business_id: string
          id?: string
          rating?: number | null
          review_date?: string | null
          review_text?: string | null
          source?: string
        }
        Update: {
          author_name?: string | null
          business_id?: string
          id?: string
          rating?: number | null
          review_date?: string | null
          review_text?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          category: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          price_max: number | null
          price_min: number | null
        }
        Insert: {
          business_id: string
          category?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          price_max?: number | null
          price_min?: number | null
        }
        Update: {
          business_id?: string
          category?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          price_max?: number | null
          price_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          current_period_end: string | null
          id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["listing_tier"]
        }
        Insert: {
          business_id: string
          current_period_end?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: Database["public"]["Enums"]["listing_tier"]
        }
        Update: {
          business_id?: string
          current_period_end?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["listing_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_business: {
        Args: { target_business_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      access_type: "one_time" | "subscription"
      business_category: "med_spa" | "iv_therapy" | "mens_health"
      business_claim_status: "unclaimed" | "pending_verification" | "verified" | "disputed"
      claim_method: "phone" | "email_domain" | "document"
      claim_verification_status: "pending" | "verified" | "rejected" | "disputed"
      lead_status: "new" | "contacted" | "converted" | "rejected"
      listing_tier: "free" | "verified" | "featured"
      report_type: "pricing_map" | "competitor_gap" | "market_movement"
      user_role: "consumer" | "business_owner" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_type: ["one_time", "subscription"],
      business_category: ["med_spa", "iv_therapy", "mens_health"],
      lead_status: ["new", "contacted", "converted", "rejected"],
      listing_tier: ["free", "verified", "featured"],
      report_type: ["pricing_map", "competitor_gap", "market_movement"],
      user_role: ["consumer", "business_owner", "admin"],
    },
  },
} as const
