import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { COLLECTIONS, RARITIES } from "@/mocks/fixtures";
import type { CatalogFilters, Rarity } from "@/services/contracts";

const MAX = 3;

export function CatalogFiltersPanel({
  search,
  onChange,
}: {
  search: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
}) {
  const [range, setRange] = useState<[number, number]>([search.minPrice ?? 0, search.maxPrice ?? MAX]);
  useEffect(() => setRange([search.minPrice ?? 0, search.maxPrice ?? MAX]), [search.minPrice, search.maxPrice]);

  const toggle = <T,>(list: T[] | undefined, v: T) => {
    const next = list?.includes(v) ? list.filter((x) => x !== v) : [...(list ?? []), v];
    return next.length ? next : undefined;
  };

  return (
    <div className="space-y-6 text-xs">
      <fieldset>
        <legend className="mb-3 font-bold uppercase tracking-wider">Coleções</legend>
        <div className="space-y-2.5">
          {COLLECTIONS.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <Checkbox id={`col-${c}`} checked={search.collections?.includes(c) ?? false} onCheckedChange={() => onChange({ collections: toggle(search.collections, c) })} />
              <label htmlFor={`col-${c}`} className="cursor-pointer text-muted-foreground">{c}</label>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-bold uppercase tracking-wider">Faixa de preço</legend>
        <Slider
          min={0}
          max={MAX}
          step={0.05}
          value={range}
          onValueChange={(v) => setRange([v[0] ?? 0, v[1] ?? MAX])}
          aria-label="Faixa de preço em ETH"
        />
        <p className="mt-2 text-muted-foreground" aria-live="polite">{range[0].toFixed(2)} ETH – {range[1].toFixed(2)} ETH</p>
        <Button
          size="sm"
          className="mt-2 h-7 text-[11px]"
          onClick={() => onChange({ minPrice: range[0] > 0 ? range[0] : undefined, maxPrice: range[1] < MAX ? range[1] : undefined })}
        >
          Aplicar
        </Button>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-bold uppercase tracking-wider">Raridade</legend>
        <div className="space-y-2.5">
          {RARITIES.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <Checkbox id={`rar-${r}`} checked={search.rarities?.includes(r) ?? false} onCheckedChange={() => onChange({ rarities: toggle<Rarity>(search.rarities, r) })} />
              <label htmlFor={`rar-${r}`} className="cursor-pointer text-muted-foreground">{r}</label>
            </div>
          ))}
        </div>
      </fieldset>

      <Button variant="outline" size="sm" className="w-full" onClick={() => onChange({ collections: undefined, rarities: undefined, minPrice: undefined, maxPrice: undefined })}>
        Limpar filtros
      </Button>
    </div>
  );
}
