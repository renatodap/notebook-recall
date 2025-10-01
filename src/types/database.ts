// Database types generated from Supabase schema
// This will be updated once the database schema is created

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
      sources: {
        Row: {
          id: string
          user_id: string
          title: string
          content_type: 'text' | 'url' | 'pdf' | 'note'
          original_content: string
          url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content_type: 'text' | 'url' | 'pdf' | 'note'
          original_content: string
          url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content_type?: 'text' | 'url' | 'pdf' | 'note'
          original_content?: string
          url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      summaries: {
        Row: {
          id: string
          source_id: string
          summary_text: string
          key_actions: string[]
          key_topics: string[]
          word_count: number
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          source_id: string
          summary_text: string
          key_actions: string[]
          key_topics: string[]
          word_count: number
          embedding?: number[] | null
          created_at?: string
        }
        Update: {
          id?: string
          source_id?: string
          summary_text?: string
          key_actions?: string[]
          key_topics?: string[]
          word_count?: number
          embedding?: number[] | null
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          source_id: string
          tag_name: string
          created_at: string
        }
        Insert: {
          id?: string
          source_id: string
          tag_name: string
          created_at?: string
        }
        Update: {
          id?: string
          source_id?: string
          tag_name?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_summaries: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          source_id: string
          summary_text: string
          similarity: number
        }[]
      }
    }
    Enums: {
      content_type: 'text' | 'url' | 'pdf' | 'note'
    }
  }
}
