// Generated from the live Supabase project (bgdlpdokubhutwicsfyp) via
// `generate_typescript_types`. Regenerate after any schema migration:
//   supabase gen types typescript --project-id bgdlpdokubhutwicsfyp > src/lib/database.types.ts
// Do not hand-edit.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type Discipline =
  | 'Aerospace' | 'Mechanical' | 'Electrical' | 'Software' | 'Civil'
  | 'Chemical' | 'Biomedical' | 'Materials' | 'Environmental' | 'Other'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          discipline: Discipline
          bio: string
          background_id: string
          avatar_url: string | null
          github_url: string | null
          linkedin_url: string | null
          open_to_work: boolean
          interests: string[]
          online: boolean
          oauth_provider: string | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string
          discipline?: Discipline
          bio?: string
          background_id?: string
          avatar_url?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          open_to_work?: boolean
          interests?: string[]
          online?: boolean
          oauth_provider?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      user_roles: {
        Row: { user_id: string; role: 'builder' | 'community-lead' | 'admin' | 'super-admin' }
        Insert: { user_id: string; role?: 'builder' | 'community-lead' | 'admin' | 'super-admin' }
        Update: { user_id?: string; role?: 'builder' | 'community-lead' | 'admin' | 'super-admin' }
        Relationships: []
      }
      skills: {
        Row: { id: string; profile_id: string; name: string; proficiency: number }
        Insert: { id?: string; profile_id: string; name: string; proficiency: number }
        Update: { id?: string; profile_id?: string; name?: string; proficiency?: number }
        Relationships: []
      }
      experiences: {
        Row: { id: string; profile_id: string; role: string; organization: string; duration: string; description: string }
        Insert: { id?: string; profile_id: string; role: string; organization?: string; duration?: string; description?: string }
        Update: { id?: string; profile_id?: string; role?: string; organization?: string; duration?: string; description?: string }
        Relationships: []
      }
      profile_project_entries: {
        Row: { id: string; profile_id: string; title: string; year: number | null; description: string; image: string | null; video: string | null; skill_names: string[] }
        Insert: { id?: string; profile_id: string; title: string; year?: number | null; description?: string; image?: string | null; video?: string | null; skill_names?: string[] }
        Update: { id?: string; profile_id?: string; title?: string; year?: number | null; description?: string; image?: string | null; video?: string | null; skill_names?: string[] }
        Relationships: []
      }
      endorsements: {
        Row: { id: string; profile_id: string; from_id: string; target_type: 'skill' | 'project'; target_name: string; reason: string; created_at: string }
        Insert: { id?: string; profile_id: string; from_id: string; target_type: 'skill' | 'project'; target_name: string; reason: string; created_at?: string }
        Update: { id?: string; profile_id?: string; from_id?: string; target_type?: 'skill' | 'project'; target_name?: string; reason?: string; created_at?: string }
        Relationships: []
      }
      projects: {
        Row: { id: string; owner_id: string; name: string; description: string; cover_url: string | null; thumbnail_url: string | null; open_to_recruitment: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; owner_id: string; name?: string; description?: string; cover_url?: string | null; thumbnail_url?: string | null; open_to_recruitment?: boolean; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
        Relationships: []
      }
      project_stats: {
        Row: { id: string; project_id: string; label: string; value: string; ordinal: number }
        Insert: { id?: string; project_id: string; label: string; value?: string; ordinal?: number }
        Update: { id?: string; project_id?: string; label?: string; value?: string; ordinal?: number }
        Relationships: []
      }
      project_followers: {
        Row: { project_id: string; follower_id: string; created_at: string }
        Insert: { project_id: string; follower_id: string; created_at?: string }
        Update: { project_id?: string; follower_id?: string; created_at?: string }
        Relationships: []
      }
      project_feedback: {
        Row: { id: string; project_id: string; from_id: string; text: string; created_at: string }
        Insert: { id?: string; project_id: string; from_id: string; text: string; created_at?: string }
        Update: { id?: string; project_id?: string; from_id?: string; text?: string; created_at?: string }
        Relationships: []
      }
      connections: {
        Row: { id: string; requester_id: string; addressee_id: string; status: 'requested' | 'connected' | 'declined'; created_at: string }
        Insert: { id?: string; requester_id: string; addressee_id: string; status?: 'requested' | 'connected' | 'declined'; created_at?: string }
        Update: { id?: string; requester_id?: string; addressee_id?: string; status?: 'requested' | 'connected' | 'declined'; created_at?: string }
        Relationships: []
      }
      club_memberships: {
        Row: { profile_id: string; discipline: Discipline; joined_at: string }
        Insert: { profile_id: string; discipline: Discipline; joined_at?: string }
        Update: { profile_id?: string; discipline?: Discipline; joined_at?: string }
        Relationships: []
      }
      questions: {
        Row: { id: string; discipline: Discipline; author_id: string; text: string; reported: boolean; created_at: string }
        Insert: { id?: string; discipline: Discipline; author_id: string; text: string; reported?: boolean; created_at?: string }
        Update: { id?: string; discipline?: Discipline; author_id?: string; text?: string; reported?: boolean; created_at?: string }
        Relationships: []
      }
      question_votes: {
        Row: { question_id: string; user_id: string; vote: 'approve' | 'disapprove' }
        Insert: { question_id: string; user_id: string; vote: 'approve' | 'disapprove' }
        Update: { question_id?: string; user_id?: string; vote?: 'approve' | 'disapprove' }
        Relationships: []
      }
      question_comments: {
        Row: { id: string; question_id: string; author_id: string; text: string; created_at: string }
        Insert: { id?: string; question_id: string; author_id: string; text: string; created_at?: string }
        Update: { id?: string; question_id?: string; author_id?: string; text?: string; created_at?: string }
        Relationships: []
      }
      reports: {
        Row: { id: string; reporter_id: string; target_type: string; target_id: string; reason: string; created_at: string }
        Insert: { id?: string; reporter_id: string; target_type: string; target_id: string; reason?: string; created_at?: string }
        Update: { id?: string; reporter_id?: string; target_type?: string; target_id?: string; reason?: string; created_at?: string }
        Relationships: []
      }
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string }
        Insert: { blocker_id: string; blocked_id: string; created_at?: string }
        Update: { blocker_id?: string; blocked_id?: string; created_at?: string }
        Relationships: []
      }
      conversations: {
        Row: { id: string; participant_a: string; participant_b: string; created_at: string }
        Insert: { id?: string; participant_a: string; participant_b: string; created_at?: string }
        Update: { id?: string; participant_a?: string; participant_b?: string; created_at?: string }
        Relationships: []
      }
      messages: {
        Row: { id: string; conversation_id: string; sender_id: string; text: string; attachment_kind: 'image' | 'video' | 'link' | null; attachment_url: string | null; attachment_name: string | null; created_at: string }
        Insert: { id?: string; conversation_id: string; sender_id: string; text?: string; attachment_kind?: 'image' | 'video' | 'link' | null; attachment_url?: string | null; attachment_name?: string | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
        Relationships: []
      }
      webinars: {
        Row: { id: string; title: string; speaker: string; discipline: Discipline; starts_at: string; tz_label: string; created_at: string }
        Insert: { id?: string; title: string; speaker?: string; discipline: Discipline; starts_at: string; tz_label?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['webinars']['Insert']>
        Relationships: []
      }
      webinar_rsvps: {
        Row: { webinar_id: string; user_id: string; created_at: string }
        Insert: { webinar_id: string; user_id: string; created_at?: string }
        Update: { webinar_id?: string; user_id?: string; created_at?: string }
        Relationships: []
      }
      competitions: {
        Row: { id: string; name: string; location: string; remote: boolean; discipline: string; organizer: string; description: string; requirements: string[]; deadline: string }
        Insert: { id?: string; name: string; location?: string; remote?: boolean; discipline?: string; organizer?: string; description?: string; requirements?: string[]; deadline: string }
        Update: Partial<Database['public']['Tables']['competitions']['Insert']>
        Relationships: []
      }
      opportunities: {
        Row: { id: string; title: string; organization: string; discipline: Discipline | null; location: string; remote: boolean; description: string; url: string | null; deadline: string | null; created_at: string }
        Insert: { id?: string; title: string; organization?: string; discipline?: Discipline | null; location?: string; remote?: boolean; description?: string; url?: string | null; deadline?: string | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['opportunities']['Insert']>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { custom_access_token_hook: { Args: { event: Json }; Returns: Json } }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
