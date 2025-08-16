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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_transfers: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notes: string | null
          transfer_amount: number
          transfer_date: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          transfer_amount: number
          transfer_date: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          transfer_amount?: number
          transfer_date?: string
        }
        Relationships: []
      }
      branding_config: {
        Row: {
          company_description: string | null
          company_name: string
          created_at: string
          email_footer: string | null
          id: string
          logo_url: string | null
          primary_color: string
          purchase_email_subject: string | null
          purchase_email_template: string | null
          secondary_color: string
          social_facebook: string | null
          social_instagram: string | null
          social_whatsapp: string | null
          updated_at: string
          welcome_email_subject: string | null
          welcome_email_template: string | null
        }
        Insert: {
          company_description?: string | null
          company_name?: string
          created_at?: string
          email_footer?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          purchase_email_subject?: string | null
          purchase_email_template?: string | null
          secondary_color?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_whatsapp?: string | null
          updated_at?: string
          welcome_email_subject?: string | null
          welcome_email_template?: string | null
        }
        Update: {
          company_description?: string | null
          company_name?: string
          created_at?: string
          email_footer?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          purchase_email_subject?: string | null
          purchase_email_template?: string | null
          secondary_color?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_whatsapp?: string | null
          updated_at?: string
          welcome_email_subject?: string | null
          welcome_email_template?: string | null
        }
        Relationships: []
      }
      daily_closures: {
        Row: {
          closure_date: string
          created_at: string
          event_id: string
          final_balance: number
          id: string
          total_expense: number
          total_income: number
          updated_at: string
        }
        Insert: {
          closure_date: string
          created_at?: string
          event_id: string
          final_balance: number
          id?: string
          total_expense: number
          total_income: number
          updated_at?: string
        }
        Update: {
          closure_date?: string
          created_at?: string
          event_id?: string
          final_balance?: number
          id?: string
          total_expense?: number
          total_income?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_sessions: {
        Row: {
          available_tickets: number
          capacity: number
          created_at: string
          event_id: string
          id: string
          session_date: string
          show_time_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          available_tickets: number
          capacity: number
          created_at?: string
          event_id: string
          id?: string
          session_date: string
          show_time_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          available_tickets?: number
          capacity?: number
          created_at?: string
          event_id?: string
          id?: string
          session_date?: string
          show_time_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sessions_show_time_id_fkey"
            columns: ["show_time_id"]
            isOneToOne: false
            referencedRelation: "show_times"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      imported_sales: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          import_date: string
          reference: string
          source: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          import_date: string
          reference: string
          source?: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          import_date?: string
          reference?: string
          source?: string
        }
        Relationships: []
      }
      online_sales: {
        Row: {
          created_at: string
          event_id: string
          id: string
          platform_name: string
          quantity_refunded: number
          quantity_sold: number
          sale_date: string
          ticket_type: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          platform_name: string
          quantity_refunded?: number
          quantity_sold?: number
          sale_date: string
          ticket_type: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          platform_name?: string
          quantity_refunded?: number
          quantity_sold?: number
          sale_date?: string
          ticket_type?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      online_transfers: {
        Row: {
          created_at: string
          event_id: string | null
          expected_amount: number
          id: string
          notes: string | null
          platform_name: string
          received_amount: number | null
          received_date: string | null
          status: string
          transfer_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          expected_amount: number
          id?: string
          notes?: string | null
          platform_name: string
          received_amount?: number | null
          received_date?: string | null
          status?: string
          transfer_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          expected_amount?: number
          id?: string
          notes?: string | null
          platform_name?: string
          received_amount?: number | null
          received_date?: string | null
          status?: string
          transfer_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_transfers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          quantity: number
          subtotal: number
          ticket_type_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          quantity: number
          subtotal: number
          ticket_type_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          quantity?: number
          subtotal?: number
          ticket_type_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by: string | null
          customer_cpf: string
          customer_email: string
          customer_name: string
          id: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          session_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_cpf: string
          customer_email: string
          customer_name: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          session_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_cpf?: string
          customer_email?: string
          customer_name?: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          session_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          created_at: string
          id: string
          pagseguro_email: string | null
          pagseguro_environment: string | null
          pagseguro_token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          pagseguro_email?: string | null
          pagseguro_environment?: string | null
          pagseguro_token?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          pagseguro_email?: string | null
          pagseguro_environment?: string | null
          pagseguro_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nickname: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nickname?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nickname?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      show_times: {
        Row: {
          capacity: number
          created_at: string
          event_id: string
          id: string
          time_slot: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          event_id: string
          id?: string
          time_slot: string
        }
        Update: {
          capacity?: number
          created_at?: string
          event_id?: string
          id?: string
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "show_times_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      store_daily_sales: {
        Row: {
          commission_amount: number
          commission_paid: boolean | null
          created_at: string
          event_id: string
          id: string
          sale_date: string
          store_id: string
          total_sales: number
          updated_at: string
        }
        Insert: {
          commission_amount: number
          commission_paid?: boolean | null
          created_at?: string
          event_id: string
          id?: string
          sale_date: string
          store_id: string
          total_sales: number
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_paid?: boolean | null
          created_at?: string
          event_id?: string
          id?: string
          sale_date?: string
          store_id?: string
          total_sales?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_store_daily_sales_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_store_daily_sales_store"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          commission_percentage: number
          contact: string | null
          created_at: string
          id: string
          name: string
          responsible: string
          space_value: number
          updated_at: string
        }
        Insert: {
          commission_percentage?: number
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          responsible: string
          space_value?: number
          updated_at?: string
        }
        Update: {
          commission_percentage?: number
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          responsible?: string
          space_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          event_id: string
          id: string
          is_active: boolean
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          event_id: string
          id?: string
          is_active?: boolean
          name: string
          price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          event_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          id: string
          order_item_id: string
          qr_code: string
          status: string | null
          ticket_number: string
          updated_at: string
          used_at: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_item_id: string
          qr_code: string
          status?: string | null
          ticket_number: string
          updated_at?: string
          used_at?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_item_id?: string
          qr_code?: string
          status?: string | null
          ticket_number?: string
          updated_at?: string
          used_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      turnstiles: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          location: string | null
          name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          location?: string | null
          name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          location?: string | null
          name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_audit_logs: {
        Row: {
          action: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          session_id: string | null
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["system_permission"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["system_permission"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["system_permission"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          account_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      validations: {
        Row: {
          id: string
          notes: string | null
          ticket_id: string
          turnstile_id: string | null
          validated_at: string
          validation_method: string
          validator_user: string | null
        }
        Insert: {
          id?: string
          notes?: string | null
          ticket_id: string
          turnstile_id?: string | null
          validated_at?: string
          validation_method: string
          validator_user?: string | null
        }
        Update: {
          id?: string
          notes?: string | null
          ticket_id?: string
          turnstile_id?: string | null
          validated_at?: string
          validation_method?: string
          validator_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validations_turnstile_id_fkey"
            columns: ["turnstile_id"]
            isOneToOne: false
            referencedRelation: "turnstiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_old_pending_orders: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_qr_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["system_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_terminal_user: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_user_approved: {
        Args: { _user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { p_details?: Json; p_event_type: string }
        Returns: undefined
      }
      log_user_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_ip_address?: unknown
          p_session_id?: string
          p_user_agent?: string
          p_user_email: string
          p_user_id: string
        }
        Returns: string
      }
      promote_first_user_to_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      trigger_backup_now: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "master" | "terminal"
      system_permission:
        | "events_manage"
        | "tickets_manage"
        | "cash_daily"
        | "cash_general"
        | "stores_manage"
        | "online_sales"
        | "orders_view"
        | "payments_config"
        | "users_manage"
        | "dashboard_view"
      user_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user", "master", "terminal"],
      system_permission: [
        "events_manage",
        "tickets_manage",
        "cash_daily",
        "cash_general",
        "stores_manage",
        "online_sales",
        "orders_view",
        "payments_config",
        "users_manage",
        "dashboard_view",
      ],
      user_status: ["pending", "approved", "rejected"],
    },
  },
} as const
