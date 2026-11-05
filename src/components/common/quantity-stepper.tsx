import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded border border-input">
      <Button type="button" variant="ghost" size="icon" className="size-9" aria-label="Diminuir quantidade" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus />
      </Button>
      <output aria-live="polite" className="w-8 text-center text-sm tabular-nums">{value}</output>
      <Button type="button" variant="ghost" size="icon" className="size-9" aria-label="Aumentar quantidade" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus />
      </Button>
    </div>
  );
}
