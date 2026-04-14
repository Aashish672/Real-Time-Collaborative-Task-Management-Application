const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function api<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...rest } = options;

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const token = localStorage.getItem("access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), { headers, ...rest });

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    const publicPaths = ["/login", "/signup"];
    if (!publicPaths.includes(window.location.pathname)) {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, data);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export { api, ApiError };
export default api;
