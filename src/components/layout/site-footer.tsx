import { Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FEATURES = [
  { icon: ShieldCheck, title: "Segurança de carteira", text: "Transações assinadas localmente, sem custódia das suas chaves." },
  { icon: Sparkles, title: "Criadores em destaque", text: "Curadoria semanal com artistas digitais independentes." },
  { icon: Bell, title: "Alertas de lançamentos", text: "Seja avisado quando novas edições limitadas forem lançadas." },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title}>
            <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <f.icon className="size-4" aria-hidden="true" />
            </span>
            <h3 className="mt-3 text-sm font-bold">{f.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Inscrição confirmada!");
            e.currentTarget.reset();
          }}
        >
          <h3 className="text-sm font-bold">Cadastre-se nas próximas temporadas</h3>
          <div className="mt-3 flex gap-2">
            <label htmlFor="newsletter" className="sr-only">E-mail</label>
            <Input id="newsletter" type="email" required placeholder="seu@email.com" />
            <Button type="submit">Assinar</Button>
          </div>
        </form>
      </div>
      <div className="bg-band">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-xs text-sand sm:flex-row sm:justify-between sm:px-6">
          <span className="font-display font-bold tracking-widest text-foreground">KURIO</span>
          <span>contato@kurio.art</span>
          <span>Seg–Sex · 9h às 18h</span>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-xs sm:px-6 md:grid-cols-4">
        {[
          ["Meu perfil", [["/account/profile", "Editar perfil"], ["/account/wallets", "Carteiras"], ["/cart", "Carrinho"]]],
          ["Central de ajuda", [["/", "Como comprar"], ["/", "Taxas de rede"], ["/", "Suporte"]]],
          ["Coleções", [["/", "Emerald Apes"], ["/", "Velvet Hoods"], ["/", "Golden Tunes"]]],
          ["Redes sociais", [["/", "Discord"], ["/", "X / Twitter"], ["/", "Instagram"]]],
        ].map(([title, links]) => (
          <nav key={title as string} aria-label={title as string}>
            <h3 className="mb-2 font-bold text-foreground">{title as string}</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              {(links as [string, string][]).map(([to, label]) => (
                <li key={label}>
                  <Link to={to} className="hover:text-primary">{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="border-t border-border py-4 text-center text-[11px] text-muted-foreground">
        © 2026 Kurio. Marketplace de arte digital.
      </p>
    </footer>
  );
}
