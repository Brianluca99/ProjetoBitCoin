export const SCENARIOS = {
  default: "Sucesso com latência normal",
  empty: "Catálogo vazio",
  slow: "Rede lenta (2,5 s por requisição)",
  "variable-latency": "Latência variável e respostas fora de ordem",
  offline: "Sem conexão (falha de rede)",
  "server-error": "Erro 500 nas consultas do catálogo",
  "session-expired": "Sessão expira 20 s após o login",
  "favorites-fail": "Falha ao salvar favoritos (rollback)",
  "price-change": "Preço muda com o carrinho aberto",
  "sold-out": "Edição esgota durante a compra",
  "order-timeout": "Timeout após criar o pedido (idempotência)",
  "payment-declined": "Pagamento recusado",
  "wallet-reject": "Carteira recusa a conexão",
  "duplicate-events": "Eventos Socket.IO duplicados e antigos",
} as const;

export type ScenarioName = keyof typeof SCENARIOS;

const KEY = "kurio-mock-scenario";

export function getScenario(): ScenarioName {
  if (typeof window === "undefined") return "default";
  const v = localStorage.getItem(KEY);
  return v && v in SCENARIOS ? (v as ScenarioName) : "default";
}

export function setScenario(name: ScenarioName) {
  localStorage.setItem(KEY, name);
}

export function readScenarioFromUrl() {
  const v = new URL(window.location.href).searchParams.get("scenario");
  if (v && v in SCENARIOS) setScenario(v as ScenarioName);
}

export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rand = seededRandom(42);
export const resetRandom = () => {
  rand = seededRandom(42);
};

export function latencyFor(path: string, scenario: ScenarioName): number {
  if (scenario === "slow") return 2500;
  if (scenario === "variable-latency") {
    const page = Number(new URLSearchParams(path.split("?")[1] ?? "").get("page") ?? "1");
    return page % 2 === 1 ? 1800 : 150 + Math.floor(rand() * 200);
  }
  return 250 + Math.floor(rand() * 250);
}
