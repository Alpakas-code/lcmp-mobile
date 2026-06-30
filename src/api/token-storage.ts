import * as SecureStore from "expo-secure-store";
import type { AuthPayload, AuthUser } from "../types/auth";

const accessTokenKey = "lcmp.mobile.accessToken";
const refreshTokenKey = "lcmp.mobile.refreshToken";
const userKey = "lcmp.mobile.user";

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export async function getStoredAccessToken() {
  return SecureStore.getItemAsync(accessTokenKey);
}

export async function getStoredRefreshToken() {
  return SecureStore.getItemAsync(refreshTokenKey);
}

export async function getStoredAuth(): Promise<StoredAuth | null> {
  const [accessToken, refreshToken, rawUser] = await Promise.all([
    SecureStore.getItemAsync(accessTokenKey),
    SecureStore.getItemAsync(refreshTokenKey),
    SecureStore.getItemAsync(userKey)
  ]);

  if (!accessToken || !refreshToken || !rawUser) {
    return null;
  }

  try {
    return {
      accessToken,
      refreshToken,
      user: JSON.parse(rawUser) as AuthUser
    };
  } catch {
    await clearStoredAuth();
    return null;
  }
}

export async function setStoredAuth(auth: AuthPayload) {
  await Promise.all([
    SecureStore.setItemAsync(accessTokenKey, auth.accessToken),
    SecureStore.setItemAsync(refreshTokenKey, auth.refreshToken),
    SecureStore.setItemAsync(userKey, JSON.stringify(auth.user))
  ]);
}

export async function clearStoredAuth() {
  await Promise.all([
    SecureStore.deleteItemAsync(accessTokenKey),
    SecureStore.deleteItemAsync(refreshTokenKey),
    SecureStore.deleteItemAsync(userKey)
  ]);
}
