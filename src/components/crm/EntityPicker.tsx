import { useState } from "react";
import { Check, ChevronsUpDown, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Option } from "@/db/helpers";
import { cn } from "@/lib/utils";

type EntityPickerProps = {
  value: Option | null;
  onChange: (value: Option | null) => void;
  search: (term: string) => Promise<Option[]>;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
};

/** Searchable single-select backed by a database query. */
export function EntityPicker({ value, onChange, search, placeholder = "Select…", id, disabled }: EntityPickerProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debounced = useDebouncedValue(term);
  const { data = [], loading } = useAsync(() => search(debounced), [debounced], open);

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>{value?.label ?? placeholder}</span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput value={term} onValueChange={setTerm} placeholder="Type to search…" />
            <CommandList>
              <CommandEmpty>{loading ? "Searching…" : "No matches."}</CommandEmpty>
              <CommandGroup>
                {data.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={String(option.id)}
                    onSelect={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("h-4 w-4", value?.id === option.id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{option.label}</span>
                    {option.hint ? <span className="ml-auto truncate text-xs text-muted-foreground">{option.hint}</span> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && !disabled ? (
        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => onChange(null)} aria-label="Clear">
          <X />
        </Button>
      ) : null}
    </div>
  );
}
