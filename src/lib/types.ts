export interface ColumnInfo {
  name: string;
  dtype: string;
  null_count: number;
}

export interface DataPreview {
  shape: { rows: number; columns: number };
  columns: ColumnInfo[];
  preview: Record<string, string>[];
}

export interface UploadResponse {
  session_id: string;
  filename: string;
  preview: DataPreview;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  plotly_json?: string | null;
  charts?: string[] | null; // Array of plotly JSON for multiple charts
  code?: string | null;
  created_at?: string | null;
}

export interface ChatResponse {
  text: string;
  plotly_json?: string | null;
  charts?: string[] | null;
  code?: string | null;
}

export interface SessionData {
  session_id: string;
  filename: string;
  file_meta: {
    filename: string;
    size: number;
    extension: string;
    shape: { rows: number; columns: number };
    columns: ColumnInfo[];
    preview?: Record<string, string>[];
  };
  messages: ChatMessage[];
  created_at?: string | null;
}

export interface StoredSession {
  id: string;
  filename: string;
  nickname?: string | null;
  is_starred?: boolean;
  createdAt: string;
  shape?: { rows: number; columns: number };
}

// Auth Types
export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthCheckResponse {
  is_authenticated: boolean;
  user?: User;
}
