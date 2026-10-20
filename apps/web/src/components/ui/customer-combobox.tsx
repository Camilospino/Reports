"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";

type Customer = { id: string; name: string; detail?: string | null };

const NEW = "new";
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Buscador de clientes accesible (patrón combobox de WAI-ARIA). Con `allowNew` agrega
// la opción "Crear cliente nuevo", que devuelve el valor "new".
export function CustomerCombobox({
  id,
  name,
  customers,
  value,
  onChange,
  allowNew = false,
  required = false,
}: {
  id: string;
  name?: string;
  customers: Customer[];
  value: string;
  onChange: (id: string, text: string) => void;
  allowNew?: boolean;
  required?: boolean;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const selected = customers.find((c) => c.id === value);
  const [query, setQuery] = useState(value === NEW ? "" : (selected?.name ?? ""));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const options = useMemo(() => {
    const q = normalize(query.trim());
    const list = customers.filter((c) => !q || normalize(c.name).includes(q) || normalize(c.detail ?? "").includes(q)).slice(0, 50);
    return allowNew ? [...list, { id: NEW, name: query.trim() ? `Crear cliente nuevo: "${query.trim()}"` : "Crear cliente nuevo" }] : list;
  }, [customers, query, allowNew]);

  const choose = (c: Customer) => {
    onChange(c.id, query.trim());
    setQuery(c.id === NEW ? query : c.name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Search size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
      <input
        ref={input}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className="input pl-10"
        placeholder="Busca por nombre"
        value={query}
        required={required && !value}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
          if (value && value !== NEW) onChange("", e.target.value);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && open && options[active]) {
            e.preventDefault();
            choose(options[active]!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {name && <input type="hidden" name={name} value={value} />}
      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-[10px] border border-line bg-surface py-1"
        >
          {options.map((c, i) => (
            <li
              key={c.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={c.id === value}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(c);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm ${i === active ? "bg-bg" : ""} ${
                c.id === NEW ? "border-t border-line-soft font-semibold text-primary" : ""
              }`}
            >
              {c.id === NEW && <Plus size={16} aria-hidden />}
              <span className="min-w-0">
                <span className="block truncate">{c.name}</span>
                {c.detail && <span className="block truncate text-xs text-muted">{c.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {open && options.length === 0 && (
        <p className="absolute z-20 mt-1 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-muted">
          No hay clientes con ese nombre.
        </p>
      )}
    </div>
  );
}
