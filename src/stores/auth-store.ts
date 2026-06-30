import { create } from "zustand";
import { apiClient, unwrapResponse } from "../api/client";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "../api/token-storage";
import type { ApiEnvelope, AuthPayload, AuthUser } from "../types/auth";

export const adminWebOnlyMessage = "Admin accounts are available on the web dashboard.";

export class AdminWebOnlyLoginError extends Error {
  constructor() {
    super(adminWebOnlyMessage);
    this.name = "AdminWebOnlyLoginError";
  }
}

type AuthState = {
  user: AuthUser | null;
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

function isMobileRole(role: AuthUser["role"]) {
  return role === "TEACHER" || role === "STUDENT";
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrating: true,
  hydrate: async () => {
    const auth = await getStoredAuth();
    set({ user: auth?.user ?? null, isHydrating: false });
  },
  login: async (email, password) => {
    const response = await apiClient.post<ApiEnvelope<AuthPayload>>("/auth/login", {
      email: email.trim().toLowerCase(),
      password
    });
    const auth = unwrapResponse<AuthPayload>(response);

    if (!isMobileRole(auth.user.role)) {
      await clearStoredAuth();
      set({ user: null });
      throw new AdminWebOnlyLoginError();
    }

    await setStoredAuth(auth);
    set({ user: auth.user });

    return auth.user;
  },
  logout: async () => {
    await clearStoredAuth();
    set({ user: null });
  }
}));
