import { Book, BookStatus, Chapter, NotePage, Comment, Follow, Message, StatsOverview, User } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ApiOptions extends RequestInit {
  token?: string | null;
}

async function apiClient<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = options.token ?? localStorage.getItem("book_memory_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "API error");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export { apiClient };

// Books
export const fetchBooks = (status?: BookStatus) =>
  apiClient<Book[]>(`/api/books${status ? `?status_filter=${status}` : ""}`);

export const fetchBook = (id: number) => apiClient<Book>(`/api/books/${id}`);

export const createBook = (data: Partial<Book>) =>
  apiClient<Book>("/api/books", { method: "POST", body: JSON.stringify(data) });

export const updateBook = (id: number, data: Partial<Book>) =>
  apiClient<Book>(`/api/books/${id}` , {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteBook = (id: number) => apiClient<void>(`/api/books/${id}`, { method: "DELETE" });

// Chapters
export const fetchChapters = (bookId: number) => apiClient<Chapter[]>(`/api/books/${bookId}/chapters`);

export const createChapter = (bookId: number, data: Partial<Chapter>) =>
  apiClient<Chapter>(`/api/books/${bookId}/chapters`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateChapter = (id: number, data: Partial<Chapter>) =>
  apiClient<Chapter>(`/api/chapters/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteChapterApi = (id: number) =>
  apiClient<void>(`/api/chapters/${id}`, { method: "DELETE" });

// Notes
export const fetchNotes = (bookId: number) => apiClient<NotePage[]>(`/api/books/${bookId}/notes`);
export const createNote = (bookId: number, data: Partial<NotePage>) =>
  apiClient<NotePage>(`/api/books/${bookId}/notes`, { method: "POST", body: JSON.stringify(data) });
export const updateNote = (noteId: number, data: Partial<NotePage>) =>
  apiClient<NotePage>(`/api/notes/${noteId}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteNote = (noteId: number) => apiClient<void>(`/api/notes/${noteId}`, { method: "DELETE" });

// Comments
export const fetchComments = (bookId: number) => apiClient<Comment[]>(`/api/books/${bookId}/comments`);
export const createCommentApi = (bookId: number, content: string) =>
  apiClient<Comment>(`/api/books/${bookId}/comments`, { method: "POST", body: JSON.stringify({ content }) });
export const deleteCommentApi = (commentId: number) =>
  apiClient<void>(`/api/comments/${commentId}`, { method: "DELETE" });

// Follow
export const followUser = (userId: number) => apiClient<{ message: string }>(`/api/users/${userId}/follow`, { method: "POST" });
export const unfollowUser = (userId: number) => apiClient<{ message: string }>(`/api/users/${userId}/unfollow`, { method: "POST" });
export const getFollowing = () => apiClient<Follow[]>(`/api/users/me/following`);
export const getFollowers = () => apiClient<Follow[]>(`/api/users/me/followers`);

// Messages
export const fetchMessages = (otherUserId: number) => apiClient<Message[]>(`/api/messages/${otherUserId}`);
export const sendMessageApi = (otherUserId: number, content: string) =>
  apiClient<Message>(`/api/messages/${otherUserId}`, { method: "POST", body: JSON.stringify({ content }) });

// Stats
export const fetchStatsOverview = () => apiClient<StatsOverview>(`/api/stats/overview`);

// Users (lightweight helper)
export const searchUserById = async (userId: number): Promise<User> => {
  // 簡易: ダミーとして follow API の戻りを待たず直接返せないので、プロフィール取得APIを作っていないため、IDと入力名のまま扱う。
  return { id: userId, username: `user#${userId}` };
};
