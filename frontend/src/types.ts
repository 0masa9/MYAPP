export type BookStatus = "read" | "want_to_read";

export interface Book {
  id: number;
  title: string;
  author?: string | null;
  status: BookStatus;
  amazon_url?: string | null;
  cover_image_url?: string | null;
  note_markdown?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  title_guess?: string | null;
  created_at: string;
  updated_at?: string | null;
  chapters?: Chapter[];
  notes?: NotePage[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Chapter {
  id: number;
  book_id: number;
  title: string;
  order?: number | null;
  note_markdown?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface NotePage {
  id: number;
  book_id: number;
  title: string;
  sort_order?: number | null;
  content?: string | null; // stored as HTML/JSON string
  created_at: string;
  updated_at?: string | null;
}

export interface Comment {
  id: number;
  book_id: number;
  user: User;
  content: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
}

export interface Follow {
  follower: User;
  following: User;
  created_at: string;
}

export interface Message {
  id: number;
  sender: User;
  receiver: User;
  content: string;
  created_at: string;
}

export interface StatsOverview {
  total_read: number;
  total_want_to_read: number;
  read_this_month: number;
  finished_this_month: number;
}
