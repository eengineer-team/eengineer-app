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

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_memberships: {
        Row: {
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          joined_at: string
          profile_id: string
        }
        Insert: {
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          joined_at?: string
          profile_id: string
        }
        Update: {
          discipline?:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          joined_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          deadline: string
          description: string
          discipline: string
          id: string
          location: string
          name: string
          organizer: string
          remote: boolean
          requirements: string[]
        }
        Insert: {
          deadline: string
          description?: string
          discipline?: string
          id?: string
          location?: string
          name: string
          organizer?: string
          remote?: boolean
          requirements?: string[]
        }
        Update: {
          deadline?: string
          description?: string
          discipline?: string
          id?: string
          location?: string
          name?: string
          organizer?: string
          remote?: boolean
          requirements?: string[]
        }
        Relationships: []
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: "requested" | "connected" | "declined"
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: "requested" | "connected" | "declined"
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: "requested" | "connected" | "declined"
        }
        Relationships: [
          {
            foreignKeyName: "connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consented_at: string
          doc_type: string
          guardian_email: string | null
          id: string
          user_id: string
          version: string
        }
        Insert: {
          consented_at?: string
          doc_type: string
          guardian_email?: string | null
          id?: string
          user_id: string
          version: string
        }
        Update: {
          consented_at?: string
          doc_type?: string
          guardian_email?: string | null
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          participant_a: string
          participant_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_a: string
          participant_b: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_a?: string
          participant_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_a_fkey"
            columns: ["participant_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_b_fkey"
            columns: ["participant_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_posts: {
        Row: {
          attachment_kind: string | null
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id: string
          profile_id: string
          text: string
        }
        Insert: {
          attachment_kind?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id?: string
          profile_id: string
          text?: string
        }
        Update: {
          attachment_kind?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          discipline?:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id?: string
          profile_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      endorsements: {
        Row: {
          created_at: string
          evidence_url: string | null
          from_id: string
          id: string
          profile_id: string
          reason: string
          target_name: string
          target_type: "skill" | "project"
        }
        Insert: {
          created_at?: string
          evidence_url?: string | null
          from_id: string
          id?: string
          profile_id: string
          reason: string
          target_name: string
          target_type: "skill" | "project"
        }
        Update: {
          created_at?: string
          evidence_url?: string | null
          from_id?: string
          id?: string
          profile_id?: string
          reason?: string
          target_name?: string
          target_type?: "skill" | "project"
        }
        Relationships: [
          {
            foreignKeyName: "endorsements_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endorsements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          description: string
          duration: string
          id: string
          organization: string
          profile_id: string
          role: string
        }
        Insert: {
          description?: string
          duration?: string
          id?: string
          organization?: string
          profile_id: string
          role: string
        }
        Update: {
          description?: string
          duration?: string
          id?: string
          organization?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      introductions: {
        Row: {
          attachment_kind: string | null
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id: string
          profile_id: string
          text: string
          updated_at: string
        }
        Insert: {
          attachment_kind?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id?: string
          profile_id: string
          text?: string
          updated_at?: string
        }
        Update: {
          attachment_kind?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          discipline?:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id?: string
          profile_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "introductions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_kind: "image" | "video" | "link" | null
          attachment_name: string | null
          attachment_url: string | null
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          text: string
        }
        Insert: {
          attachment_kind?: "image" | "video" | "link" | null
          attachment_name?: string | null
          attachment_url?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          text?: string
        }
        Update: {
          attachment_kind?: "image" | "video" | "link" | null
          attachment_name?: string | null
          attachment_url?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          apply_url: string | null
          created_at: string
          deadline: string | null
          deadline_label: string | null
          description: string
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
            | null
          id: string
          image_url: string | null
          location: string
          organization: string
          remote: boolean
          requirements: string[]
          responsibilities: string[]
          source: string
          title: string
          url: string | null
        }
        Insert: {
          apply_url?: string | null
          created_at?: string
          deadline?: string | null
          deadline_label?: string | null
          description?: string
          discipline?:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
            | null
          id?: string
          image_url?: string | null
          location?: string
          organization?: string
          remote?: boolean
          requirements?: string[]
          responsibilities?: string[]
          source?: string
          title: string
          url?: string | null
        }
        Update: {
          apply_url?: string | null
          created_at?: string
          deadline?: string | null
          deadline_label?: string | null
          description?: string
          discipline?:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
            | null
          id?: string
          image_url?: string | null
          location?: string
          organization?: string
          remote?: boolean
          requirements?: string[]
          responsibilities?: string[]
          source?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      profile_private: {
        Row: {
          birthdate: string | null
          created_at: string
          guardian_consent_at: string | null
          guardian_consent_email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          birthdate?: string | null
          created_at?: string
          guardian_consent_at?: string | null
          guardian_consent_email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          birthdate?: string | null
          created_at?: string
          guardian_consent_at?: string | null
          guardian_consent_email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_project_entries: {
        Row: {
          description: string
          id: string
          image: string | null
          profile_id: string
          skill_names: string[]
          title: string
          video: string | null
          year: number | null
        }
        Insert: {
          description?: string
          id?: string
          image?: string | null
          profile_id: string
          skill_names?: string[]
          title: string
          video?: string | null
          year?: number | null
        }
        Update: {
          description?: string
          id?: string
          image?: string | null
          profile_id?: string
          skill_names?: string[]
          title?: string
          video?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_project_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allow_dms: boolean
          avatar_url: string | null
          background_id: string
          background_image_url: string | null
          bio: string
          created_at: string
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          display_name: string
          github_url: string | null
          id: string
          interests: string[]
          linkedin_url: string | null
          oauth_provider: string | null
          online: boolean
          open_to_work: boolean
          updated_at: string
          verified: boolean
        }
        Insert: {
          allow_dms?: boolean
          avatar_url?: string | null
          background_id?: string
          background_image_url?: string | null
          bio?: string
          created_at?: string
          discipline?:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          display_name?: string
          github_url?: string | null
          id: string
          interests?: string[]
          linkedin_url?: string | null
          oauth_provider?: string | null
          online?: boolean
          open_to_work?: boolean
          updated_at?: string
          verified?: boolean
        }
        Update: {
          allow_dms?: boolean
          avatar_url?: string | null
          background_id?: string
          background_image_url?: string | null
          bio?: string
          created_at?: string
          discipline?:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          display_name?: string
          github_url?: string | null
          id?: string
          interests?: string[]
          linkedin_url?: string | null
          oauth_provider?: string | null
          online?: boolean
          open_to_work?: boolean
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      project_feedback: {
        Row: {
          created_at: string
          from_id: string
          id: string
          project_id: string
          text: string
        }
        Insert: {
          created_at?: string
          from_id: string
          id?: string
          project_id: string
          text: string
        }
        Update: {
          created_at?: string
          from_id?: string
          id?: string
          project_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_feedback_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_followers: {
        Row: {
          created_at: string
          follower_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_followers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_join_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string
          requester_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          project_id: string
          requester_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_join_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_join_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_materials: {
        Row: {
          id: string
          kind: "image" | "video" | "link"
          name: string | null
          ordinal: number
          project_id: string
          url: string
        }
        Insert: {
          id?: string
          kind: "image" | "video" | "link"
          name?: string | null
          ordinal?: number
          project_id: string
          url: string
        }
        Update: {
          id?: string
          kind?: "image" | "video" | "link"
          name?: string | null
          ordinal?: number
          project_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stats: {
        Row: {
          id: string
          label: string
          ordinal: number
          project_id: string
          value: string
        }
        Insert: {
          id?: string
          label: string
          ordinal?: number
          project_id: string
          value?: string
        }
        Update: {
          id?: string
          label?: string
          ordinal?: number
          project_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team_members: {
        Row: {
          id: string
          name: string
          ordinal: number
          profile_id: string | null
          project_id: string
          role: string
        }
        Insert: {
          id?: string
          name?: string
          ordinal?: number
          profile_id?: string | null
          project_id: string
          role?: string
        }
        Update: {
          id?: string
          name?: string
          ordinal?: number
          profile_id?: string | null
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string
          id: string
          instagram_url: string | null
          kind: string | null
          link: string | null
          name: string
          open_to_recruitment: boolean
          owner_id: string
          telegram_url: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          instagram_url?: string | null
          kind?: string | null
          link?: string | null
          name?: string
          open_to_recruitment?: boolean
          owner_id: string
          telegram_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          instagram_url?: string | null
          kind?: string | null
          link?: string | null
          name?: string
          open_to_recruitment?: boolean
          owner_id?: string
          telegram_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_comments: {
        Row: {
          author_id: string
          created_at: string
          id: string
          question_id: string
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          question_id: string
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_votes: {
        Row: {
          question_id: string
          user_id: string
          vote: "approve" | "disapprove"
        }
        Insert: {
          question_id: string
          user_id: string
          vote: "approve" | "disapprove"
        }
        Update: {
          question_id?: string
          user_id?: string
          vote?: "approve" | "disapprove"
        }
        Relationships: [
          {
            foreignKeyName: "question_votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          author_id: string
          created_at: string
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id: string
          reported: boolean
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id?: string
          reported?: boolean
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          discipline?:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id?: string
          reported?: boolean
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          id: string
          name: string
          proficiency: number
          profile_id: string
        }
        Insert: {
          id?: string
          name: string
          proficiency: number
          profile_id: string
        }
        Update: {
          id?: string
          name?: string
          proficiency?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: "builder" | "community-lead" | "admin" | "super-admin"
          user_id: string
        }
        Insert: {
          role?: "builder" | "community-lead" | "admin" | "super-admin"
          user_id: string
        }
        Update: {
          role?: "builder" | "community-lead" | "admin" | "super-admin"
          user_id?: string
        }
        Relationships: []
      }
      webinar_rsvps: {
        Row: {
          created_at: string
          user_id: string
          webinar_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          webinar_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          webinar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webinar_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webinar_rsvps_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars"
            referencedColumns: ["id"]
          },
        ]
      }
      webinars: {
        Row: {
          created_at: string
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id: string
          speaker: string
          starts_at: string
          title: string
          tz_label: string
        }
        Insert: {
          created_at?: string
          discipline:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id?: string
          speaker?: string
          starts_at: string
          title: string
          tz_label?: string
        }
        Update: {
          created_at?: string
          discipline?:
            | "Aerospace"
            | "Mechanical"
            | "Electrical"
            | "Software"
            | "Civil"
            | "Chemical"
            | "Biomedical"
            | "Materials"
            | "Environmental"
            | "Other"
          id?: string
          speaker?: string
          starts_at?: string
          title?: string
          tz_label?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
