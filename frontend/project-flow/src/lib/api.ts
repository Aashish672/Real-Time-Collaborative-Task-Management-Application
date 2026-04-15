export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (!(rest.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(url.toString(), { headers, ...rest });

  // Handle Token Expiry
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");
    
    if (refreshToken) {
      try {
        // Attempt to refresh the token
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
          const { access_token, refresh_token: new_refresh_token } = await refreshRes.json();
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("refresh_token", new_refresh_token);
          
          // Retry original request with NEW token
          headers["Authorization"] = `Bearer ${access_token}`;
          response = await fetch(url.toString(), { headers, ...rest });

          // If retry also fails, give up
          if (response.ok) {
            if (response.status === 204) return undefined as T;
            return response.json();
          }
        }
      } catch (err) {
        console.error("Refresh attempt failed", err);
      }
    }

    // If we reach here, either no refresh token or refresh failed
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
    
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
