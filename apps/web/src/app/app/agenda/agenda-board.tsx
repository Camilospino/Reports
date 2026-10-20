"use client";

import { useEffect, useId, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type CollisionDetection,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Star, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { orderCode, shortDate, time } from "@/lib/format";
import {
  DAY_END,
  DAY_START,
  HOURS,
  SNAP,
  SPAN,
  addDays,
  dateKeyOf,
  dayLabel,
  isoAt,
  minutesOfDay,
  type AgendaAbsence,
  type AgendaOrder,
  type AgendaTechnician,
  type AgendaView,
} from "@/lib/agenda";
import { scheduleOrder } from "./actions";

type Pending = AgendaOrder & { suggested: string | null };
type Move = { orderId: string; technicianId: string; start: string };
type DragData = { kind: "card" | "block"; order: AgendaOrder };

// Colores de los bloques de la línea de tiempo.
const BLOCK: Partial<Record<AgendaOrder["status"], { bg: string; fg: string; label: string }>> = {
  completada: { bg: "#10211C", fg: "#FFFFFF", label: "Completada" },
  en_proceso: { bg: "#CFE5DD", fg: "#08392F", label: "En proceso" },
  en_camino: { bg: "#FBD9C4", fg: "#7A2A06", label: "En camino" },
  asignada: { bg: "#D6E2F7", fg: "#173C82", label: "Asignada" },
};
const ABSENCE = { bg: "#EDEFEE", border: "#9AA6A2" };
const LEGEND = [...Object.values(BLOCK), { bg: ABSENCE.bg, fg: "#55645F", label: "Ausencia" }];

// Solo se reprograman órdenes que no han arrancado.
const movable = (o: AgendaOrder) => o.status === "asignada" || o.status === "pendiente";

const pct = (minutes: number) => `${((minutes - DAY_START) / SPAN) * 100}%`;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// Tramo visible [inicio, fin] en minutos de un intervalo dentro del día `day`, recortado a 7:00–18:00.
function span(day: string, start: string, end: string): [number, number] | null {
  const dayStart = Date.parse(isoAt(day, 0));
  const s = clamp((Date.parse(start) - dayStart) / 60_000, DAY_START, DAY_END);
  const e = clamp((Date.parse(end) - dayStart) / 60_000, DAY_START, DAY_END);
  if (Date.parse(end) <= dayStart || Date.parse(start) >= dayStart + 86_400_000) return null;
  return e - s >= SNAP ? [s, e] : [Math.min(s, DAY_END - SNAP), Math.min(s, DAY_END - SNAP) + SNAP];
}

// Con mouse o dedo manda el puntero; con teclado, la posición de la orden.
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

const laneRect = (technicianId: string) =>
  document.querySelector(`[data-lane="${technicianId}"]`)?.getBoundingClientRect() ?? null;
const minutesAt = (lane: DOMRect, x: number) => DAY_START + ((x - lane.left) / lane.width) * SPAN;

const endOf = (o: AgendaOrder) => o.end ?? new Date(Date.parse(o.start!) + o.durationMin * 60_000).toISOString();

function applyMove(state: { orders: AgendaOrder[]; unassigned: Pending[] }, m: Move) {
  const order = state.orders.find((o) => o.id === m.orderId) ?? state.unassigned.find((o) => o.id === m.orderId);
  if (!order) return state;
  const moved: AgendaOrder = {
    ...order,
    technicianId: m.technicianId,
    status: "asignada",
    start: m.start,
    end: new Date(Date.parse(m.start) + order.durationMin * 60_000).toISOString(),
  };
  return {
    orders: [...state.orders.filter((o) => o.id !== m.orderId), moved],
    unassigned: state.unassigned.filter((o) => o.id !== m.orderId),
  };
}

export function AgendaBoard({
  view,
  days,
  today,
  technicians,
  orders,
  absences,
  unassigned,
}: {
  view: AgendaView;
  days: string[];
  today: string;
  technicians: AgendaTechnician[];
  orders: AgendaOrder[];
  absences: AgendaAbsence[];
  unassigned: Pending[];
}) {
  const router = useRouter();
  const [state, addMove] = useOptimistic({ orders, unassigned }, applyMove);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<DragData | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const justDragged = useRef(false);
  const dndId = useId(); // ids estables entre servidor y navegador (evita error de hidratación)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] } }),
  );

  // Hora de inicio donde quedaría la orden según dónde se suelta.
  function target(e: DragMoveEvent | DragEndEvent): Move | null {
    const data = e.active.data.current as DragData | undefined;
    const overId = e.over?.id;
    if (!data || typeof overId !== "string") return null;

    if (overId.startsWith("lane:")) {
      const technicianId = overId.slice(5);
      const lane = laneRect(technicianId);
      if (!lane || !e.over) return null;
      let minutes: number;
      if (pointer.current) {
        // Con mouse o dedo: el punto bajo el puntero, menos dónde se agarró el bloque.
        minutes = minutesAt(lane, pointer.current.x) - grab.current;
      } else if (data.kind === "block" && data.order.start) {
        // Con teclado: el bloque se corre lo mismo que se movió.
        minutes = minutesOfDay(data.order.start) + (e.delta.x * SPAN) / lane.width;
      } else {
        minutes = minutesAt(lane, e.active.rect.current.translated?.left ?? lane.left);
      }
      minutes = clamp(Math.round(minutes / SNAP) * SNAP, DAY_START, DAY_END - SNAP);
      return { orderId: data.order.id, technicianId, start: isoAt(days[0]!, minutes) };
    }
    if (overId.startsWith("cell:")) {
      const [, technicianId, day] = overId.split(":");
      // En la semana se cambia el día y el técnico; la hora se conserva (8:00 si no tenía).
      const minutes = data.order.start ? minutesOfDay(data.order.start) : 8 * 60;
      return { orderId: data.order.id, technicianId: technicianId!, start: isoAt(day!, minutes) };
    }
    return null;
  }

  // Posición real del puntero durante el arrastre. Las medidas de dnd-kit quedan viejas
  // si la línea de tiempo se desplaza mientras se arrastra.
  const pointer = useRef<{ x: number } | null>(null);
  const grab = useRef(0); // minutos entre el inicio del bloque y el punto donde se agarró
  const trackPointer = (ev: PointerEvent | TouchEvent) => {
    const x = "touches" in ev ? ev.touches[0]?.clientX : ev.clientX;
    if (x != null) pointer.current = { x };
  };
  const stopTracking = () => {
    window.removeEventListener("pointermove", trackPointer);
    window.removeEventListener("touchmove", trackPointer);
    pointer.current = null;
  };

  function onDragStart(e: DragStartEvent) {
    const data = (e.active.data.current as DragData) ?? null;
    setDragging(data);
    setError(null);
    const ev = e.activatorEvent;
    const x = ev && "clientX" in ev ? (ev as PointerEvent).clientX : ev && "touches" in ev ? (ev as TouchEvent).touches[0]?.clientX : null;
    pointer.current = x != null ? { x } : null;
    grab.current = 0;
    const lane = data?.order.technicianId ? laneRect(data.order.technicianId) : null;
    if (x != null && data?.kind === "block" && data.order.start && lane && view === "dia") {
      grab.current = minutesAt(lane, x) - minutesOfDay(data.order.start);
    }
    if (x != null) {
      window.addEventListener("pointermove", trackPointer);
      window.addEventListener("touchmove", trackPointer);
    }
  }

  function onDragMove(e: DragMoveEvent) {
    const t = target(e);
    const tech = t && technicians.find((x) => x.id === t.technicianId);
    setHint(t && tech ? `${tech.name.split(" ")[0]} · ${view === "dia" ? time(t.start) : `${dayLabel(dateKeyOf(t.start))}, ${time(t.start)}`}` : null);
  }

  function onDragEnd(e: DragEndEvent) {
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 0);
    setDragging(null);
    setHint(null);
    const move = target(e);
    stopTracking();
    const order = (e.active.data.current as DragData | undefined)?.order;
    if (!move || !order) return;
    if (order.technicianId === move.technicianId && order.start && Date.parse(order.start) === Date.parse(move.start)) return;

    startTransition(async () => {
      addMove(move);
      const result = await scheduleOrder(move);
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  const open = (id: string) => {
    if (!justDragged.current) router.push(`/app/ordenes/${id}`);
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        stopTracking();
        setDragging(null);
        setHint(null);
      }}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Para mover la orden, presiona espacio, usa las flechas para escoger técnico y hora, y presiona espacio otra vez para soltarla. Escape cancela.",
        },
      }}
    >
      {error && (
        <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-[10px] bg-[#F6E3E3] px-4 py-3 text-sm text-[#9B1C1C]">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Cerrar aviso" className="shrink-0 cursor-pointer">
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <UnassignedColumn orders={state.unassigned} today={today} onOpen={open} />

        {view === "dia" ? (
          <DayTimeline
            day={days[0]!}
            today={today}
            technicians={technicians}
            orders={state.orders}
            absences={absences}
            onOpen={open}
          />
        ) : (
          <WeekGrid days={days} today={today} technicians={technicians} orders={state.orders} absences={absences} onOpen={open} />
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging && (
          <div className="pointer-events-none w-max max-w-[240px] rounded-[10px] border border-primary bg-surface px-3 py-2 text-xs">
            <p className="font-display font-bold">
              {orderCode(dragging.order.number)} · {dragging.order.service}
            </p>
            <p className="text-muted">{hint ?? "Suelta sobre un técnico"}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ---------------------------------------------------------------------------
// Sin asignar
// ---------------------------------------------------------------------------
function whenLabel(o: AgendaOrder, today: string) {
  if (!o.start) return "Sin fecha";
  const d = dateKeyOf(o.start);
  const day = d === today ? "Hoy" : d === addDays(today, 1) ? "Mañana" : shortDate(o.start);
  return `${day} ${time(o.start)}`;
}

function UnassignedColumn({ orders, today, onOpen }: { orders: Pending[]; today: string; onOpen: (id: string) => void }) {
  return (
    <section aria-labelledby="sin-asignar" className="w-full shrink-0 rounded-[14px] border border-line bg-surface lg:w-[260px]">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3.5">
        <h2 id="sin-asignar" className="font-display text-lg font-bold">
          Sin asignar
        </h2>
        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-[#A33A0B]">{orders.length}</span>
      </header>
      <div className="flex flex-col gap-2.5 p-3">
        {orders.length === 0 ? (
          <p className="px-1 py-4 text-sm text-muted">Todo está asignado. Las órdenes nuevas sin técnico aparecen aquí.</p>
        ) : (
          orders.map((o) => <UnassignedCard key={o.id} order={o} today={today} onOpen={onOpen} />)
        )}
        <p className="px-1 pt-1 text-xs text-muted">La sugerencia considera cercanía, carga del día y especialidad del técnico.</p>
      </div>
    </section>
  );
}

function UnassignedCard({ order, today, onOpen }: { order: Pending; today: string; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `card:${order.id}`,
    data: { kind: "card", order } satisfies DragData,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(order.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(order.id);
        else listeners?.onKeyDown?.(e);
      }}
      aria-roledescription="orden arrastrable"
      className={`cursor-grab touch-manipulation rounded-[10px] border border-line bg-surface p-3 text-left outline-none hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-soft active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <p className="font-display text-xs text-muted">
        <span className="font-bold text-ink">{orderCode(order.number)}</span> · {whenLabel(order, today)}
      </p>
      <p className="mt-1 text-sm font-semibold">{order.service}</p>
      <p className="text-[13px] text-muted">
        {order.customer}
        {order.neighborhood && ` · ${order.neighborhood}`}
      </p>
      {order.suggested && (
        <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-primary">
          <Star size={14} aria-hidden /> Sugerido: {order.suggested}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista día
// ---------------------------------------------------------------------------
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function TechnicianCell({ tech }: { tech: AgendaTechnician }) {
  return (
    <div className="sticky left-0 z-10 flex min-w-0 items-center gap-2.5 border-r border-line-soft bg-surface px-4">
      <Avatar name={tech.name} size={34} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{tech.name}</p>
        <p className="truncate text-xs text-muted">{tech.skills.join(" · ") || "Sin especialidad"}</p>
      </div>
    </div>
  );
}

function DayTimeline({
  day,
  today,
  technicians,
  orders,
  absences,
  onOpen,
}: {
  day: string;
  today: string;
  technicians: AgendaTechnician[];
  orders: AgendaOrder[];
  absences: AgendaAbsence[];
  onOpen: (id: string) => void;
}) {
  const now = useNow();
  const nowMin = now ? minutesOfDay(now.toISOString()) : null;
  const showNow = day === today && nowMin != null && nowMin >= DAY_START && nowMin <= DAY_END;

  // Al abrir el día de hoy, desplaza la línea de tiempo para que se vea la hora actual.
  const scroller = useRef<HTMLDivElement>(null);
  const scrolled = useRef(false);
  useEffect(() => {
    const el = scroller.current;
    if (!el || !showNow || scrolled.current) return;
    scrolled.current = true;
    const lane = el.scrollWidth - 190;
    el.scrollLeft = 190 + (lane * (nowMin! - DAY_START)) / SPAN - el.clientWidth / 2;
  }, [showNow, nowMin]);

  return (
    <section aria-label="Línea de tiempo" className="min-w-0 flex-1 rounded-[14px] border border-line bg-surface">
      <div ref={scroller} className="relative overflow-x-auto">
        <div className="relative min-w-[920px]">
          <div className="grid grid-cols-[190px_1fr] border-b border-line">
            <p className="sticky left-0 z-10 border-r border-line-soft bg-surface px-4 py-3 text-xs font-semibold tracking-[0.04em] text-muted uppercase">Técnico</p>
            <div className="grid grid-cols-11">
              {HOURS.map((h) => (
                <span key={h} className="border-l border-line-soft py-3 pl-2 font-display text-xs text-muted">
                  {h}:00
                </span>
              ))}
            </div>
          </div>

          {technicians.length === 0 && (
            <p className="px-4 py-8 text-sm text-muted">
              Aún no tienes técnicos. Invítalos desde Ajustes › Equipo para empezar a asignar órdenes.
            </p>
          )}
          {technicians.map((t) => (
            <div key={t.id} className="grid h-[76px] grid-cols-[190px_1fr] border-b border-line-soft last:border-b-0">
              <TechnicianCell tech={t} />
              <Lane
                tech={t}
                day={day}
                orders={orders.filter((o) => o.technicianId === t.id && o.start)}
                absences={absences.filter((a) => a.technicianId === t.id)}
                onOpen={onOpen}
              />
            </div>
          ))}

          {showNow && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-accent"
              style={{ left: `calc(190px + (100% - 190px) * ${(nowMin! - DAY_START) / SPAN})` }}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-3 rounded-[3px]"
                style={{ background: l.bg, border: l.label === "Ausencia" ? `1px dashed ${ABSENCE.border}` : undefined }}
              />
              {l.label}
            </li>
          ))}
        </ul>
        {showNow && (
          <p className="flex items-center gap-1.5 font-display text-xs font-semibold text-accent">
            <span aria-hidden className="h-3 w-0.5 bg-accent" /> Ahora · {time(now!)}
          </p>
        )}
      </div>
    </section>
  );
}

function Lane({
  tech,
  day,
  orders,
  absences,
  onOpen,
}: {
  tech: AgendaTechnician;
  day: string;
  orders: AgendaOrder[];
  absences: AgendaAbsence[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `lane:${tech.id}` });
  return (
    <div
      ref={setNodeRef}
      data-lane={tech.id}
      className={`relative ${isOver ? "bg-primary-soft/60" : ""}`}
      aria-label={`Agenda de ${tech.name}`}
    >
      <div aria-hidden className="absolute inset-0 grid grid-cols-11">
        {HOURS.map((h) => (
          <span key={h} className="border-l border-line-soft" />
        ))}
      </div>
      {absences.map((a) => {
        const s = span(day, a.start, a.end);
        if (!s) return null;
        return (
          <div
            key={a.id}
            className="absolute top-2 bottom-2 overflow-hidden rounded-[8px] border border-dashed px-2.5 py-1.5 text-xs text-muted"
            style={{ left: pct(s[0]), width: `${((s[1] - s[0]) / SPAN) * 100}%`, background: ABSENCE.bg, borderColor: ABSENCE.border }}
          >
            <p className="truncate font-semibold">Ausencia</p>
            <p className="truncate">{a.reason}</p>
          </div>
        );
      })}
      {orders.map((o) => {
        const s = span(day, o.start!, endOf(o));
        return s && <Block key={o.id} order={o} left={s[0]} width={s[1] - s[0]} onOpen={onOpen} />;
      })}
    </div>
  );
}

function Block({ order, left, width, onOpen }: { order: AgendaOrder; left: number; width: number; onOpen: (id: string) => void }) {
  const canMove = movable(order);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block:${order.id}`,
    data: { kind: "block", order } satisfies DragData,
    disabled: !canMove,
  });
  const c = BLOCK[order.status] ?? BLOCK.asignada!;
  const label = `${orderCode(order.number)}, ${order.service}, ${order.customer}, ${time(order.start)} a ${time(endOf(order))}, ${c.label}`;
  return (
    <div
      ref={setNodeRef}
      {...(canMove ? { ...attributes, ...listeners } : { tabIndex: 0 })}
      role="button"
      title={`${orderCode(order.number)} · ${order.service} · ${order.customer} · ${time(order.start)}–${time(endOf(order))}`}
      onClick={() => onOpen(order.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(order.id);
        else listeners?.onKeyDown?.(e);
      }}
      className={`absolute top-2 bottom-2 overflow-hidden rounded-[8px] border border-white py-1.5 text-xs outline-none ${
        width < 75 ? "px-1.5" : "px-2.5"
      } focus-visible:ring-2 focus-visible:ring-primary ${
        canMove ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${isDragging ? "opacity-40" : ""}`}
      style={{ left: pct(left), width: `${(width / SPAN) * 100}%`, background: c.bg, color: c.fg }}
    >
      <p className={`truncate font-display font-bold ${width < 75 ? "text-[11px]" : ""}`}>{orderCode(order.number)}</p>
      <p className="truncate">{order.service}</p>
      <span className="sr-only">{label.slice(label.indexOf(order.service) + order.service.length)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista semana
// ---------------------------------------------------------------------------
function WeekGrid({
  days,
  today,
  technicians,
  orders,
  absences,
  onOpen,
}: {
  days: string[];
  today: string;
  technicians: AgendaTechnician[];
  orders: AgendaOrder[];
  absences: AgendaAbsence[];
  onOpen: (id: string) => void;
}) {
  return (
    <section aria-label="Semana" className="min-w-0 flex-1 rounded-[14px] border border-line bg-surface">
      <div className="relative overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[190px_repeat(7,1fr)] border-b border-line">
            <p className="sticky left-0 z-10 border-r border-line-soft bg-surface px-4 py-3 text-xs font-semibold tracking-[0.04em] text-muted uppercase">Técnico</p>
            {days.map((d) => (
              <p
                key={d}
                className={`border-l border-line-soft py-3 pl-2 font-display text-xs ${d === today ? "font-bold text-accent" : "text-muted"}`}
              >
                {dayLabel(d)}
              </p>
            ))}
          </div>
          {technicians.length === 0 && (
            <p className="px-4 py-8 text-sm text-muted">
              Aún no tienes técnicos. Invítalos desde Ajustes › Equipo para empezar a asignar órdenes.
            </p>
          )}
          {technicians.map((t) => (
            <div key={t.id} className="grid min-h-[76px] grid-cols-[190px_repeat(7,1fr)] border-b border-line-soft last:border-b-0">
              <TechnicianCell tech={t} />
              {days.map((d) => (
                <WeekCell
                  key={d}
                  tech={t}
                  day={d}
                  orders={orders
                    .filter((o) => o.technicianId === t.id && o.start && dateKeyOf(o.start) === d)
                    .sort((a, b) => Date.parse(a.start!) - Date.parse(b.start!))}
                  absence={absences.find((a) => a.technicianId === t.id && span(d, a.start, a.end))}
                  onOpen={onOpen}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line px-4 py-3 text-xs text-muted">
        {LEGEND.map((l) => (
          <li key={l.label} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-3 rounded-[3px]"
              style={{ background: l.bg, border: l.label === "Ausencia" ? `1px dashed ${ABSENCE.border}` : undefined }}
            />
            {l.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function WeekCell({
  tech,
  day,
  orders,
  absence,
  onOpen,
}: {
  tech: AgendaTechnician;
  day: string;
  orders: AgendaOrder[];
  absence?: AgendaAbsence;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell:${tech.id}:${day}` });
  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={`${tech.name}, ${dayLabel(day)}`}
      className={`flex flex-col gap-1 border-l border-line-soft p-1.5 ${isOver ? "bg-primary-soft/60" : ""}`}
    >
      {absence && (
        <p
          className="truncate rounded-[6px] border border-dashed px-2 py-1 text-[11px] text-muted"
          style={{ background: ABSENCE.bg, borderColor: ABSENCE.border }}
        >
          {absence.reason}
          {dateKeyOf(absence.start) === day && dateKeyOf(absence.end) === day && ` · ${time(absence.start)}–${time(absence.end)}`}
        </p>
      )}
      {orders.map((o) => (
        <CompactBlock key={o.id} order={o} onOpen={onOpen} />
      ))}
    </div>
  );
}

function CompactBlock({ order, onOpen }: { order: AgendaOrder; onOpen: (id: string) => void }) {
  const canMove = movable(order);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block:${order.id}`,
    data: { kind: "block", order } satisfies DragData,
    disabled: !canMove,
  });
  const c = BLOCK[order.status] ?? BLOCK.asignada!;
  return (
    <div
      ref={setNodeRef}
      {...(canMove ? { ...attributes, ...listeners } : { tabIndex: 0 })}
      role="button"
      title={`${orderCode(order.number)} · ${order.service} · ${order.customer}`}
      onClick={() => onOpen(order.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(order.id);
        else listeners?.onKeyDown?.(e);
      }}
      className={`truncate rounded-[6px] px-2 py-1 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        canMove ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${isDragging ? "opacity-40" : ""}`}
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="font-display font-bold">{orderCode(order.number)}</span> · {time(order.start)}
      <span className="sr-only">
        , {order.service}, {c.label}
      </span>
    </div>
  );
}
