export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: { id: string; key: string; value: string | null; updated_at: string }
        Insert: { id?: string; key: string; value?: string | null; updated_at?: string }
        Update: { key?: string; value?: string | null; updated_at?: string }
      }
      ingredients: {
        Row: {
          id: string; name: string; category: string | null; unit: string
          cost_per_unit: number; stock_on_hand: number; low_stock_threshold: number
          supplier_id: string | null; notes: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; name: string; category?: string | null; unit: string
          cost_per_unit: number; stock_on_hand?: number; low_stock_threshold?: number
          supplier_id?: string | null; notes?: string | null
        }
        Update: {
          name?: string; category?: string | null; unit?: string
          cost_per_unit?: number; stock_on_hand?: number; low_stock_threshold?: number
          supplier_id?: string | null; notes?: string | null
        }
      }
      ingredient_purchases: {
        Row: {
          id: string; ingredient_id: string | null; supplier_id: string | null
          quantity_purchased: number; unit: string; total_price_paid: number
          cost_per_unit_calculated: number | null; purchase_date: string
          notes: string | null; created_at: string
        }
        Insert: {
          id?: string; ingredient_id?: string | null; supplier_id?: string | null
          quantity_purchased: number; unit: string; total_price_paid: number
          purchase_date?: string; notes?: string | null
        }
        Update: {
          ingredient_id?: string | null; supplier_id?: string | null
          quantity_purchased?: number; unit?: string; total_price_paid?: number
          purchase_date?: string; notes?: string | null
        }
      }
      recipes: {
        Row: {
          id: string; name: string; category: string | null
          base_yield_units: number; yield_unit_label: string
          instructions: string | null; is_active: boolean; version: number
          notes: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; name: string; category?: string | null
          base_yield_units: number; yield_unit_label: string
          instructions?: string | null; is_active?: boolean; version?: number
          notes?: string | null
        }
        Update: {
          name?: string; category?: string | null
          base_yield_units?: number; yield_unit_label?: string
          instructions?: string | null; is_active?: boolean; version?: number
          notes?: string | null
        }
      }
      recipe_ingredients: {
        Row: {
          id: string; recipe_id: string | null; ingredient_id: string | null
          quantity: number; unit: string; notes: string | null
        }
        Insert: {
          id?: string; recipe_id?: string | null; ingredient_id?: string | null
          quantity: number; unit: string; notes?: string | null
        }
        Update: {
          recipe_id?: string | null; ingredient_id?: string | null
          quantity?: number; unit?: string; notes?: string | null
        }
      }
      products: {
        Row: {
          id: string; name: string; sku: string | null; category: string | null
          tier: string | null; recipe_id: string | null
          direct_price: number | null; cafe_price: number | null; cost_per_unit: number | null
          direct_margin: number | null; cafe_margin: number | null
          is_active: boolean; channel: string; notes: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; name: string; sku?: string | null; category?: string | null
          tier?: string | null; recipe_id?: string | null
          direct_price?: number | null; cafe_price?: number | null; cost_per_unit?: number | null
          is_active?: boolean; channel?: string; notes?: string | null
        }
        Update: {
          name?: string; sku?: string | null; category?: string | null
          tier?: string | null; recipe_id?: string | null
          direct_price?: number | null; cafe_price?: number | null; cost_per_unit?: number | null
          is_active?: boolean; channel?: string; notes?: string | null
        }
      }
      suppliers: {
        Row: {
          id: string; name: string; category: string | null; contact_name: string | null
          phone: string | null; email: string | null; address: string | null
          payment_terms: string | null; notes: string | null; is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string; name: string; category?: string | null; contact_name?: string | null
          phone?: string | null; email?: string | null; address?: string | null
          payment_terms?: string | null; notes?: string | null; is_active?: boolean
        }
        Update: {
          name?: string; category?: string | null; contact_name?: string | null
          phone?: string | null; email?: string | null; address?: string | null
          payment_terms?: string | null; notes?: string | null; is_active?: boolean
        }
      }
      supplier_payments: {
        Row: {
          id: string; supplier_id: string | null; amount: number
          description: string | null; due_date: string | null; paid_date: string | null
          status: string; created_at: string
        }
        Insert: {
          id?: string; supplier_id?: string | null; amount: number
          description?: string | null; due_date?: string | null; paid_date?: string | null
          status?: string
        }
        Update: {
          supplier_id?: string | null; amount?: number
          description?: string | null; due_date?: string | null; paid_date?: string | null
          status?: string
        }
      }
      customers: {
        Row: {
          id: string; name: string; phone: string | null; email: string | null
          instagram_handle: string | null; channel: string; referred_by: string | null
          on_whatsapp_list: boolean; on_email_list: boolean; brevo_contact_id: string | null
          total_orders: number; total_spend: number; last_order_date: string | null
          notes: string | null; is_active: boolean; created_at: string
        }
        Insert: {
          id?: string; name: string; phone?: string | null; email?: string | null
          instagram_handle?: string | null; channel?: string; referred_by?: string | null
          on_whatsapp_list?: boolean; on_email_list?: boolean; brevo_contact_id?: string | null
          total_orders?: number; total_spend?: number; last_order_date?: string | null
          notes?: string | null; is_active?: boolean
        }
        Update: {
          name?: string; phone?: string | null; email?: string | null
          instagram_handle?: string | null; channel?: string
          on_whatsapp_list?: boolean; on_email_list?: boolean
          total_orders?: number; total_spend?: number; last_order_date?: string | null
          notes?: string | null; is_active?: boolean
        }
      }
      orders: {
        Row: {
          id: string; order_number: string | null; customer_id: string | null
          order_date: string; status: string; channel: string | null
          subtotal: number | null; total: number | null; notes: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; order_number?: string | null; customer_id?: string | null
          order_date?: string; status?: string; channel?: string | null
          subtotal?: number | null; total?: number | null; notes?: string | null
        }
        Update: {
          order_number?: string | null; customer_id?: string | null
          order_date?: string; status?: string; channel?: string | null
          subtotal?: number | null; total?: number | null; notes?: string | null
        }
      }
      order_items: {
        Row: {
          id: string; order_id: string | null; product_id: string | null
          quantity: number; unit_price: number; line_total: number | null
        }
        Insert: {
          id?: string; order_id?: string | null; product_id?: string | null
          quantity: number; unit_price: number
        }
        Update: {
          order_id?: string | null; product_id?: string | null
          quantity?: number; unit_price?: number
        }
      }
      partners: {
        Row: {
          id: string; name: string; contact_name: string | null
          phone: string | null; email: string | null; address: string | null
          payment_terms: string; is_active: boolean; notes: string | null; created_at: string
        }
        Insert: {
          id?: string; name: string; contact_name?: string | null
          phone?: string | null; email?: string | null; address?: string | null
          payment_terms?: string; is_active?: boolean; notes?: string | null
        }
        Update: {
          name?: string; contact_name?: string | null
          phone?: string | null; email?: string | null; address?: string | null
          payment_terms?: string; is_active?: boolean; notes?: string | null
        }
      }
      partner_orders: {
        Row: {
          id: string; invoice_number: string | null; partner_id: string | null
          order_date: string; delivery_date: string | null; status: string
          subtotal: number | null; total: number | null
          due_date: string | null; paid_date: string | null
          notes: string | null; created_at: string
        }
        Insert: {
          id?: string; invoice_number?: string | null; partner_id?: string | null
          order_date?: string; delivery_date?: string | null; status?: string
          subtotal?: number | null; total?: number | null
          due_date?: string | null; paid_date?: string | null; notes?: string | null
        }
        Update: {
          invoice_number?: string | null; partner_id?: string | null
          order_date?: string; delivery_date?: string | null; status?: string
          subtotal?: number | null; total?: number | null
          due_date?: string | null; paid_date?: string | null; notes?: string | null
        }
      }
      partner_order_items: {
        Row: {
          id: string; partner_order_id: string | null; product_id: string | null
          quantity: number; unit_price: number; line_total: number | null
        }
        Insert: {
          id?: string; partner_order_id?: string | null; product_id?: string | null
          quantity: number; unit_price: number
        }
        Update: {
          partner_order_id?: string | null; product_id?: string | null
          quantity?: number; unit_price?: number
        }
      }
      production_batches: {
        Row: {
          id: string; batch_number: string | null; recipe_id: string | null
          product_id: string | null; production_date: string
          planned_yield: number | null; actual_yield: number | null
          batch_cost: number | null; cost_per_unit: number | null
          channel_allocation: string | null; qc_passed: boolean | null
          qc_notes: string | null; produced_by: string; notes: string | null; created_at: string
        }
        Insert: {
          id?: string; batch_number?: string | null; recipe_id?: string | null
          product_id?: string | null; production_date?: string
          planned_yield?: number | null; actual_yield?: number | null
          batch_cost?: number | null; channel_allocation?: string | null
          qc_passed?: boolean | null; qc_notes?: string | null
          produced_by?: string; notes?: string | null
        }
        Update: {
          batch_number?: string | null; recipe_id?: string | null
          product_id?: string | null; production_date?: string
          planned_yield?: number | null; actual_yield?: number | null
          batch_cost?: number | null; channel_allocation?: string | null
          qc_passed?: boolean | null; qc_notes?: string | null
          produced_by?: string; notes?: string | null
        }
      }
      production_qc_log: {
        Row: {
          id: string; batch_id: string | null; check_category: string | null
          check_name: string | null; passed: boolean | null
          notes: string | null; checked_at: string
        }
        Insert: {
          id?: string; batch_id?: string | null; check_category?: string | null
          check_name?: string | null; passed?: boolean | null; notes?: string | null
        }
        Update: {
          batch_id?: string | null; check_category?: string | null
          check_name?: string | null; passed?: boolean | null; notes?: string | null
        }
      }
      production_shopping_lists: {
        Row: {
          id: string; week_of: string | null; status: string
          notes: string | null; created_at: string
        }
        Insert: { id?: string; week_of?: string | null; status?: string; notes?: string | null }
        Update: { week_of?: string | null; status?: string; notes?: string | null }
      }
      shopping_list_items: {
        Row: {
          id: string; shopping_list_id: string | null; ingredient_id: string | null
          quantity_needed: number | null; unit: string | null
          estimated_cost: number | null; is_purchased: boolean
        }
        Insert: {
          id?: string; shopping_list_id?: string | null; ingredient_id?: string | null
          quantity_needed?: number | null; unit?: string | null
          estimated_cost?: number | null; is_purchased?: boolean
        }
        Update: {
          shopping_list_id?: string | null; ingredient_id?: string | null
          quantity_needed?: number | null; unit?: string | null
          estimated_cost?: number | null; is_purchased?: boolean
        }
      }
      ledger: {
        Row: {
          id: string; entry_date: string; type: string; category: string | null
          description: string; amount: number; reference_id: string | null
          reference_type: string | null; created_at: string
        }
        Insert: {
          id?: string; entry_date?: string; type: string; category?: string | null
          description: string; amount: number; reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          entry_date?: string; type?: string; category?: string | null
          description?: string; amount?: number; reference_id?: string | null
          reference_type?: string | null
        }
      }
      owner_draws: {
        Row: {
          id: string; draw_date: string; amount: number; approved: boolean
          rule_check_passed: boolean | null; rule_check_notes: string | null
          notes: string | null; created_at: string
        }
        Insert: {
          id?: string; draw_date?: string; amount: number; approved?: boolean
          rule_check_passed?: boolean | null; rule_check_notes?: string | null
          notes?: string | null
        }
        Update: {
          draw_date?: string; amount?: number; approved?: boolean
          rule_check_passed?: boolean | null; rule_check_notes?: string | null
          notes?: string | null
        }
      }
      reserves: {
        Row: {
          id: string; snapshot_date: string; total_cash: number | null
          operating_reserve: number | null; personal_float: number | null
          reserve_weeks_covered: number | null; notes: string | null; created_at: string
        }
        Insert: {
          id?: string; snapshot_date?: string; total_cash?: number | null
          operating_reserve?: number | null; personal_float?: number | null
          reserve_weeks_covered?: number | null; notes?: string | null
        }
        Update: {
          snapshot_date?: string; total_cash?: number | null
          operating_reserve?: number | null; personal_float?: number | null
          reserve_weeks_covered?: number | null; notes?: string | null
        }
      }
      goals: {
        Row: {
          id: string; period_type: string | null; period_label: string | null
          revenue_target: number | null; revenue_actual: number
          order_count_target: number | null; order_count_actual: number
          customer_count_target: number | null; customer_count_actual: number
          notes: string | null; created_at: string
        }
        Insert: {
          id?: string; period_type?: string | null; period_label?: string | null
          revenue_target?: number | null; revenue_actual?: number
          order_count_target?: number | null; order_count_actual?: number
          customer_count_target?: number | null; customer_count_actual?: number
          notes?: string | null
        }
        Update: {
          period_type?: string | null; period_label?: string | null
          revenue_target?: number | null; revenue_actual?: number
          order_count_target?: number | null; order_count_actual?: number
          customer_count_target?: number | null; customer_count_actual?: number
          notes?: string | null
        }
      }
      tax_entries: {
        Row: {
          id: string; entry_date: string; description: string | null
          amount: number | null; category: string | null; reference: string | null
          notes: string | null; created_at: string
        }
        Insert: {
          id?: string; entry_date?: string; description?: string | null
          amount?: number | null; category?: string | null; reference?: string | null
          notes?: string | null
        }
        Update: {
          entry_date?: string; description?: string | null
          amount?: number | null; category?: string | null; reference?: string | null
          notes?: string | null
        }
      }
      email_campaigns: {
        Row: {
          id: string; name: string; subject: string | null
          body_html: string | null; body_text: string | null
          campaign_type: string | null; brevo_campaign_id: string | null
          status: string; sent_at: string | null; recipient_count: number | null
          open_rate: number | null; notes: string | null; created_at: string
        }
        Insert: {
          id?: string; name: string; subject?: string | null
          body_html?: string | null; body_text?: string | null
          campaign_type?: string | null; brevo_campaign_id?: string | null
          status?: string; notes?: string | null
        }
        Update: {
          name?: string; subject?: string | null
          body_html?: string | null; body_text?: string | null
          campaign_type?: string | null; brevo_campaign_id?: string | null
          status?: string; sent_at?: string | null; recipient_count?: number | null
          open_rate?: number | null; notes?: string | null
        }
      }
      broadcasts: {
        Row: {
          id: string; broadcast_date: string; message_text: string
          products_featured: string[] | null; sent: boolean
          estimated_reach: number | null; notes: string | null; created_at: string
        }
        Insert: {
          id?: string; broadcast_date?: string; message_text: string
          products_featured?: string[] | null; sent?: boolean
          estimated_reach?: number | null; notes?: string | null
        }
        Update: {
          broadcast_date?: string; message_text?: string
          products_featured?: string[] | null; sent?: boolean
          estimated_reach?: number | null; notes?: string | null
        }
      }
      agent_runs: {
        Row: {
          id: string; agent_type: string; input_context: Json | null
          output: string | null; tokens_used: number | null; run_at: string
        }
        Insert: {
          id?: string; agent_type: string; input_context?: Json | null
          output?: string | null; tokens_used?: number | null
        }
        Update: {
          agent_type?: string; input_context?: Json | null
          output?: string | null; tokens_used?: number | null
        }
      }
    }
    Enums: Record<string, never>
    Functions: Record<string, never>
  }
}

