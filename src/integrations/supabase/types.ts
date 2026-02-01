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
      articles: {
        Row: {
          content_catalan: Json | null
          content_spanish: Json | null
          day_of_month: number | null
          generated_at: string
          id: string
          image_photographer: string | null
          image_photographer_url: string | null
          image_url: string | null
          month: number
          pexels_query: string | null
          site_id: string
          topic: string
          user_id: string
          week_of_month: number | null
          year: number
        }
        Insert: {
          content_catalan?: Json | null
          content_spanish?: Json | null
          day_of_month?: number | null
          generated_at?: string
          id?: string
          image_photographer?: string | null
          image_photographer_url?: string | null
          image_url?: string | null
          month: number
          pexels_query?: string | null
          site_id: string
          topic: string
          user_id: string
          week_of_month?: number | null
          year: number
        }
        Update: {
          content_catalan?: Json | null
          content_spanish?: Json | null
          day_of_month?: number | null
          generated_at?: string
          id?: string
          image_photographer?: string | null
          image_photographer_url?: string | null
          image_url?: string | null
          month?: number
          pexels_query?: string | null
          site_id?: string
          topic?: string
          user_id?: string
          week_of_month?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
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
      beta_invitations: {
        Row: {
          created_at: string
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          token: string
        }
        Insert: {
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          token: string
        }
        Update: {
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          token?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          audience: string
          author_avatar: string | null
          author_name: string
          author_role: string | null
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          image_url: string | null
          is_published: boolean
          published_at: string
          read_time: string
          seo_keywords: string[] | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          author_avatar?: string | null
          author_name?: string
          author_role?: string | null
          category?: string
          content: string
          created_at?: string
          excerpt: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string
          read_time?: string
          seo_keywords?: string[] | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          author_avatar?: string | null
          author_name?: string
          author_role?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string
          read_time?: string
          seo_keywords?: string[] | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          auto_generate: boolean
          blog_url: string | null
          created_at: string
          custom_topic: string | null
          description: string | null
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
          description?: string | null
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
          description?: string | null
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
      knowledge_base: {
        Row: {
          category: string
          cause: string | null
          created_at: string | null
          error_code: string | null
          help_url: string | null
          id: string
          keywords: string[] | null
          priority: string | null
          related_plugins: string[] | null
          slug: string
          snippet_code: string | null
          solution: string
          solution_steps: Json | null
          subcategory: string | null
          symptoms: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          cause?: string | null
          created_at?: string | null
          error_code?: string | null
          help_url?: string | null
          id?: string
          keywords?: string[] | null
          priority?: string | null
          related_plugins?: string[] | null
          slug: string
          snippet_code?: string | null
          solution: string
          solution_steps?: Json | null
          subcategory?: string | null
          symptoms?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          cause?: string | null
          created_at?: string | null
          error_code?: string | null
          help_url?: string | null
          id?: string
          keywords?: string[] | null
          priority?: string | null
          related_plugins?: string[] | null
          slug?: string
          snippet_code?: string | null
          solution?: string
          solution_steps?: Json | null
          subcategory?: string | null
          symptoms?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          audience: string | null
          consent_date: string | null
          created_at: string
          email: string
          gdpr_consent: boolean | null
          id: string
          is_active: boolean
          marketing_consent: boolean | null
          name: string | null
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          audience?: string | null
          consent_date?: string | null
          created_at?: string
          email: string
          gdpr_consent?: boolean | null
          id?: string
          is_active?: boolean
          marketing_consent?: boolean | null
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          audience?: string | null
          consent_date?: string | null
          created_at?: string
          email?: string
          gdpr_consent?: boolean | null
          id?: string
          is_active?: boolean
          marketing_consent?: boolean | null
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      pending_surveys: {
        Row: {
          id: string
          survey_id: string
          trigger_event: string | null
          triggered_at: string
          user_id: string
        }
        Insert: {
          id?: string
          survey_id: string
          trigger_event?: string | null
          triggered_at?: string
          user_id: string
        }
        Update: {
          id?: string
          survey_id?: string
          trigger_event?: string | null
          triggered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_surveys_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          beta_expires_at: string | null
          beta_invitation_id: string | null
          beta_started_at: string | null
          created_at: string
          email: string
          id: string
          is_beta: boolean | null
          onboarding_completed: boolean | null
          plan: string
          posts_limit: number
          sites_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          beta_expires_at?: string | null
          beta_invitation_id?: string | null
          beta_started_at?: string | null
          created_at?: string
          email: string
          id?: string
          is_beta?: boolean | null
          onboarding_completed?: boolean | null
          plan?: string
          posts_limit?: number
          sites_limit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          beta_expires_at?: string | null
          beta_invitation_id?: string | null
          beta_started_at?: string | null
          created_at?: string
          email?: string
          id?: string
          is_beta?: boolean | null
          onboarding_completed?: boolean | null
          plan?: string
          posts_limit?: number
          sites_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_beta_invitation_id_fkey"
            columns: ["beta_invitation_id"]
            isOneToOne: false
            referencedRelation: "beta_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_contexts: {
        Row: {
          created_at: string
          fallback_query: string
          id: string
          image_examples: string[]
          prohibited_terms: string[]
          sector_key: string
          sector_keywords: string[]
          tone_description: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fallback_query: string
          id?: string
          image_examples?: string[]
          prohibited_terms?: string[]
          sector_key: string
          sector_keywords?: string[]
          tone_description?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fallback_query?: string
          id?: string
          image_examples?: string[]
          prohibited_terms?: string[]
          sector_key?: string
          sector_keywords?: string[]
          tone_description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          auto_generate: boolean
          blog_url: string | null
          created_at: string
          custom_topic: string | null
          description: string | null
          geographic_scope: string
          id: string
          include_featured_image: boolean
          instagram_url: string | null
          languages: string[]
          location: string | null
          name: string
          publish_day_of_month: number | null
          publish_day_of_week: number | null
          publish_frequency: string
          publish_hour_utc: number | null
          publish_week_of_month: number | null
          sector: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_generate?: boolean
          blog_url?: string | null
          created_at?: string
          custom_topic?: string | null
          description?: string | null
          geographic_scope?: string
          id?: string
          include_featured_image?: boolean
          instagram_url?: string | null
          languages?: string[]
          location?: string | null
          name: string
          publish_day_of_month?: number | null
          publish_day_of_week?: number | null
          publish_frequency?: string
          publish_hour_utc?: number | null
          publish_week_of_month?: number | null
          sector?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_generate?: boolean
          blog_url?: string | null
          created_at?: string
          custom_topic?: string | null
          description?: string | null
          geographic_scope?: string
          id?: string
          include_featured_image?: boolean
          instagram_url?: string | null
          languages?: string[]
          location?: string | null
          name?: string
          publish_day_of_month?: number | null
          publish_day_of_week?: number | null
          publish_frequency?: string
          publish_hour_utc?: number | null
          publish_week_of_month?: number | null
          sector?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          created_at: string | null
          error_context: Json | null
          id: string
          resolved_at: string | null
          site_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_context?: Json | null
          id?: string
          resolved_at?: string | null
          site_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_context?: Json | null
          id?: string
          resolved_at?: string | null
          site_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          suggested_articles: string[] | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          suggested_articles?: string[] | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          suggested_articles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          completed_at: string
          id: string
          responses: Json
          survey_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          responses: Json
          survey_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          responses?: Json
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          questions: Json
          trigger_days_offset: number
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          questions: Json
          trigger_days_offset?: number
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          questions?: Json
          trigger_days_offset?: number
          trigger_type?: string
          updated_at?: string
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
      wordpress_configs: {
        Row: {
          created_at: string
          id: string
          site_id: string
          site_url: string
          updated_at: string
          user_id: string
          wp_app_password: string
          wp_username: string
        }
        Insert: {
          created_at?: string
          id?: string
          site_id: string
          site_url: string
          updated_at?: string
          user_id: string
          wp_app_password: string
          wp_username: string
        }
        Update: {
          created_at?: string
          id?: string
          site_id?: string
          site_url?: string
          updated_at?: string
          user_id?: string
          wp_app_password?: string
          wp_username?: string
        }
        Relationships: [
          {
            foreignKeyName: "wordpress_configs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      wordpress_site_default_taxonomies: {
        Row: {
          created_at: string
          id: string
          taxonomy_id: string
          wordpress_site_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          taxonomy_id: string
          wordpress_site_id: string
        }
        Update: {
          created_at?: string
          id?: string
          taxonomy_id?: string
          wordpress_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wordpress_site_default_taxonomies_taxonomy_id_fkey"
            columns: ["taxonomy_id"]
            isOneToOne: false
            referencedRelation: "wordpress_taxonomies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wordpress_site_default_taxonomies_wordpress_site_id_fkey"
            columns: ["wordpress_site_id"]
            isOneToOne: false
            referencedRelation: "wordpress_sites"
            referencedColumns: ["id"]
          },
        ]
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
      wordpress_taxonomies: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string | null
          taxonomy_type: string
          wordpress_site_id: string
          wp_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          taxonomy_type: string
          wordpress_site_id: string
          wp_id: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
          taxonomy_type?: string
          wordpress_site_id?: string
          wp_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "wordpress_taxonomies_wordpress_site_id_fkey"
            columns: ["wordpress_site_id"]
            isOneToOne: false
            referencedRelation: "wordpress_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      wordpress_taxonomies_saas: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string | null
          taxonomy_type: string
          user_id: string
          wordpress_config_id: string
          wp_id: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug?: string | null
          taxonomy_type: string
          user_id: string
          wordpress_config_id: string
          wp_id: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string | null
          taxonomy_type?: string
          user_id?: string
          wordpress_config_id?: string
          wp_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "wordpress_taxonomies_saas_wordpress_config_id_fkey"
            columns: ["wordpress_config_id"]
            isOneToOne: false
            referencedRelation: "wordpress_configs"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "mkpro_admin" | "user" | "superadmin" | "beta"
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
      app_role: ["admin", "mkpro_admin", "user", "superadmin", "beta"],
    },
  },
} as const
