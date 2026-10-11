
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "assets": {
                  Row: {
                    "brand": string | null,"company_id": string,"created_at": string,"id": string,"kind": string,"model": string | null,"serial": string | null,"site_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand"?: string | null,"company_id"?: string,"created_at"?: string,"id"?: string,"kind": string,"model"?: string | null,"serial"?: string | null,"site_id": string
                  }
                  Update: {
                    "brand"?: string | null,"company_id"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"model"?: string | null,"serial"?: string | null,"site_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "assets_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assets_site_id_fkey"
      columns: ["site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["id"]
    }
                  ]
                },"attachments": {
                  Row: {
                    "company_id": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["attachment_kind"],"storage_path": string,"work_order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["attachment_kind"],"storage_path": string,"work_order_id": string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["attachment_kind"],"storage_path"?: string,"work_order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attachments_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attachments_work_order_id_fkey"
      columns: ["work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["id"]
    }
                  ]
                },"companies": {
                  Row: {
                    "created_at": string,"id": string,"logo_url": string | null,"name": string,"nit": string | null,"plan": string,"subscription_status": Database["public"]['Enums']["subscription_status"],"trial_ends_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"logo_url"?: string | null,"name": string,"nit"?: string | null,"plan"?: string,"subscription_status"?: Database["public"]['Enums']["subscription_status"],"trial_ends_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"logo_url"?: string | null,"name"?: string,"nit"?: string | null,"plan"?: string,"subscription_status"?: Database["public"]['Enums']["subscription_status"],"trial_ends_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"company_counters": {
                  Row: {
                    "company_id": string,"last_value": number,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"last_value"?: number,"name": string
                  }
                  Update: {
                    "company_id"?: string,"last_value"?: number,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "company_counters_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"customers": {
                  Row: {
                    "company_id": string,"created_at": string,"data_consent_at": string | null,"document_id": string | null,"email": string | null,"id": string,"name": string,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string,"created_at"?: string,"data_consent_at"?: string | null,"document_id"?: string | null,"email"?: string | null,"id"?: string,"name": string,"whatsapp"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"data_consent_at"?: string | null,"document_id"?: string | null,"email"?: string | null,"id"?: string,"name"?: string,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "customers_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"materials": {
                  Row: {
                    "active": boolean,"company_id": string,"created_at": string,"id": string,"name": string,"price": number,"unit": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"company_id"?: string,"created_at"?: string,"id"?: string,"name": string,"price"?: number,"unit"?: string
                  }
                  Update: {
                    "active"?: boolean,"company_id"?: string,"created_at"?: string,"id"?: string,"name"?: string,"price"?: number,"unit"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "materials_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "channel": Database["public"]['Enums']["message_channel"],"company_id": string,"cost_usd": number,"created_at": string,"id": string,"status": Database["public"]['Enums']["message_status"],"template": string,"work_order_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "channel": Database["public"]['Enums']["message_channel"],"company_id"?: string,"cost_usd"?: number,"created_at"?: string,"id"?: string,"status"?: Database["public"]['Enums']["message_status"],"template": string,"work_order_id"?: string | null
                  }
                  Update: {
                    "channel"?: Database["public"]['Enums']["message_channel"],"company_id"?: string,"cost_usd"?: number,"created_at"?: string,"id"?: string,"status"?: Database["public"]['Enums']["message_status"],"template"?: string,"work_order_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_work_order_id_fkey"
      columns: ["work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "active": boolean,"company_id": string,"created_at": string,"full_name": string,"id": string,"phone": string | null,"role": Database["public"]['Enums']["user_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"company_id": string,"created_at"?: string,"full_name": string,"id": string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "active"?: boolean,"company_id"?: string,"created_at"?: string,"full_name"?: string,"id"?: string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"quote_items": {
                  Row: {
                    "company_id": string,"description": string,"id": string,"kind": Database["public"]['Enums']["item_kind"],"material_id": string | null,"quantity": number,"quote_id": string,"unit_price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string,"description": string,"id"?: string,"kind": Database["public"]['Enums']["item_kind"],"material_id"?: string | null,"quantity"?: number,"quote_id": string,"unit_price"?: number
                  }
                  Update: {
                    "company_id"?: string,"description"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["item_kind"],"material_id"?: string | null,"quantity"?: number,"quote_id"?: string,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "quote_items_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_items_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "materials"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_items_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    }
                  ]
                },"quotes": {
                  Row: {
                    "company_id": string,"created_at": string,"customer_id": string,"id": string,"number": number,"site_id": string | null,"status": Database["public"]['Enums']["quote_status"],"total": number,"valid_until": string | null,"work_order_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string,"created_at"?: string,"customer_id": string,"id"?: string,"number": number,"site_id"?: string | null,"status"?: Database["public"]['Enums']["quote_status"],"total"?: number,"valid_until"?: string | null,"work_order_id"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"customer_id"?: string,"id"?: string,"number"?: number,"site_id"?: string | null,"status"?: Database["public"]['Enums']["quote_status"],"total"?: number,"valid_until"?: string | null,"work_order_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotes_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_site_id_fkey"
      columns: ["site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_work_order_id_fkey"
      columns: ["work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["id"]
    }
                  ]
                },"service_types": {
                  Row: {
                    "checklist": NonNullable<Json>,"company_id": string,"created_at": string,"estimated_minutes": number,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checklist"?: NonNullable<Json>,"company_id"?: string,"created_at"?: string,"estimated_minutes"?: number,"id"?: string,"name": string
                  }
                  Update: {
                    "checklist"?: NonNullable<Json>,"company_id"?: string,"created_at"?: string,"estimated_minutes"?: number,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_types_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"sites": {
                  Row: {
                    "access_notes": string | null,"address": string,"company_id": string,"created_at": string,"customer_id": string,"id": string,"lat": number | null,"lng": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "access_notes"?: string | null,"address": string,"company_id"?: string,"created_at"?: string,"customer_id": string,"id"?: string,"lat"?: number | null,"lng"?: number | null
                  }
                  Update: {
                    "access_notes"?: string | null,"address"?: string,"company_id"?: string,"created_at"?: string,"customer_id"?: string,"id"?: string,"lat"?: number | null,"lng"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "sites_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sites_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"work_order_events": {
                  Row: {
                    "company_id": string,"created_at": string,"data": NonNullable<Json>,"id": string,"kind": string,"lat": number | null,"lng": number | null,"user_id": string | null,"work_order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string,"created_at"?: string,"data"?: NonNullable<Json>,"id"?: string,"kind": string,"lat"?: number | null,"lng"?: number | null,"user_id"?: string | null,"work_order_id": string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"data"?: NonNullable<Json>,"id"?: string,"kind"?: string,"lat"?: number | null,"lng"?: number | null,"user_id"?: string | null,"work_order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_order_events_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_order_events_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_order_events_work_order_id_fkey"
      columns: ["work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["id"]
    }
                  ]
                },"work_order_items": {
                  Row: {
                    "company_id": string,"created_at": string,"description": string,"id": string,"kind": Database["public"]['Enums']["item_kind"],"material_id": string | null,"quantity": number,"unit_price": number,"work_order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string,"created_at"?: string,"description": string,"id"?: string,"kind": Database["public"]['Enums']["item_kind"],"material_id"?: string | null,"quantity"?: number,"unit_price"?: number,"work_order_id": string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"description"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["item_kind"],"material_id"?: string | null,"quantity"?: number,"unit_price"?: number,"work_order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_order_items_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_order_items_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "materials"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_order_items_work_order_id_fkey"
      columns: ["work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["id"]
    }
                  ]
                },"work_orders": {
                  Row: {
                    "asset_id": string | null,"checklist": NonNullable<Json>,"company_id": string,"completed_at": string | null,"created_at": string,"customer_id": string,"description": string | null,"id": string,"number": number,"priority": Database["public"]['Enums']["work_order_priority"],"report_token": string,"scheduled_end": string | null,"scheduled_start": string | null,"service_type_id": string | null,"site_id": string | null,"status": Database["public"]['Enums']["work_order_status"],"technician_id": string | null,"total": number
                  }
                  ComputedFields: never
                  Insert: {
                    "asset_id"?: string | null,"checklist"?: NonNullable<Json>,"company_id"?: string,"completed_at"?: string | null,"created_at"?: string,"customer_id": string,"description"?: string | null,"id"?: string,"number": number,"priority"?: Database["public"]['Enums']["work_order_priority"],"report_token"?: string,"scheduled_end"?: string | null,"scheduled_start"?: string | null,"service_type_id"?: string | null,"site_id"?: string | null,"status"?: Database["public"]['Enums']["work_order_status"],"technician_id"?: string | null,"total"?: number
                  }
                  Update: {
                    "asset_id"?: string | null,"checklist"?: NonNullable<Json>,"company_id"?: string,"completed_at"?: string | null,"created_at"?: string,"customer_id"?: string,"description"?: string | null,"id"?: string,"number"?: number,"priority"?: Database["public"]['Enums']["work_order_priority"],"report_token"?: string,"scheduled_end"?: string | null,"scheduled_start"?: string | null,"service_type_id"?: string | null,"site_id"?: string | null,"status"?: Database["public"]['Enums']["work_order_status"],"technician_id"?: string | null,"total"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_orders_asset_id_fkey"
      columns: ["asset_id"]
isOneToOne: false
      referencedRelation: "assets"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_orders_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_orders_service_type_id_fkey"
      columns: ["service_type_id"]
isOneToOne: false
      referencedRelation: "service_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_orders_site_id_fkey"
      columns: ["site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_orders_technician_id_fkey"
      columns: ["technician_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_access_work_order":
{ Args: { "wo": string }; Returns: boolean
                           },
"create_company":
{ Args: { "p_full_name": string,"p_name": string,"p_nit"?: string }; Returns: string
                           },
"current_company_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"current_role_is":
{ Args: { "roles": (Database["public"]['Enums']["user_role"])[] }; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"next_number":
{ Args: { "p_company": string,"p_name": string }; Returns: number
                           },
"public_report":
{ Args: { "p_token": string }; Returns: Json
                           }
          }
          Enums: {
            "attachment_kind": "photo_before"|"photo_after"|"signature"|"other","item_kind": "material"|"labor","message_channel": "whatsapp_link"|"whatsapp_api"|"email","message_status": "queued"|"sent"|"delivered"|"read"|"failed","quote_status": "draft"|"sent"|"approved"|"rejected"|"expired","subscription_status": "trial"|"active"|"past_due"|"canceled","user_role": "owner"|"dispatcher"|"technician","work_order_priority": "low"|"normal"|"high"|"urgent","work_order_status": "pending"|"assigned"|"en_route"|"in_progress"|"completed"|"canceled"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "attachment_kind": ["photo_before", "photo_after", "signature", "other"],"item_kind": ["material", "labor"],"message_channel": ["whatsapp_link", "whatsapp_api", "email"],"message_status": ["queued", "sent", "delivered", "read", "failed"],"quote_status": ["draft", "sent", "approved", "rejected", "expired"],"subscription_status": ["trial", "active", "past_due", "canceled"],"user_role": ["owner", "dispatcher", "technician"],"work_order_priority": ["low", "normal", "high", "urgent"],"work_order_status": ["pending", "assigned", "en_route", "in_progress", "completed", "canceled"]
          }
        }
} as const
