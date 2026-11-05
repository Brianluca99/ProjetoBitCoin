import { useSyncExternalStore } from "react";

type AuthMode = "login" | "register" | null;
let authModal: AuthMode = null;
const listeners = new Set<() => void>();

export function useAuthModal(): AuthMode {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => authModal,
    () => null,
  );
}

export const actions = {
  openAuth(mode: AuthMode) {
    authModal = mode;
    listeners.forEach((l) => l());
  },
};

export const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
