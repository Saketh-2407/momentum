// Hand-authored to match db/migrations/*.sql. There's no live DB connection
// available in this environment to run `supabase gen types`, so keep this in
// sync by hand whenever a migration changes these tables. Every table needs
// `Relationships: []` (even with none) and the schema needs `Views`/
// `Functions`, or supabase-js's GenericSchema constraint silently falls back
// every row/insert type to `never`.

export type TaskStatus = "todo" | "done" | "skipped";
export type CadenceType = "daily" | "weekly";
export type XpSourceType = "task" | "habit" | "bonus";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
