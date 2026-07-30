// Hand-authored to match db/migrations/*.sql. There's no live DB connection
// available in this environment to run `supabase gen types`, so keep this in
// sync by hand whenever a migration changes these tables. Every table needs
// `Relationships: []` (even with none) and the schema needs `Views`/
// `Functions`, or supabase-js's GenericSchema constraint silently falls back
// every row/insert type to `never`.

export type TaskStatus = "todo" | "done" | "skipped";
export type CadenceType = "daily" | "weekly";
export type XpSourceType = "task" | "habit" | "bonus";
export type FriendshipStatus = "pending" | "accepted";
export type WorkbookItemKind = "task" | "habit";
export type ConnectorProvider = "google_calendar" | "gmail";
export type SuggestedTaskStatus = "pending" | "accepted" | "dismissed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string;
          current_streak: number;
          longest_streak: number;
          streak_freeze_count: number;
          streak_last_date: string | null;
          leaderboard_opt_in: boolean;
          total_xp: number;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          current_streak?: number;
          longest_streak?: number;
          streak_freeze_count?: number;
          streak_last_date?: string | null;
          leaderboard_opt_in?: boolean;
          total_xp?: number;
          email?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          category: string | null;
          scheduled_at: string | null;
          deadline: string | null;
          importance: number;
          effort: number;
          status: TaskStatus;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          notes?: string | null;
          category?: string | null;
          scheduled_at?: string | null;
          deadline?: string | null;
          importance?: number;
          effort?: number;
          status?: TaskStatus;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          cadence_type: CadenceType;
          days_of_week: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          notes?: string | null;
          cadence_type?: CadenceType;
          days_of_week?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["habits"]["Insert"]>;
        Relationships: [];
      };
      habit_completions: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          completed_on: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          habit_id: string;
          user_id: string;
          completed_on: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["habit_completions"]["Insert"]>;
        Relationships: [];
      };
      xp_events: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          source_type: XpSourceType;
          source_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          reason: string;
          source_type: XpSourceType;
          source_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["xp_events"]["Insert"]>;
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: FriendshipStatus;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: FriendshipStatus;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["friendships"]["Insert"]>;
        Relationships: [];
      };
      workbooks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          is_published: boolean;
          owner_display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          is_published?: boolean;
          owner_display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workbooks"]["Insert"]>;
        Relationships: [];
      };
      workbook_items: {
        Row: {
          id: string;
          workbook_id: string;
          kind: WorkbookItemKind;
          title: string;
          notes: string | null;
          category: string | null;
          importance: number;
          effort: number;
          cadence_type: CadenceType | null;
          days_of_week: number[];
          position: number;
        };
        Insert: {
          id?: string;
          workbook_id: string;
          kind: WorkbookItemKind;
          title: string;
          notes?: string | null;
          category?: string | null;
          importance?: number;
          effort?: number;
          cadence_type?: CadenceType | null;
          days_of_week?: number[];
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["workbook_items"]["Insert"]>;
        Relationships: [];
      };
      co_op_quests: {
        Row: {
          id: string;
          title: string;
          target_count: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          target_count: number;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["co_op_quests"]["Insert"]>;
        Relationships: [];
      };
      co_op_quest_members: {
        Row: {
          quest_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          quest_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["co_op_quest_members"]["Insert"]>;
        Relationships: [];
      };
      co_op_quest_contributions: {
        Row: {
          id: string;
          quest_id: string;
          user_id: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quest_id: string;
          user_id: string;
          amount?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["co_op_quest_contributions"]["Insert"]>;
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          user_id: string;
          provider: ConnectorProvider;
          encrypted_refresh_token: string;
          scope: string;
          sync_cursor: string | null;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: ConnectorProvider;
          encrypted_refresh_token: string;
          scope: string;
          sync_cursor?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["connections"]["Insert"]>;
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          source_ref: string;
          title: string;
          starts_at: string;
          ends_at: string | null;
          is_all_day: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_ref: string;
          title: string;
          starts_at: string;
          ends_at?: string | null;
          is_all_day?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["calendar_events"]["Insert"]>;
        Relationships: [];
      };
      suggested_tasks: {
        Row: {
          id: string;
          user_id: string;
          source_type: "gmail";
          source_ref: string;
          title: string;
          notes: string | null;
          suggested_deadline: string | null;
          status: SuggestedTaskStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type?: "gmail";
          source_ref: string;
          title: string;
          notes?: string | null;
          suggested_deadline?: string | null;
          status?: SuggestedTaskStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["suggested_tasks"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      find_user_id_by_email: {
        Args: { lookup_email: string };
        Returns: string | null;
      };
    };
  };
}
