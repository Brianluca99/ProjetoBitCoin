import type { QueryClient } from "@tanstack/react-query";
import type { NftUpdatedEvent } from "./contracts";

type NftListener = (e: NftUpdatedEvent) => void;
const nftListeners = new Set<NftListener>();
export const onNftUpdated = (l: NftListener) => {
  nftListeners.add(l);
  return () => {
    nftListeners.delete(l);
  };
};

export function createRealtime(queryClient: QueryClient) {
  // TODO: Implementar Supabase Realtime. A ligação antiga ao socket.io foi desativada.
  return () => {
    // Cleanup vazio por agora
  };
}
