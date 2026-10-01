'use client';

import { create } from 'zustand';
import {
  authClient,
  type AuthClient,
  type LoginCredentials,
  type UserRole,
} from './auth-client';

export interface AuthState {
  accessToken: string | null;
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  isInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  refresh: () => Promise<boolean>;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
  setSession: (accessToken: string) => void;
}

let initializationPromise: Promise<void> | null = null;

interface DecodedSession {
  userId: string | null;
  email: string | null;
  role: UserRole | null;
}

function decodeSession(accessToken: string): DecodedSession {
  const [, encodedPayload] = accessToken.split('.');

  if (!encodedPayload) {
    return { userId: null, email: null, role: null };
  }

  try {
    const normalizedPayload = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
    const payload = JSON.parse(atob(normalizedPayload)) as unknown;

    if (typeof payload === 'object' && payload !== null) {
      const role = 'role' in payload && isUserRole(payload.role)
        ? payload.role
        : null;
      const email =
        'email' in payload && typeof payload.email === 'string'
          ? payload.email
          : null;

      const userId = 'sub' in payload && typeof payload.sub === 'string'
        ? payload.sub
        : null;
      return { userId, email, role };
    }
  } catch {
    return { userId: null, email: null, role: null };
  }

  return { userId: null, email: null, role: null };
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'author' || value === 'editor' || value === 'admin';
}

export function createAuthStore(client: AuthClient = authClient) {
  return create<AuthState>((set, get) => ({
    accessToken: null,
    userId: null,
    email: null,
    role: null,
    isInitialized: false,

    setSession(accessToken) {
      const session = decodeSession(accessToken);
      set({ accessToken, ...session, isInitialized: true });
    },

    clearSession() {
      set({ accessToken: null, userId: null, email: null, role: null, isInitialized: true });
    },

    async login(credentials) {
      const response = await client.login(credentials);
      get().setSession(response.accessToken);
    },

    async refresh() {
      try {
        const response = await client.refreshAccessToken();
        get().setSession(response.accessToken);
        return true;
      } catch {
        get().clearSession();
        return false;
      }
    },

    async initialize() {
      if (get().isInitialized) {
        return;
      }

      if (!initializationPromise) {
        initializationPromise = get()
          .refresh()
          .then(() => undefined)
          .finally(() => {
            initializationPromise = null;
          });
      }

      await initializationPromise;
    },

    async logout() {
      try {
        await client.logout();
      } finally {
        get().clearSession();
      }
    },
  }));
}

export const useAuthStore = createAuthStore();
