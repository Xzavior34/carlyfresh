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
      basket_items: {
        Row: {
          basket_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number | null
        }
        Insert: {
          basket_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number | null
        }
        Update: {
          basket_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "basket_items_basket_id_fkey"
            columns: ["basket_id"]
            isOneToOne: false
            referencedRelation: "baskets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "basket_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      baskets: {
        Row: {
          composition_rules: Json | null
          created_at: string
          description: string | null
          id: string
          image: string | null
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          composition_rules?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          composition_rules?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          body: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          id: string
          message: string
          order_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          order_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          order_id?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      delivery_jobs: {
        Row: {
          claim_token: string | null
          created_at: string
          driver_id: string | null
          dropoff_address: string
          id: string
          order_id: string
          payout_amount: number
          pickup_address: string
          sla_deadline: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          claim_token?: string | null
          created_at?: string
          driver_id?: string | null
          dropoff_address?: string
          id?: string
          order_id: string
          payout_amount?: number
          pickup_address?: string
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          claim_token?: string | null
          created_at?: string
          driver_id?: string | null
          dropoff_address?: string
          id?: string
          order_id?: string
          payout_amount?: number
          pickup_address?: string
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_jobs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delivery_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          driver_id: string
          id: string
          latitude: number
          longitude: number
          updated_at: string
        }
        Insert: {
          driver_id: string
          id?: string
          latitude?: number
          longitude?: number
          updated_at?: string
        }
        Update: {
          driver_id?: string
          id?: string
          latitude?: number
          longitude?: number
          updated_at?: string
        }
        Relationships: []
      }
      driver_transactions: {
        Row: {
          created_at: string
          description: string
          driver_id: string
          gross_amount: number
          id: string
          net_amount: number
          platform_fee: number
          related_job_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          driver_id: string
          gross_amount?: number
          id?: string
          net_amount?: number
          platform_fee?: number
          related_job_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          driver_id?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          platform_fee?: number
          related_job_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_transactions_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "delivery_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_wallet: {
        Row: {
          balance: number
          created_at: string
          driver_id: string
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          driver_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          driver_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_withdrawals: {
        Row: {
          account_number: string
          admin_notes: string | null
          amount: number
          bank_name: string
          created_at: string
          driver_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          account_number: string
          admin_notes?: string | null
          amount: number
          bank_name: string
          created_at?: string
          driver_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          admin_notes?: string | null
          amount?: number
          bank_name?: string
          created_at?: string
          driver_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fulfillment_jobs: {
        Row: {
          created_at: string | null
          id: string
          items_json: Json | null
          order_id: string | null
          status: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items_json?: Json | null
          order_id?: string | null
          status?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items_json?: Json | null
          order_id?: string | null
          status?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_jobs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          read_status: boolean
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          read_status?: boolean
          title?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          read_status?: boolean
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          assigned_driver_id: string | null
          buyer_id: string
          created_at: string
          delivery_address: string
          delivery_window: string | null
          driver_assignment_deadline: string | null
          fulfillment_stage: string | null
          id: string
          items: Json
          metadata: Json | null
          order_number: number
          status: Database["public"]["Enums"]["order_status"]
          supplier_response_deadline: string | null
          total_amount: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          assigned_driver_id?: string | null
          buyer_id: string
          created_at?: string
          delivery_address?: string
          delivery_window?: string | null
          driver_assignment_deadline?: string | null
          fulfillment_stage?: string | null
          id?: string
          items?: Json
          metadata?: Json | null
          order_number?: number
          status?: Database["public"]["Enums"]["order_status"]
          supplier_response_deadline?: string | null
          total_amount?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          assigned_driver_id?: string | null
          buyer_id?: string
          created_at?: string
          delivery_address?: string
          delivery_window?: string | null
          driver_assignment_deadline?: string | null
          fulfillment_stage?: string | null
          id?: string
          items?: Json
          metadata?: Json | null
          order_number?: number
          status?: Database["public"]["Enums"]["order_status"]
          supplier_response_deadline?: string | null
          total_amount?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          buyer_id: string
          comment: string
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          buyer_id: string
          comment?: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          buyer_id?: string
          comment?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          b2b_price: number | null
          bulk_min_qty: number | null
          bulk_price: number | null
          category: string
          created_at: string
          description: string
          freshness_status: string | null
          handling_notes: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          is_bundle: boolean | null
          is_buyer_favourite: boolean | null
          is_featured: boolean | null
          name: string
          price: number
          price_per_unit: number
          stock_level: number
          unit_of_measurement: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          b2b_price?: number | null
          bulk_min_qty?: number | null
          bulk_price?: number | null
          category?: string
          created_at?: string
          description?: string
          freshness_status?: string | null
          handling_notes?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_bundle?: boolean | null
          is_buyer_favourite?: boolean | null
          is_featured?: boolean | null
          name: string
          price?: number
          price_per_unit?: number
          stock_level?: number
          unit_of_measurement?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          b2b_price?: number | null
          bulk_min_qty?: number | null
          bulk_price?: number | null
          category?: string
          created_at?: string
          description?: string
          freshness_status?: string | null
          handling_notes?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_bundle?: boolean | null
          is_buyer_favourite?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number
          price_per_unit?: number
          stock_level?: number
          unit_of_measurement?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          cold_chain_verified: boolean | null
          created_at: string
          driver_rating: number
          farm_location: string | null
          full_name: string | null
          id: string
          is_b2b_customer: boolean
          is_verified: boolean | null
          phone: string | null
          push_token: string | null
          supplier_rating: number | null
          supply_categories: string[] | null
          updated_at: string
          user_id: string
          vehicle_info: string | null
          virtual_account_number: string | null
          virtual_bank_name: string | null
          wallet_balance: number | null
        }
        Insert: {
          business_name?: string | null
          cold_chain_verified?: boolean | null
          created_at?: string
          driver_rating?: number
          farm_location?: string | null
          full_name?: string | null
          id?: string
          is_b2b_customer?: boolean
          is_verified?: boolean | null
          phone?: string | null
          push_token?: string | null
          supplier_rating?: number | null
          supply_categories?: string[] | null
          updated_at?: string
          user_id: string
          vehicle_info?: string | null
          virtual_account_number?: string | null
          virtual_bank_name?: string | null
          wallet_balance?: number | null
        }
        Update: {
          business_name?: string | null
          cold_chain_verified?: boolean | null
          created_at?: string
          driver_rating?: number
          farm_location?: string | null
          full_name?: string | null
          id?: string
          is_b2b_customer?: boolean
          is_verified?: boolean | null
          phone?: string | null
          push_token?: string | null
          supplier_rating?: number | null
          supply_categories?: string[] | null
          updated_at?: string
          user_id?: string
          vehicle_info?: string | null
          virtual_account_number?: string | null
          virtual_bank_name?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          description: string
          gross_amount: number
          id: string
          net_amount: number
          platform_fee: number
          related_order_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          platform_fee?: number
          related_order_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          description?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          platform_fee?: number
          related_order_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount_kobo: number
          balance_after_kobo: number | null
          created_at: string | null
          description: string | null
          id: string
          reference: string | null
          status: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount_kobo: number
          balance_after_kobo?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          reference?: string | null
          status?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount_kobo?: number
          balance_after_kobo?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          reference?: string | null
          status?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_holder_name: string | null
          account_number: string
          admin_notes: string | null
          amount: number
          bank_name: string
          created_at: string
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          account_holder_name?: string | null
          account_number: string
          admin_notes?: string | null
          amount: number
          bank_name: string
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string
          admin_notes?: string | null
          amount?: number
          bank_name?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_users_emails: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      claim_order: {
        Args: { p_driver_id: string; p_order_id: string }
        Returns: boolean
      }
      confirm_order_fulfillment:
        | {
            Args: {
              amount_paid: number
              gateway_reference: string
              target_order_id: number
            }
            Returns: boolean
          }
        | {
            Args: {
              amount_paid: number
              gateway_reference: string
              target_order_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              amount_paid: number
              gateway_reference: string
              target_order_identifier: string
            }
            Returns: boolean
          }
      confirm_order_via_client: {
        Args: {
          amount_paid: number
          gateway_reference: string
          target_order_identifier: string
        }
        Returns: boolean
      }
      create_withdrawal_request:
        | {
            Args: {
              account_holder_name: string
              account_number: string
              amount: number
              bank_name: string
              vendor_id: string
            }
            Returns: boolean
          }
        | {
            Args: { amount: number; bank_details?: Json; vendor_id: string }
            Returns: boolean
          }
      force_ping_test: { Args: never; Returns: undefined }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_wallet_balance: {
        Args: { p_amount_kobo: number; p_user_id: string }
        Returns: undefined
      }
      send_cart_notification: {
        Args: { p_message: string; p_user_id: string }
        Returns: undefined
      }
      test_push_notification: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "buyer" | "seller" | "driver" | "admin"
      job_status:
        | "available"
        | "accepted"
        | "in-transit"
        | "completed"
        | "awaiting_supplier"
        | "awaiting_driver"
        | "supplier_missed"
        | "pending"
        | "assigned"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "cancelled"
      order_status:
        | "pending"
        | "processing"
        | "packaged"
        | "in-transit"
        | "delivered"
        | "confirmed"
        | "preparing"
        | "paid"
        | "driver_assigned"
        | "cancelled"
        | "accepted"
      transaction_status: "completed" | "pending"
      transaction_type: "sale" | "commission" | "withdrawal"
      withdrawal_status: "pending" | "approved" | "rejected"
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
    Enums: {
      app_role: ["buyer", "seller", "driver", "admin"],
      job_status: [
        "available",
        "accepted",
        "in-transit",
        "completed",
        "awaiting_supplier",
        "awaiting_driver",
        "supplier_missed",
        "pending",
        "assigned",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      order_status: [
        "pending",
        "processing",
        "packaged",
        "in-transit",
        "delivered",
        "confirmed",
        "preparing",
        "paid",
        "driver_assigned",
        "cancelled",
        "accepted",
      ],
      transaction_status: ["completed", "pending"],
      transaction_type: ["sale", "commission", "withdrawal"],
      withdrawal_status: ["pending", "approved", "rejected"],
    },
  },
} as const
