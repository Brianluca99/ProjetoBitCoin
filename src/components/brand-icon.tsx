import shop from "@/assets/icons/Shop.svg";
import user from "@/assets/icons/User.svg";
import search from "@/assets/icons/Search.svg";
import message from "@/assets/icons/Message.svg";
import x from "@/assets/icons/X.svg";
import arrowDown from "@/assets/icons/Arrow-Down.svg";
import { cn } from "@/lib/utils";

const ICONS = { shop, user, search, message, x, arrowDown } as const;

export function BrandIcon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  const url = `url("${ICONS[name]}")`;
  return (
    <span
      aria-hidden="true"
      className={cn("icon-mask size-5 shrink-0", className)}
      style={{ maskImage: url, WebkitMaskImage: url }}
    />
  );
}
