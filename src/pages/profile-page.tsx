import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthForm } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatEth } from "@/lib/decimal";
import {
  useAuthActions,
  useOrders,
  useScope,
  useSession,
  useUpdateMe,
} from "@/services/client-api";
import type { User } from "@/services/contracts";

type ProfileForm = Omit<User, "id" | "avatar">;

const profileForm = (user: User): ProfileForm => ({
  name: user.name,
  username: user.username,
  email: user.email,
  phone: user.phone,
  bio: user.bio,
});

export function ProfilePage() {
  const { ready, authed } = useScope();
  const { user, isLoading: sessionLoading } = useSession();
  const ordersQuery = useOrders();
  const { data: orders = [] } = ordersQuery;
  const update = useUpdateMe();
  const { logout } = useAuthActions();
  const [form, setForm] = useState<ProfileForm | null>(null);

  useEffect(() => {
    if (user) setForm(profileForm(user));
  }, [user]);

  if (!ready || (authed && sessionLoading))
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-80 w-full" />
      </div>
    );
  if (!authed || !user || !form) {
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        <p className="mb-4 text-sm text-muted-foreground">Entre para ver seu perfil.</p>
        <AuthForm mode="login" />
      </div>
    );
  }

  const set = (key: keyof ProfileForm) => (event: { target: { value: string } }) =>
    setForm((current) => (current ? { ...current, [key]: event.target.value } : current));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Preencha nome e um e-mail válido.");
      return;
    }
    update.mutate(form, {
      onSuccess: (user) => {
        setForm(profileForm(user));
        toast.success("Perfil atualizado");
      },
      onError: () => toast.error("Não foi possível atualizar o perfil."),
    });
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1fr)_320px]">
      <form
        onSubmit={submit}
        className="space-y-4 rounded border border-border bg-card p-5"
        aria-labelledby="ptitle"
      >
        <h1 id="ptitle" className="text-xl font-bold uppercase">
          Meu perfil
        </h1>
        {(
          [
            ["name", "Nome", "text"],
            ["username", "Usuário", "text"],
            ["email", "E-mail", "email"],
            ["phone", "Telefone", "tel"],
          ] as const
        ).map(([key, label, type]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`p-${key}`}>{label}</Label>
            <Input
              id={`p-${key}`}
              type={type}
              value={form[key]}
              onChange={set(key)}
              required={key !== "phone"}
            />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label htmlFor="p-bio">Bio</Label>
          <Textarea id="p-bio" value={form.bio} onChange={set("bio")} rows={3} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending && <Loader2 className="animate-spin" />} Salvar
          </Button>
          <Button type="button" variant="outline" onClick={() => void logout()}>
            Sair
          </Button>
        </div>
      </form>
      <section aria-labelledby="otitle" className="h-fit rounded border border-border bg-card p-5">
        <h2 id="otitle" className="text-sm font-bold uppercase">
          Pedidos
        </h2>
        {ordersQuery.isError ? (
          <p role="alert" className="mt-3 text-xs text-destructive">
            Não foi possível carregar seus pedidos.
          </p>
        ) : orders.length ? (
          <ul className="mt-3 space-y-2 text-xs">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to="/order/$id"
                  params={{ id: order.id }}
                  className="flex justify-between rounded border border-border p-3 hover:border-primary"
                >
                  <span>{order.id}</span>
                  <span className="text-primary">{formatEth(String(order.quote.total))}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Nenhum pedido ainda.</p>
        )}
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/account/wallets">Gerenciar carteiras</Link>
        </Button>
      </section>
    </div>
  );
}
