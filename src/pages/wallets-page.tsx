import { Pencil, Unplug, WalletCards } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthForm } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { shortAddress } from "@/lib/store";
import { ApiError } from "@/services/http";
import { useScope, useWalletMutations, useWallets } from "@/services/client-api";
import type { Wallet } from "@/services/contracts";

const PROVIDERS: Wallet["provider"][] = ["MetaMask", "Coinbase", "WalletConnect", "Ledger"];
const ROLES: Wallet["role"][] = ["primary", "secondary"];
const empty: Omit<Wallet, "id"> = {
  label: "",
  provider: "MetaMask",
  address: "",
  role: "secondary",
};

export function WalletsPage() {
  const { ready, authed } = useScope();
  const {
    data: walletsData,
    isLoading: walletsLoading,
    isError: walletsError,
    refetch: refetchWallets,
  } = useWallets();
  const { save, connect, disconnect: del } = useWalletMutations();
  const [editing, setEditing] = useState<(Omit<Wallet, "id"> & { id?: string }) | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const wallets = walletsData?.wallets ?? [];
  const connectedId = walletsData?.connectedId ?? null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (!editing.label.trim()) {
      setErr("Informe um nome.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(editing.address)) {
      setErr("Endereço inválido (0x + 40 caracteres hexadecimais).");
      return;
    }
    save.mutate(editing, {
      onSuccess: () => {
        setEditing(null);
        toast.success("Carteira salva");
      },
      onError: (error) =>
        setErr(error instanceof ApiError ? error.message : "Não foi possível salvar a carteira."),
    });
  };

  if (!ready || (authed && walletsLoading)) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-8">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        <p className="mb-4 text-sm text-muted-foreground">Entre para gerenciar suas carteiras.</p>
        <AuthForm mode="login" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold uppercase">Carteiras</h1>
        <Button
          onClick={() => {
            setErr(null);
            setEditing({ ...empty });
          }}
        >
          Adicionar
        </Button>
      </div>
      {walletsError ? (
        <div role="alert" className="rounded border border-border p-8 text-center text-sm">
          Não foi possível carregar as carteiras.{" "}
          <Button variant="link" onClick={() => void refetchWallets()}>
            Tentar novamente
          </Button>
        </div>
      ) : wallets.length ? (
        <ul className="space-y-3">
          {wallets.map((wallet) => (
            <li
              key={wallet.id}
              className="flex flex-wrap items-center gap-3 rounded border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {wallet.label}
                  {wallet.role === "primary" ? " · Principal" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {wallet.provider} ·{" "}
                  <span className="font-mono">{shortAddress(wallet.address)}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Editar ${wallet.label}`}
                onClick={() => {
                  setErr(null);
                  setEditing(wallet);
                }}
              >
                <Pencil />
              </Button>
              {connectedId === wallet.id ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={del.isPending}
                  onClick={() =>
                    del.mutate(wallet.id, {
                      onError: () => toast.error("Não foi possível desconectar a carteira."),
                    })
                  }
                >
                  <Unplug /> Desconectar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={connect.isPending}
                  onClick={() =>
                    connect.mutate(wallet.id, {
                      onError: () => toast.error("Não foi possível conectar a carteira."),
                    })
                  }
                >
                  <WalletCards /> Conectar
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhuma carteira cadastrada.
        </p>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar carteira" : "Nova carteira"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="w-label">Nome</Label>
                <Input
                  id="w-label"
                  value={editing.label}
                  onChange={(event) => setEditing({ ...editing, label: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-prov">Provedor</Label>
                <Select
                  value={editing.provider}
                  onValueChange={(value) => {
                    const provider = PROVIDERS.find((item) => item === value);
                    if (provider) setEditing({ ...editing, provider });
                  }}
                >
                  <SelectTrigger id="w-prov">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-role">Tipo</Label>
                <Select
                  value={editing.role}
                  onValueChange={(value) => {
                    const role = ROLES.find((item) => item === value);
                    if (role) setEditing({ ...editing, role });
                  }}
                >
                  <SelectTrigger id="w-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Principal</SelectItem>
                    <SelectItem value="secondary">Secundária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-addr">Endereço</Label>
                <Input
                  id="w-addr"
                  className="font-mono"
                  value={editing.address}
                  onChange={(event) =>
                    setEditing({ ...editing, address: event.target.value.trim() })
                  }
                  placeholder="0x…"
                  aria-invalid={!!err}
                  aria-describedby="w-err"
                  required
                />
              </div>
              <p id="w-err" role="alert" className="text-xs text-destructive">
                {err}
              </p>
              <Button type="submit" className="w-full" disabled={save.isPending}>
                Salvar
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