// Convenience row-type exports
export type Setting = Database['public']['Tables']['settings']['Row']
export type Ingredient = Database['public']['Tables']['ingredients']['Row']
export type IngredientPurchase = Database['public']['Tables']['ingredient_purchases']['Row']
export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type SupplierPayment = Database['public']['Tables']['supplier_payments']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Partner = Database['public']['Tables']['partners']['Row']
export type PartnerOrder = Database['public']['Tables']['partner_orders']['Row']
export type PartnerOrderItem = Database['public']['Tables']['partner_order_items']['Row']
export type ProductionBatch = Database['public']['Tables']['production_batches']['Row']
export type ProductionQCLog = Database['public']['Tables']['production_qc_log']['Row']
export type ProductionShoppingList = Database['public']['Tables']['production_shopping_lists']['Row']
export type ShoppingListItem = Database['public']['Tables']['shopping_list_items']['Row']
export type LedgerEntry = Database['public']['Tables']['ledger']['Row']
export type OwnerDraw = Database['public']['Tables']['owner_draws']['Row']
export type Reserve = Database['public']['Tables']['reserves']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type TaxEntry = Database['public']['Tables']['tax_entries']['Row']
export type EmailCampaign = Database['public']['Tables']['email_campaigns']['Row']
export type Broadcast = Database['public']['Tables']['broadcasts']['Row']
export type AgentRun = Database['public']['Tables']['agent_runs']['Row']

// Business rule constants
export const MARGIN_RULES = {
  direct_floor: 55,
  direct_strong: 65,
  cafe_floor: 35,
  cafe_danger: 45,
} as const
