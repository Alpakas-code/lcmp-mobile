import { create } from "zustand";
import { apiClient, setUnauthorizedHandler, unwrapResponse } from "../api/client";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "../api/token-storage";
import { authenticateWithBiometrics, setRememberedDevice } from "../native/biometric-auth";
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
  sessionExpiredAt: number | null;
  hydrate: () => Promise<void>;
  biometricLogin: () => Promise<AuthUser | null>;
  clearSessionExpired: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

function isMobileRole(role: AuthUser["role"]) {
  return role === "TEACHER" || role === "STUDENT";
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrating: true,
  sessionExpiredAt: null,
  hydrate: async () => {
    try {
      const auth = await getStoredAuth();
      set({ user: auth?.user ?? null, isHydrating: false });
    } catch {
      await clearStoredAuth();
      set({ user: null, isHydrating: false });
    }
  },
  biometricLogin: async () => {
    const user = await authenticateWithBiometrics();
    if (!user) return null;
    set({ user });
    return user;
  },
  clearSessionExpired: () => set({ sessionExpiredAt: null }),
  login: async (email, password) => {
    const response = await apiClient.post<ApiEnvelope<AuthPayload>>("/auth/login", {
      email: email.trim().toLowerCase(),
      password
    });
    const auth = unwrapResponse<AuthPayload>(response);

    if (!isMobileRole(auth.user.role)) {
      await clearStoredAuth();
      set({ user: null, sessionExpiredAt: null });
      throw new AdminWebOnlyLoginError();
    }

    await setStoredAuth(auth);
    set({ user: auth.user, sessionExpiredAt: null });

    return auth.user;
  },
  logout: async () => {
    await setRememberedDevice(false);
    await clearStoredAuth();
    set({ user: null, sessionExpiredAt: null });
  }
}));

setUnauthorizedHandler(() => {
  useAuthStore.setState({ user: null, sessionExpiredAt: Date.now() });
});
