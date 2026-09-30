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
      app_pricing: {
        Row: {
          category: string
          id: string
          is_active: boolean
          label: string | null
          price: number
          sub_category: string
          updated_at: string
        }
        Insert: {
          category: string
          id?: string
          is_active?: boolean
          label?: string | null
          price?: number
          sub_category: string
          updated_at?: string
        }
        Update: {
          category?: string
          id?: string
          is_active?: boolean
          label?: string | null
          price?: number
          sub_category?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_access: {
        Row: {
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          first_login: boolean
          id: string
          is_active: boolean
          password: string
          total_completed: number
          total_income: number
        }
        Insert: {
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          first_login?: boolean
          id?: string
          is_active?: boolean
          password: string
          total_completed?: number
          total_income?: number
        }
        Update: {
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          first_login?: boolean
          id?: string
          is_active?: boolean
          password?: string
          total_completed?: number
          total_income?: number
        }
        Relationships: []
      }
      drivers_live: {
        Row: {
          driver_id: string
          is_online: boolean
          lat: number | null
          lng: number | null
          updated_at: string
        }
        Insert: {
          driver_id: string
          is_online?: boolean
          lat?: number | null
          lng?: number | null
          updated_at?: string
        }
        Update: {
          driver_id?: string
          is_online?: boolean
          lat?: number | null
          lng?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          assigned_at: string | null
          brand: string | null
          client_popup_shown: boolean
          client_popup_state: string | null
          completed_at: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_details: string | null
          distance: string | null
          driver_id: string | null
          driver_lat: number | null
          driver_lng: number | null
          driver_name: string | null
          driver_phone: string | null
          driver_popup_shown: boolean
          driver_popup_state: string | null
          eta: string | null
          extra: Json
          id: string
          order_number: string
          order_type: string
          package_description: string | null
          package_type: string | null
          paxi_bag_type: string | null
          paxi_tracking: string | null
          payment_method: string
          pickup_address: string | null
          pickup_details: string | null
          proof_deleted_at: string | null
          proof_paths: string[]
          receiver_name: string | null
          receiver_phone: string | null
          status: string
          status_times: Json
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          assigned_at?: string | null
          brand?: string | null
          client_popup_shown?: boolean
          client_popup_state?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_details?: string | null
          distance?: string | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_popup_shown?: boolean
          driver_popup_state?: string | null
          eta?: string | null
          extra?: Json
          id?: string
          order_number: string
          order_type?: string
          package_description?: string | null
          package_type?: string | null
          paxi_bag_type?: string | null
          paxi_tracking?: string | null
          payment_method?: string
          pickup_address?: string | null
          pickup_details?: string | null
          proof_deleted_at?: string | null
          proof_paths?: string[]
          receiver_name?: string | null
          receiver_phone?: string | null
          status?: string
          status_times?: Json
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          assigned_at?: string | null
          brand?: string | null
          client_popup_shown?: boolean
          client_popup_state?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_details?: string | null
          distance?: string | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_popup_shown?: boolean
          driver_popup_state?: string | null
          eta?: string | null
          extra?: Json
          id?: string
          order_number?: string
          order_type?: string
          package_description?: string | null
          package_type?: string | null
          paxi_bag_type?: string | null
          paxi_tracking?: string | null
          payment_method?: string
          pickup_address?: string | null
          pickup_details?: string | null
          proof_deleted_at?: string | null
          proof_paths?: string[]
          receiver_name?: string | null
          receiver_phone?: string | null
          status?: string
          status_times?: Json
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          full_name: string | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
        }
        Update: {
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      refresh_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          section: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          section?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          section?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          location: string | null
          name: string
          order_number: string | null
          photo_url: string | null
          rating: number
          service: string | null
          text: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          location?: string | null
          name: string
          order_number?: string | null
          photo_url?: string | null
          rating?: number
          service?: string | null
          text: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          order_number?: string | null
          photo_url?: string | null
          rating?: number
          service?: string | null
          text?: string
        }
        Relationships: []
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
