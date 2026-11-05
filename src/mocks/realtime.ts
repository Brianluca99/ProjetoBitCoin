import { toSocketIo } from "@mswjs/socket.io-binding";
import { ws } from "msw";
import type { Nft, NftUpdatedEvent, Order, OrderUpdatedEvent } from "@/services/contracts";
import { getDb } from "./db";
import { getScenario } from "./scenarios";

type Io = ReturnType<typeof toSocketIo>;
interface Peer {
  io: Io;
  close: () => void;
  userId: string | null;
}

const peers = new Set<Peer>();
let eventSeq = 0;

const link = ws.link(/\/socket\.io\//);

export const socketHandlers = [
  link.addEventListener("connection", (connection) => {
    const io = toSocketIo(connection);
    const peer: Peer = { io, close: () => connection.client.close(), userId: null };
    peers.add(peer);
    io.client.on("session", (_event, token: unknown) => {
      const s = typeof token === "string" ? getDb().sessions[token] : undefined;
      peer.userId = s && s.expiresAt > Date.now() ? s.userId : null;
      io.client.emit("session.ready", { authenticated: !!peer.userId });
    });
    connection.client.addEventListener("close", () => peers.delete(peer));
  }),
];

function send(event: string, payload: unknown, userId?: string) {
  const dup = getScenario() === "duplicate-events";
  for (const p of peers) {
    if (userId && p.userId !== userId) continue;
    p.io.client.emit(event, payload);
    if (dup) p.io.client.emit(event, payload);
  }
}

export function emitNftUpdated(nft: Nft) {
  const payload: NftUpdatedEvent = {
    eventId: `evt-${++eventSeq}-${Date.now()}`,
    resource: { type: "nft", id: nft.id },
    version: nft.version,
    data: { id: nft.id, price: nft.price, available: nft.available, version: nft.version },
  };
  send("nft.updated", payload);
  if (getScenario() === "duplicate-events" && nft.version > 1) {
    send("nft.updated", { ...payload, eventId: `evt-old-${eventSeq}`, version: nft.version - 1, data: { ...payload.data, price: "0.01", version: nft.version - 1 } });
  }
}

export function emitOrderUpdated(order: Order & { userId: string }) {
  const payload: OrderUpdatedEvent = {
    eventId: `evt-${++eventSeq}-${Date.now()}`,
    resource: { type: "order", id: order.id },
    version: order.version,
    data: { id: order.id, status: order.status, version: order.version, declineReason: order.declineReason },
  };
  send("order.updated", payload, order.userId);
}

export function dropAllSockets() {
  for (const p of [...peers]) p.close();
  peers.clear();
}
