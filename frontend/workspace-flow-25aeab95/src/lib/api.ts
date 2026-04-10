import type { UserMe, UserPublic, UserRegistration, UserLogin, TokenResponse, UserUpdate, ChangePassword } from "../types";

const API_BASE_URL = "http://localhost:8000";

const getAuthToken = () => localStorage.getItem("access_token");

export const apiCall = async (endpoint: string, method = "GET", body: unknown = null) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "An error occurred");
  }

  return response.json();
};

export const register = async (data: UserRegistration): Promise<UserPublic> => {
  return apiCall("/auth/register", "POST", data);
};

export const login = async (data: UserLogin): Promise<TokenResponse> => {
  const response = await apiCall("/auth/login", "POST", data);
  localStorage.setItem("access_token", response.access_token);
  localStorage.setItem("refresh_token", response.refresh_token);
  return response;
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

export const getCurrentUser = async (): Promise<UserMe> => {
  return apiCall("/users/me");
};

export const updateProfile = async (data: UserUpdate): Promise<UserMe> => {
  return apiCall("/users/me", "PUT", data);
};

export const updateAvatar = async (data: UserUpdate): Promise<UserMe> => {
  return apiCall("/users/me/avatar", "PUT", data);
};

export const changePassword = async (data: ChangePassword): Promise<{ message: string }> => {
  return apiCall("/users/me/password", "PUT", data);
};

export const deleteAccount = async (): Promise<{ message: string }> => {
  return apiCall("/users/me", "DELETE");
};

export const searchUsers = async (query: string, limit: number = 20): Promise<UserPublic[]> => {
  return apiCall(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
};