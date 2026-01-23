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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      articulos: {
        Row: {
          content_catalan: Json | null
          content_spanish: Json | null
          farmacia_id: string
          generated_at: string
          id: string
          image_photographer: string | null
          image_photographer_url: string | null
          image_url: string | null
          month: number
          pexels_query: string | null
          topic: string
          year: number
        }
        Insert: {
          content_catalan?: Json | null
          content_spanish?: Json | null
          farmacia_id: string
          generated_at?: string
          id?: string
          image_photographer?: string | null
          image_photographer_url?: string | null
          image_url?: string | null
          month: number
          pexels_query?: string | null
          topic: string
          year: number
        }
        Update: {
          content_catalan?: Json | null
          content_spanish?: Json | null
          farmacia_id?: string
          generated_at?: string
          id?: string
          image_photographer?: string | null
          image_photographer_url?: string | null
          image_url?: string | null
          month?: number
          pexels_query?: string | null
          topic?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "articulos_farmacia_id_fkey"
            columns: ["farmacia_id"]
            isOneToOne: false
            referencedRelation: "farmacias"
            referencedColumns: ["id"]
          },
        ]
      }
      articulos_empresas: {
        Row: {
          content_catalan: Json | null
          content_spanish: Json | null
          day_of_month: number | null
          empresa_id: string
          generated_at: string
          id: string
          image_photographer: string | null
          image_photographer_url: string | null
          image_url: string | null
          month: number
          pexels_query: string | null
          topic: string
          week_of_month: number | null
          year: number
        }
        Insert: {
          content_catalan?: Json | null
          content_spanish?: Json | null
          day_of_month?: number | null
          empresa_id: string
          generated_at?: string
          id?: string
          image_photographer?: string | null
          image_photographer_url?: string | null
          image_url?: string | null
          month: number
          pexels_query?: string | null
          topic: string
          week_of_month?: number | null
          year: number
        }
        Update: {
          content_catalan?: Json | null
          content_spanish?: Json | null
          day_of_month?: number | null
          empresa_id?: string
          generated_at?: string
          id?: string
          image_photographer?: string | null
          image_photographer_url?: string | null
          image_url?: string | null
          month?: number
          pexels_query?: string | null
          topic?: string
          week_of_month?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "articulos_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          auto_generate: boolean
          blog_url: string | null
          created_at: string
          custom_topic: string | null
          geographic_scope: string
          id: string
          include_featured_image: boolean
          instagram_url: string | null
          languages: string[]
          location: string | null
          name: string
          publish_frequency: string
          sector: string | null
          updated_at: string
        }
        Insert: {
          auto_generate?: boolean
          blog_url?: string | null
          created_at?: string
          custom_topic?: string | null
          geographic_scope?: string
          id?: string
          include_featured_image?: boolean
          instagram_url?: string | null
          languages?: string[]
          location?: string | null
          name: string
          publish_frequency?: string
          sector?: string | null
          updated_at?: string
        }
        Update: {
          auto_generate?: boolean
          blog_url?: string | null
          created_at?: string
          custom_topic?: string | null
          geographic_scope?: string
          id?: string
          include_featured_image?: boolean
          instagram_url?: string | null
          languages?: string[]
          location?: string | null
          name?: string
          publish_frequency?: string
          sector?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      farmacias: {
        Row: {
          auto_generate: boolean
          blog_url: string | null
          created_at: string
          custom_topic: string | null
          id: string
          instagram_url: string | null
          languages: string[]
          location: string
          name: string
          updated_at: string
        }
        Insert: {
          auto_generate?: boolean
          blog_url?: string | null
          created_at?: string
          custom_topic?: string | null
          id?: string
          instagram_url?: string | null
          languages?: string[]
          location: string
          name: string
          updated_at?: string
        }
        Update: {
          auto_generate?: boolean
          blog_url?: string | null
          created_at?: string
          custom_topic?: string | null
          id?: string
          instagram_url?: string | null
          languages?: string[]
          location?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      wordpress_sites: {
        Row: {
          created_at: string
          empresa_id: string | null
          farmacia_id: string | null
          id: string
          site_url: string
          updated_at: string
          wp_app_password: string
          wp_username: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          farmacia_id?: string | null
          id?: string
          site_url: string
          updated_at?: string
          wp_app_password: string
          wp_username: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          farmacia_id?: string | null
          id?: string
          site_url?: string
          updated_at?: string
          wp_app_password?: string
          wp_username?: string
        }
        Relationships: [
          {
            foreignKeyName: "wordpress_sites_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wordpress_sites_farmacia_id_fkey"
            columns: ["farmacia_id"]
            isOneToOne: true
            referencedRelation: "farmacias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
