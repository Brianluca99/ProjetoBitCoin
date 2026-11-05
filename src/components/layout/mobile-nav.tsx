import { Link } from "@tanstack/react-router";
import { Heart, Home, ShoppingBag, User, Wallet } from "lucide-react";
import { useCart } from "@/services/client-api";

const ITEMS = [
  { to: "/", label: "Início", icon: Home },
  { to: "/favorites", label: "Favoritos", icon: Heart },
  { to: "/cart", label: "Carrinho", icon: ShoppingBag },
  { to: "/account/wallets", label: "Carteiras", icon: Wallet },
  { to: "/account/profile", label: "Perfil", icon: User },
] as const;

export function MobileNav() {
  const count = useCart().data?.items.reduce((n, c) => n + c.quantity, 0) ?? 0;
  return (
    <nav aria-label="Navegação inferior" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link to={to} activeOptions={{ exact: to === "/" }} className="relative flex flex-col items-center gap-1 py-2.5 text-[10px] uppercase text-muted-foreground" activeProps={{ className: "!text-primary", "aria-current": "page" }}>
              <Icon className="size-5" aria-hidden />
              {label}
              {to === "/cart" && count > 0 && (
                <span className="absolute right-[22%] top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground" aria-label={`${count} itens`}>{count}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
