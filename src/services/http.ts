import axios, { AxiosError } from "axios";
import type { ApiErrorBody, ApiErrorCode, Quote } from "./contracts";
import { getGuestId, getToken, setToken } from "./session";

let ready: Promise<unknown> | null = null;

export function ensureMocks(): Promise<unknown> {
  if (typeof window === "undefined") return Promise.resolve();
  if (import.meta.env["VITE_ENABLE_MOCKS"] === "false") return Promise.resolve();
  ready ??= import("@/mocks/browser").then((m) => m.startMocks());
  return ready;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
    public fields: Partial<Record<string, string>> = {},
    public quote?: Quote,
  ) {
    super(message);
  }
}

export const http = axios.create({
  baseURL: import.meta.env["VITE_API_URL"] ?? "/api",
  timeout: 5000,
});

http.interceptors.request.use(async (config) => {
  await ensureMocks();
  const token = getToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  config.headers.set("X-Guest-Id", getGuestId());
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (error: AxiosError<ApiErrorBody>) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return Promise.reject(new ApiError(0, "TRANSIENT", "A requisição demorou demais. Tentando de novo…"));
    }
    const res = error.response;
    if (!res) return Promise.reject(new ApiError(0, "TRANSIENT", "Sem conexão com o servidor."));
    const b = res.data;
    if (res.status === 401 && getToken() && (b?.code === "SESSION_EXPIRED" || b?.code === "UNAUTHORIZED")) {
      setToken(null, "expired");
    }
    return Promise.reject(new ApiError(res.status, b?.code ?? "TRANSIENT", b?.message ?? "Erro inesperado.", b?.fields ?? {}, b?.quote));
  },
);

export const isTransient = (e: unknown) => e instanceof ApiError && (e.code === "TRANSIENT" || e.status >= 500);
