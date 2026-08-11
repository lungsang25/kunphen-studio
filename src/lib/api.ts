const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface Medicine {
  id: number;
  name: string;
  tibetan_name: string;
  description: string;
  full_description: string;
  image_url: string;
  uses: string[];
  created_at: string;
  updated_at: string;
}

export interface MedicineInput {
  name: string;
  tibetan_name: string;
  description: string;
  full_description: string;
  image_url: string;
  uses: string[];
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  image_url: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleInput {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  image_url: string;
  published_at: string | null;
}

export interface GalleryImage {
  id: number;
  image_url: string;
  caption: string;
  sort_order: number;
  created_at: string;
}

export interface GalleryImageInput {
  image_url: string;
  caption: string;
  sort_order: number;
}

export interface AnalyticsTotals {
  users: number;
  sessions: number;
  page_views: number;
  prev_users: number;
  prev_sessions: number;
  prev_page_views: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  users: number;
  page_views: number;
}

export interface AnalyticsTopPage {
  path: string;
  views: number;
  users: number;
}

export interface AnalyticsTrafficSource {
  channel: string;
  sessions: number;
}

export interface AnalyticsSummary {
  active_users_now: number;
  totals: AnalyticsTotals;
  trend: AnalyticsTrendPoint[];
  top_pages: AnalyticsTopPage[];
  traffic_sources: AnalyticsTrafficSource[];
  generated_at: string;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
  email: string;
  name: string;
  picture: string;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("kunphen_studio_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("kunphen_studio_token");
    localStorage.removeItem("kunphen_studio_profile");
    window.location.assign("/login");
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) message = body.detail;
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const authApi = {
  loginWithGoogle: (idToken: string) =>
    apiFetch<TokenOut>("/api/cms/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    }),
  loginDev: (email: string) =>
    apiFetch<TokenOut>("/api/cms/auth/dev", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};

export const analyticsApi = {
  summary: (days: number) =>
    apiFetch<AnalyticsSummary>(`/api/cms/analytics/summary?days=${days}`),
};

export const medicinesApi = {
  list: () => apiFetch<Medicine[]>("/api/cms/medicines"),
  get: (id: number) => apiFetch<Medicine>(`/api/cms/medicines/${id}`),
  create: (data: MedicineInput) =>
    apiFetch<Medicine>("/api/cms/medicines", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: MedicineInput) =>
    apiFetch<Medicine>(`/api/cms/medicines/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    apiFetch<void>(`/api/cms/medicines/${id}`, { method: "DELETE" }),
};

export const articlesApi = {
  list: () => apiFetch<Article[]>("/api/cms/articles"),
  get: (id: number) => apiFetch<Article>(`/api/cms/articles/${id}`),
  create: (data: ArticleInput) =>
    apiFetch<Article>("/api/cms/articles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: ArticleInput) =>
    apiFetch<Article>(`/api/cms/articles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    apiFetch<void>(`/api/cms/articles/${id}`, { method: "DELETE" }),
};

export interface PresignResponse {
  upload_url: string;
  public_url: string;
  key: string;
}

export const uploadApi = {
  getPresignedUrl: (filename: string, contentType: string) =>
    apiFetch<PresignResponse>("/api/cms/uploads/presign", {
      method: "POST",
      body: JSON.stringify({ filename, content_type: contentType }),
    }),
};

export async function uploadImageToS3(file: File): Promise<string> {
  const { upload_url, public_url } = await uploadApi.getPresignedUrl(
    file.name,
    file.type
  );

  const res = await fetch(upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!res.ok) {
    throw new Error("Failed to upload image to S3");
  }

  return public_url;
}

export const galleryApi = {
  list: () => apiFetch<GalleryImage[]>("/api/cms/gallery"),
  create: (data: GalleryImageInput) =>
    apiFetch<GalleryImage>("/api/cms/gallery", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: GalleryImageInput) =>
    apiFetch<GalleryImage>(`/api/cms/gallery/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    apiFetch<void>(`/api/cms/gallery/${id}`, { method: "DELETE" }),
};
