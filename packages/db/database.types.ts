
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
            "absences": {
                  Row: {
                    "company_id": string,"created_at": string,"ends_at": string,"id": string,"reason": string,"starts_at": string,"technician_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"ends_at": string,"id"?: string,"reason"?: string,"starts_at": string,"technician_id": string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"ends_at"?: string,"id"?: string,"reason"?: string,"starts_at"?: string,"technician_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "absences_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "absences_company_id_technician_id_fkey"
      columns: ["company_id","technician_id"]
isOneToOne: false
      referencedRelation: "memberships"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"assets": {
                  Row: {
                    "brand": string | null,"category": string,"company_id": string,"created_at": string,"id": string,"installation_id": string | null,"location": string | null,"model": string | null,"name": string | null,"photo_path": string | null,"serial": string | null,"site_id": string,"status": Database["public"]['Enums']["asset_status"],"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand"?: string | null,"category"?: string,"company_id": string,"created_at"?: string,"id"?: string,"installation_id"?: string | null,"location"?: string | null,"model"?: string | null,"name"?: string | null,"photo_path"?: string | null,"serial"?: string | null,"site_id": string,"status"?: Database["public"]['Enums']["asset_status"],"type": string
                  }
                  Update: {
                    "brand"?: string | null,"category"?: string,"company_id"?: string,"created_at"?: string,"id"?: string,"installation_id"?: string | null,"location"?: string | null,"model"?: string | null,"name"?: string | null,"photo_path"?: string | null,"serial"?: string | null,"site_id"?: string,"status"?: Database["public"]['Enums']["asset_status"],"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "assets_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assets_company_id_installation_id_fkey"
      columns: ["company_id","installation_id"]
isOneToOne: false
      referencedRelation: "installations"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "assets_company_id_site_id_fkey"
      columns: ["company_id","site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"attachments": {
                  Row: {
                    "caption": string | null,"company_id": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["attachment_kind"],"storage_path": string,"uploaded_by": string | null,"work_order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "caption"?: string | null,"company_id": string,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["attachment_kind"],"storage_path": string,"uploaded_by"?: string | null,"work_order_id": string
                  }
                  Update: {
                    "caption"?: string | null,"company_id"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["attachment_kind"],"storage_path"?: string,"uploaded_by"?: string | null,"work_order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attachments_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attachments_company_id_work_order_id_fkey"
      columns: ["company_id","work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"companies": {
                  Row: {
                    "created_at": string,"id": string,"logo_url": string | null,"name": string,"nit": string | null,"payment_account_holder": string | null,"payment_account_number": string | null,"payment_account_type": string | null,"payment_bank": string | null,"payment_holder_id": string | null,"payment_nequi": string | null,"payment_notes": string | null,"phone": string | null,"plan": string,"subscription_status": string,"trial_ends_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"logo_url"?: string | null,"name": string,"nit"?: string | null,"payment_account_holder"?: string | null,"payment_account_number"?: string | null,"payment_account_type"?: string | null,"payment_bank"?: string | null,"payment_holder_id"?: string | null,"payment_nequi"?: string | null,"payment_notes"?: string | null,"phone"?: string | null,"plan"?: string,"subscription_status"?: string,"trial_ends_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"logo_url"?: string | null,"name"?: string,"nit"?: string | null,"payment_account_holder"?: string | null,"payment_account_number"?: string | null,"payment_account_type"?: string | null,"payment_bank"?: string | null,"payment_holder_id"?: string | null,"payment_nequi"?: string | null,"payment_notes"?: string | null,"phone"?: string | null,"plan"?: string,"subscription_status"?: string,"trial_ends_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"company_counters": {
                  Row: {
                    "company_id": string,"kind": string,"last_value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"kind": string,"last_value": number
                  }
                  Update: {
                    "company_id"?: string,"kind"?: string,"last_value"?: number
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
                    "company_id": string,"contact_name": string | null,"created_at": string,"email": string | null,"id": string,"name": string,"notes": string | null,"phone_whatsapp": string | null,"tax_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"contact_name"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"phone_whatsapp"?: string | null,"tax_id"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"contact_name"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"phone_whatsapp"?: string | null,"tax_id"?: string | null
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
                },"installation_credential_views": {
                  Row: {
                    "company_id": string,"credential_id": string,"id": number,"installation_id": string,"user_id": string,"viewed_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"credential_id": string,"id"?: never,"installation_id": string,"user_id": string,"viewed_at"?: string
                  }
                  Update: {
                    "company_id"?: string,"credential_id"?: string,"id"?: never,"installation_id"?: string,"user_id"?: string,"viewed_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "installation_credential_views_company_id_credential_id_fkey"
      columns: ["company_id","credential_id"]
isOneToOne: false
      referencedRelation: "installation_credentials"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "installation_credential_views_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "installation_credential_views_company_id_installation_id_fkey"
      columns: ["company_id","installation_id"]
isOneToOne: false
      referencedRelation: "installations"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"installation_credentials": {
                  Row: {
                    "company_id": string,"created_at": string,"host": string | null,"id": string,"installation_id": string,"label": string,"secret_id": string | null,"username": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"host"?: string | null,"id"?: string,"installation_id": string,"label"?: string,"secret_id"?: string | null,"username"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"host"?: string | null,"id"?: string,"installation_id"?: string,"label"?: string,"secret_id"?: string | null,"username"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "installation_credentials_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "installation_credentials_company_id_installation_id_fkey"
      columns: ["company_id","installation_id"]
isOneToOne: false
      referencedRelation: "installations"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"installation_files": {
                  Row: {
                    "company_id": string,"created_at": string,"id": string,"installation_id": string,"kind": string,"storage_path": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"id"?: string,"installation_id": string,"kind": string,"storage_path": string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"id"?: string,"installation_id"?: string,"kind"?: string,"storage_path"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "installation_files_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "installation_files_company_id_installation_id_fkey"
      columns: ["company_id","installation_id"]
isOneToOne: false
      referencedRelation: "installations"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"installations": {
                  Row: {
                    "company_id": string,"created_at": string,"customer_id": string,"id": string,"installed_by": string | null,"installed_on": string,"last_maintenance": string | null,"maintenance_every_months": number | null,"name": string,"next_maintenance": string | null,"notes": string | null,"number": number,"origin_work_order_id": string | null,"site_id": string,"status": Database["public"]['Enums']["installation_status"],"system_type": Database["public"]['Enums']["installation_system"],"warranty_until": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"customer_id": string,"id"?: string,"installed_by"?: string | null,"installed_on": string,"last_maintenance"?: string | null,"maintenance_every_months"?: number | null,"name": string,"next_maintenance"?: string | null,"notes"?: string | null,"number"?: number,"origin_work_order_id"?: string | null,"site_id": string,"status"?: Database["public"]['Enums']["installation_status"],"system_type": Database["public"]['Enums']["installation_system"],"warranty_until"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"customer_id"?: string,"id"?: string,"installed_by"?: string | null,"installed_on"?: string,"last_maintenance"?: string | null,"maintenance_every_months"?: number | null,"name"?: string,"next_maintenance"?: string | null,"notes"?: string | null,"number"?: number,"origin_work_order_id"?: string | null,"site_id"?: string,"status"?: Database["public"]['Enums']["installation_status"],"system_type"?: Database["public"]['Enums']["installation_system"],"warranty_until"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "installations_company_id_customer_id_fkey"
      columns: ["company_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "installations_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "installations_company_id_installed_by_fkey"
      columns: ["company_id","installed_by"]
isOneToOne: false
      referencedRelation: "memberships"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "installations_company_id_origin_work_order_id_fkey"
      columns: ["company_id","origin_work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "installations_company_id_site_id_fkey"
      columns: ["company_id","site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"leads": {
                  Row: {
                    "company_type": string,"consent": boolean,"consent_text": string,"contact": string,"created_at": string,"id": string,"ip_hash": string | null,"name": string,"source": string | null,"technicians": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_type": string,"consent": boolean,"consent_text": string,"contact": string,"created_at"?: string,"id"?: string,"ip_hash"?: string | null,"name": string,"source"?: string | null,"technicians": string,"user_agent"?: string | null
                  }
                  Update: {
                    "company_type"?: string,"consent"?: boolean,"consent_text"?: string,"contact"?: string,"created_at"?: string,"id"?: string,"ip_hash"?: string | null,"name"?: string,"source"?: string | null,"technicians"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"materials": {
                  Row: {
                    "active": boolean,"company_id": string,"created_at": string,"id": string,"min_stock": number,"name": string,"sku": string | null,"stock": number,"track_stock": boolean,"unit": string,"unit_price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"company_id": string,"created_at"?: string,"id"?: string,"min_stock"?: number,"name": string,"sku"?: string | null,"stock"?: number,"track_stock"?: boolean,"unit"?: string,"unit_price"?: number
                  }
                  Update: {
                    "active"?: boolean,"company_id"?: string,"created_at"?: string,"id"?: string,"min_stock"?: number,"name"?: string,"sku"?: string | null,"stock"?: number,"track_stock"?: boolean,"unit"?: string,"unit_price"?: number
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
                },"memberships": {
                  Row: {
                    "active": boolean,"company_id": string,"created_at": string,"full_name": string,"id": string,"phone": string | null,"role": Database["public"]['Enums']["member_role"],"skills": (string)[],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"company_id": string,"created_at"?: string,"full_name": string,"id"?: string,"phone"?: string | null,"role": Database["public"]['Enums']["member_role"],"skills"?: (string)[],"user_id": string
                  }
                  Update: {
                    "active"?: boolean,"company_id"?: string,"created_at"?: string,"full_name"?: string,"id"?: string,"phone"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"skills"?: (string)[],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"quotes": {
                  Row: {
                    "company_id": string,"created_at": string,"customer_id": string,"id": string,"items": NonNullable<Json>,"notes": string | null,"number": number,"public_token": string,"sent_at": string | null,"status": Database["public"]['Enums']["quote_status"],"total": number,"valid_until": string | null,"work_order_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"customer_id": string,"id"?: string,"items"?: NonNullable<Json>,"notes"?: string | null,"number"?: number,"public_token"?: string,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["quote_status"],"total"?: number,"valid_until"?: string | null,"work_order_id"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"customer_id"?: string,"id"?: string,"items"?: NonNullable<Json>,"notes"?: string | null,"number"?: number,"public_token"?: string,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["quote_status"],"total"?: number,"valid_until"?: string | null,"work_order_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotes_company_id_customer_id_fkey"
      columns: ["company_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "quotes_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_company_id_work_order_id_fkey"
      columns: ["company_id","work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"service_types": {
                  Row: {
                    "active": boolean,"checklist": NonNullable<Json>,"company_id": string,"created_at": string,"estimated_minutes": number,"id": string,"is_maintenance": boolean,"name": string,"skill": string | null,"warranty_months": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"checklist"?: NonNullable<Json>,"company_id": string,"created_at"?: string,"estimated_minutes"?: number,"id"?: string,"is_maintenance"?: boolean,"name": string,"skill"?: string | null,"warranty_months"?: number | null
                  }
                  Update: {
                    "active"?: boolean,"checklist"?: NonNullable<Json>,"company_id"?: string,"created_at"?: string,"estimated_minutes"?: number,"id"?: string,"is_maintenance"?: boolean,"name"?: string,"skill"?: string | null,"warranty_months"?: number | null
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
                    "access_notes": string | null,"address": string,"city": string | null,"company_id": string,"created_at": string,"customer_id": string,"id": string,"lat": number | null,"lng": number | null,"neighborhood": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "access_notes"?: string | null,"address": string,"city"?: string | null,"company_id": string,"created_at"?: string,"customer_id": string,"id"?: string,"lat"?: number | null,"lng"?: number | null,"neighborhood"?: string | null
                  }
                  Update: {
                    "access_notes"?: string | null,"address"?: string,"city"?: string | null,"company_id"?: string,"created_at"?: string,"customer_id"?: string,"id"?: string,"lat"?: number | null,"lng"?: number | null,"neighborhood"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "sites_company_id_customer_id_fkey"
      columns: ["company_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "sites_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"stock_movements": {
                  Row: {
                    "company_id": string,"created_at": string,"delta": number,"id": string,"material_id": string,"reason": string,"stock_after": number,"user_id": string | null,"work_order_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"delta": number,"id"?: string,"material_id": string,"reason": string,"stock_after": number,"user_id"?: string | null,"work_order_id"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"delta"?: number,"id"?: string,"material_id"?: string,"reason"?: string,"stock_after"?: number,"user_id"?: string | null,"work_order_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_movements_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_company_id_material_id_fkey"
      columns: ["company_id","material_id"]
isOneToOne: false
      referencedRelation: "materials"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "stock_movements_company_id_work_order_id_fkey"
      columns: ["company_id","work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"work_order_events": {
                  Row: {
                    "company_id": string,"created_at": string,"id": string,"lat": number | null,"lng": number | null,"payload": NonNullable<Json>,"type": string,"user_id": string | null,"work_order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"id"?: string,"lat"?: number | null,"lng"?: number | null,"payload"?: NonNullable<Json>,"type": string,"user_id"?: string | null,"work_order_id": string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"id"?: string,"lat"?: number | null,"lng"?: number | null,"payload"?: NonNullable<Json>,"type"?: string,"user_id"?: string | null,"work_order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_order_events_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_order_events_company_id_work_order_id_fkey"
      columns: ["company_id","work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"work_order_items": {
                  Row: {
                    "company_id": string,"created_at": string,"description": string,"id": string,"material_id": string | null,"quantity": number,"total": number | null,"unit_price": number,"work_order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"description": string,"id"?: string,"material_id"?: string | null,"quantity"?: number,"total"?: never,"unit_price"?: number,"work_order_id": string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"description"?: string,"id"?: string,"material_id"?: string | null,"quantity"?: number,"total"?: never,"unit_price"?: number,"work_order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_order_items_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_order_items_company_id_material_id_fkey"
      columns: ["company_id","material_id"]
isOneToOne: false
      referencedRelation: "materials"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "work_order_items_company_id_work_order_id_fkey"
      columns: ["company_id","work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"work_order_ratings": {
                  Row: {
                    "comment": string | null,"commented_at": string | null,"company_id": string,"created_at": string,"stars": number,"work_order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment"?: string | null,"commented_at"?: string | null,"company_id": string,"created_at"?: string,"stars": number,"work_order_id": string
                  }
                  Update: {
                    "comment"?: string | null,"commented_at"?: string | null,"company_id"?: string,"created_at"?: string,"stars"?: number,"work_order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_order_ratings_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_order_ratings_company_id_work_order_id_fkey"
      columns: ["company_id","work_order_id"]
isOneToOne: false
      referencedRelation: "work_orders"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"work_orders": {
                  Row: {
                    "asset_id": string | null,"checklist_state": NonNullable<Json>,"company_id": string,"completed_at": string | null,"created_at": string,"customer_id": string,"description": string | null,"id": string,"installation_id": string | null,"invoiced_at": string | null,"number": number,"observations": string | null,"priority": Database["public"]['Enums']["work_order_priority"],"public_token": string | null,"scheduled_end": string | null,"scheduled_start": string | null,"service_type_id": string | null,"signer_id_number": string | null,"signer_name": string | null,"site_id": string | null,"status": Database["public"]['Enums']["work_order_status"],"technician_id": string | null,"title": string,"total": number
                  }
                  ComputedFields: never
                  Insert: {
                    "asset_id"?: string | null,"checklist_state"?: NonNullable<Json>,"company_id": string,"completed_at"?: string | null,"created_at"?: string,"customer_id": string,"description"?: string | null,"id"?: string,"installation_id"?: string | null,"invoiced_at"?: string | null,"number"?: number,"observations"?: string | null,"priority"?: Database["public"]['Enums']["work_order_priority"],"public_token"?: string | null,"scheduled_end"?: string | null,"scheduled_start"?: string | null,"service_type_id"?: string | null,"signer_id_number"?: string | null,"signer_name"?: string | null,"site_id"?: string | null,"status"?: Database["public"]['Enums']["work_order_status"],"technician_id"?: string | null,"title": string,"total"?: number
                  }
                  Update: {
                    "asset_id"?: string | null,"checklist_state"?: NonNullable<Json>,"company_id"?: string,"completed_at"?: string | null,"created_at"?: string,"customer_id"?: string,"description"?: string | null,"id"?: string,"installation_id"?: string | null,"invoiced_at"?: string | null,"number"?: number,"observations"?: string | null,"priority"?: Database["public"]['Enums']["work_order_priority"],"public_token"?: string | null,"scheduled_end"?: string | null,"scheduled_start"?: string | null,"service_type_id"?: string | null,"signer_id_number"?: string | null,"signer_name"?: string | null,"site_id"?: string | null,"status"?: Database["public"]['Enums']["work_order_status"],"technician_id"?: string | null,"title"?: string,"total"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_orders_company_id_asset_id_fkey"
      columns: ["company_id","asset_id"]
isOneToOne: false
      referencedRelation: "assets"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "work_orders_company_id_customer_id_fkey"
      columns: ["company_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "work_orders_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_orders_company_id_installation_id_fkey"
      columns: ["company_id","installation_id"]
isOneToOne: false
      referencedRelation: "installations"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "work_orders_company_id_service_type_id_fkey"
      columns: ["company_id","service_type_id"]
isOneToOne: false
      referencedRelation: "service_types"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "work_orders_company_id_site_id_fkey"
      columns: ["company_id","site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "work_orders_company_id_technician_id_fkey"
      columns: ["company_id","technician_id"]
isOneToOne: false
      referencedRelation: "memberships"
      referencedColumns: ["company_id","id"]
    }
                  ]
                }
          }
          Views: {
            "customer_stats": {
                  Row: {
                    "billed": number | null,"company_id": string,"customer_id": string,"last_service": string | null,"open_orders": number | null,"orders": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "work_orders_company_id_customer_id_fkey"
      columns: ["company_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "work_orders_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "adjust_stock":
{ Args: { "p_kind": string,"p_material": string,"p_note"?: string,"p_quantity": number }; Returns: number
                           },
"assert_technician":
{ Args: { "p_company": string,"p_membership": string }; Returns: undefined
                           },
"can_access_evidence":
{ Args: { "p_path": string,"p_write": boolean }; Returns: boolean
                           },
"can_access_installation_file":
{ Args: { "p_path": string,"p_write": boolean }; Returns: boolean
                           },
"can_see_credentials":
{ Args: { "p_company": string,"p_installation": string }; Returns: boolean
                           },
"comment_report":
{ Args: { "p_comment": string,"p_token": string }; Returns: boolean
                           },
"convert_quote_to_order":
{ Args: { "p_quote": string }; Returns: string
                           },
"create_company":
{ Args: { "p_company_name": string,"p_full_name": string,"p_nit"?: string,"p_phone"?: string }; Returns: string
                           },
"dashboard_kpis":
{ Args: { "p_company": string }; Returns: Json
                           },
"find_user_id_by_email":
{ Args: { "p_email": string }; Returns: string
                           },
"has_open_order_in_installation":
{ Args: { "p_installation": string }; Returns: boolean
                           },
"is_member":
{ Args: { "company": string }; Returns: boolean
                           },
"is_my_membership":
{ Args: { "membership": string }; Returns: boolean
                           },
"is_my_open_work_order":
{ Args: { "wo": string }; Returns: boolean
                           },
"is_my_work_order":
{ Args: { "wo": string }; Returns: boolean
                           },
"is_staff":
{ Args: { "company": string }; Returns: boolean
                           },
"my_role":
{ Args: { "company": string }; Returns: Database["public"]['Enums']["member_role"]
                           },
"next_number":
{ Args: { "p_company": string,"p_kind": string }; Returns: number
                           },
"public_quote":
{ Args: { "p_token": string }; Returns: Json
                           },
"public_report":
{ Args: { "p_token": string }; Returns: Json
                           },
"rate_report":
{ Args: { "p_stars": number,"p_token": string }; Returns: number
                           },
"report_order":
{ Args: { "p_token": string }; Returns: {
              "asset_id": string | null,
"checklist_state": NonNullable<Json>,
"company_id": string,
"completed_at": string | null,
"created_at": string,
"customer_id": string,
"description": string | null,
"id": string,
"installation_id": string | null,
"invoiced_at": string | null,
"number": number,
"observations": string | null,
"priority": Database["public"]['Enums']["work_order_priority"],
"public_token": string | null,
"scheduled_end": string | null,
"scheduled_start": string | null,
"service_type_id": string | null,
"signer_id_number": string | null,
"signer_name": string | null,
"site_id": string | null,
"status": Database["public"]['Enums']["work_order_status"],
"technician_id": string | null,
"title": string,
"total": number
            }
                          SetofOptions: {
        from: "*"
        to: "work_orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"reveal_installation_password":
{ Args: { "p_credential": string }; Returns: string
                           },
"save_installation_credential":
{ Args: { "p_credential"?: string,"p_host": string,"p_installation": string,"p_label": string,"p_password": string,"p_username": string }; Returns: string
                           },
"sync_order_stock":
{ Args: { "p_order": string }; Returns: undefined
                           },
"try_timestamptz":
{ Args: { "p": string }; Returns: string
                           },
"try_uuid":
{ Args: { "p": string }; Returns: string
                           }
          }
          Enums: {
            "asset_status": "funcionando"|"con_falla"|"retirado","attachment_kind": "foto_antes"|"foto_despues"|"firma","installation_status": "activa"|"retirada","installation_system": "cctv"|"alarma"|"red"|"acceso"|"aire"|"otro","member_role": "owner"|"dispatcher"|"technician","quote_status": "borrador"|"enviada"|"aprobada"|"rechazada","work_order_priority": "baja"|"normal"|"alta","work_order_status": "pendiente"|"asignada"|"en_camino"|"en_proceso"|"completada"|"cancelada"
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
            "asset_status": ["funcionando", "con_falla", "retirado"],"attachment_kind": ["foto_antes", "foto_despues", "firma"],"installation_status": ["activa", "retirada"],"installation_system": ["cctv", "alarma", "red", "acceso", "aire", "otro"],"member_role": ["owner", "dispatcher", "technician"],"quote_status": ["borrador", "enviada", "aprobada", "rechazada"],"work_order_priority": ["baja", "normal", "alta"],"work_order_status": ["pendiente", "asignada", "en_camino", "en_proceso", "completada", "cancelada"]
          }
        }
} as const
