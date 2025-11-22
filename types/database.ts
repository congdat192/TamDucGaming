export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string
          referral_code: string
          plays_today: number
          bonus_plays: number
          last_play_date: string | null
          total_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          referral_code?: string
          plays_today?: number
          bonus_plays?: number
          last_play_date?: string | null
          total_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          referral_code?: string
          plays_today?: number
          bonus_plays?: number
          last_play_date?: string | null
          total_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      otp_codes: {
        Row: {
          id: string
          phone: string
          code: string
          expires_at: string
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          code: string
          expires_at: string
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          code?: string
          expires_at?: string
          verified?: boolean
          created_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string
          score: number
          played_at: string
          campaign_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          played_at?: string
          campaign_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          played_at?: string
          campaign_id?: string | null
        }
      }
      vouchers: {
        Row: {
          id: string
          user_id: string
          code: string
          value: number
          score_earned: number
          is_used: boolean
          sent_to_email: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          value: number
          score_earned: number
          is_used?: boolean
          sent_to_email?: string | null
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          value?: number
          score_earned?: number
          is_used?: boolean
          sent_to_email?: string | null
          created_at?: string
          expires_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          reward_given: boolean
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          reward_given?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          reward_given?: boolean
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          username: string
          password: string
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          created_at?: string
        }
      }
    }
  }
}

// Helper types
export type User = Database['public']['Tables']['users']['Row']
export type GameSession = Database['public']['Tables']['game_sessions']['Row']
export type Voucher = Database['public']['Tables']['vouchers']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type Referral = Database['public']['Tables']['referrals']['Row']
