import { UploadResponse, ChatResponse, SessionData, AuthResponse, AuthCheckResponse, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Token management
const TOKEN_KEY = "datachat_token";
const USER_KEY = "datachat_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// API helper with auth header
async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
    }
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}

// Auth API
export async function register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  setToken(data.access_token);
  setUser(data.user);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  setUser(data.user);
  return data;
}

export async function checkAuth(): Promise<AuthCheckResponse> {
  const token = getToken();
  if (!token) {
    return { is_authenticated: false };
  }
  
  try {
    const data = await apiFetch<AuthCheckResponse>("/auth/check");
    if (data.is_authenticated && data.user) {
      setUser(data.user);
    }
    return data;
  } catch {
    clearToken();
    return { is_authenticated: false };
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/auth/me");
}

// Session API
export async function getUserSessions(): Promise<SessionData[]> {
  return apiFetch<SessionData[]>("/sessions");
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Upload failed" }));
    console.error(`[Upload Error] Status: ${res.status}`, error);
    throw new Error(error.detail || "Upload failed");
  }

  return res.json();
}

export async function sendMessage(
  sessionId: string,
  question: string
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, question }),
  });
}

// Streaming chat for real-time updates
export async function sendMessageStream(
  sessionId: string,
  question: string,
  onChunk: (chunk: { type: string; content?: string; section?: string; count?: number; text?: string; charts?: string[]; code?: string }) => void
): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ session_id: sessionId, question }),
  });

  if (!response.ok) {
    throw new Error("Streaming request failed");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onChunk(data);
        } catch (e) {
          console.error('Failed to parse stream chunk:', e);
        }
      }
    }
  }
}

export async function getSession(sessionId: string): Promise<SessionData> {
  return apiFetch<SessionData>(`/session/${sessionId}`);
}

export async function updateSession(
  sessionId: string,
  data: { nickname?: string; is_starred?: boolean }
): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/session/${sessionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSession(sessionId: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/session/${sessionId}`, {
    method: "DELETE",
  });
}

export async function enhancePrompt(prompt: string): Promise<string> {
  try {
    const data = await apiFetch<{ enhanced: string }>("/enhance-prompt", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    const enhanced = data.enhanced?.trim();
    // Return enhanced only if it's valid and not empty
    if (enhanced && enhanced.length > 5) {
      return enhanced;
    }
    return prompt;
  } catch {
    return prompt;
  }
}

// Tools API
export async function convertImageToExcel(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/tools/image-to-excel`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Conversion failed" }));
    throw new Error(error.detail || "Conversion failed");
  }

  return res.blob();
}

export async function convertImageToCSV(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/tools/image-to-csv`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Conversion failed" }));
    throw new Error(error.detail || "Conversion failed");
  }

  return res.blob();
}

export async function convertHTMLToCSV(htmlContent: string): Promise<Blob> {
  const formData = new FormData();
  formData.append("html_content", htmlContent);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/tools/html-to-csv`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Conversion failed" }));
    throw new Error(error.detail || "Conversion failed");
  }

  return res.blob();
}

export async function convertPDFToExcel(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/tools/pdf-to-excel`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Conversion failed" }));
    throw new Error(error.detail || "Conversion failed");
  }

  return res.blob();
}

export async function convertPDFToCSV(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/tools/pdf-to-csv`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Conversion failed" }));
    throw new Error(error.detail || "Conversion failed");
  }

  return res.blob();
}

export async function convertExcelToCSV(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/tools/excel-to-csv`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Conversion failed" }));
    throw new Error(error.detail || "Conversion failed");
  }

  return res.blob();
}

export async function mergeExcelFiles(files: File[], mergeType: string = "concat"): Promise<Blob> {
  const formData = new FormData();
  files.forEach(file => formData.append("files", file));
  formData.append("merge_type", mergeType);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/tools/merge-excel`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Merge failed" }));
    throw new Error(error.detail || "Merge failed");
  }

  return res.blob();
}

export async function mergeCSVFiles(files: File[]): Promise<Blob> {
  const formData = new FormData();
  files.forEach(file => formData.append("files", file));

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/tools/merge-csv`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Merge failed" }));
    throw new Error(error.detail || "Merge failed");
  }

  return res.blob();
}

export async function generateSQL(file: File, tableName: string = "data_table"): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("table_name", tableName);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/tools/generate-sql`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "SQL generation failed" }));
    throw new Error(error.detail || "SQL generation failed");
  }

  return res.blob();
}

export async function listTools(): Promise<{ tools: any[] }> {
  return apiFetch<{ tools: any[] }>("/tools/list");
}
