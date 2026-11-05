const TOKEN_KEY = "kurio-session-token";
const GUEST_KEY = "kurio-guest-id";

type Listener = (reason: "login" | "logout" | "expired") => void;
const listeners = new Set<Listener>();

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null, reason: "login" | "logout" | "expired") {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  listeners.forEach((l) => l(reason));
}

export function getGuestId(): string {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export function onSessionChange(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
