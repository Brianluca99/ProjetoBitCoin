import { Link, useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState, type FormEvent } from "react";
import { BrandIcon } from "@/components/brand-icon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { actions } from "@/lib/store";
import { useAuthActions, useCart, useSession } from "@/services/client-api";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/cart", label: "Carrinho" },
  { to: "/account/profile", label: "Perfil" },
  { to: "/account/wallets", label: "Carteiras" },
] as const;

export function SiteHeader() {
  const count = useCart().data?.items.reduce((n, c) => n + c.quantity, 0) ?? 0;
  const { user } = useSession();
  const { logout } = useAuthActions();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/", search: { q: q || undefined } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetTitle className="font-display text-primary">KURIO</SheetTitle>
            <nav aria-label="Menu principal" className="mt-6 flex flex-col gap-1">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="rounded px-3 py-2 text-sm hover:bg-secondary" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="font-display text-lg font-bold tracking-widest text-foreground">
          KURIO
        </Link>

        <nav aria-label="Principal" className="ml-6 hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="border-b-2 border-transparent py-1 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "!border-primary !text-primary" }}
              activeOptions={{ exact: true }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <form role="search" onSubmit={onSearch} className="ml-auto hidden min-w-0 sm:block">
          <label htmlFor="header-search" className="sr-only">Buscar NFTs</label>
          <div className="flex items-center gap-2 rounded border border-input bg-surface px-3 focus-within:ring-2 focus-within:ring-ring">
            <BrandIcon name="search" className="size-4 text-muted-foreground" />
            <input
              id="header-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar NFTs, coleções…"
              className="h-9 w-40 bg-transparent text-xs outline-none placeholder:text-muted-foreground lg:w-56"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link to="/cart" aria-label={`Carrinho, ${count} itens`}>
              <BrandIcon name="shop" className="text-sand" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu da conta">
                  <BrandIcon name="user" className="text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link to="/account/profile">Meu perfil</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/account/wallets">Carteiras</Link></DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { void logout().then(() => navigate({ to: "/" })); }}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => actions.openAuth("login")} className="text-xs uppercase">
              Entrar
            </Button>
          )}
        </div>
      </div>
      <form role="search" onSubmit={onSearch} className="px-4 pb-3 sm:hidden">
        <label htmlFor="header-search-m" className="sr-only">Buscar NFTs</label>
        <div className="flex items-center gap-2 rounded border border-input bg-surface px-3 focus-within:ring-2 focus-within:ring-ring">
          <BrandIcon name="search" className="size-4 text-muted-foreground" />
          <input id="header-search-m" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar NFTs…" className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
      </form>
    </header>
  );
}
