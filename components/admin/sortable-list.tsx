"use client";

import { DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ReactNode, useId } from "react";
import { cx } from "@/lib/cx";

// A vertical list reordered by dragging a grip or with ↑/↓ buttons (the
// keyboard and screen-reader path). Each row renders its own controls where it
// wants them. `canMove` vetoes a move (the then block stays first). A lifted row
// is opaque, so it covers the rows it passes over.
export function SortableList({
  keys,
  onMove,
  canMove,
  className,
  children,
}: {
  keys: string[];
  onMove: (from: number, to: number) => void;
  canMove?: (from: number, to: number) => boolean;
  className?: string;
  children: (index: number, controls: ReactNode) => ReactNode;
}) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const allowed = (from: number, to: number) => from !== to && to >= 0 && to < keys.length && (canMove?.(from, to) ?? true);

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    const from = keys.indexOf(String(active.id));
    const to = keys.indexOf(String(over.id));
    if (allowed(from, to)) onMove(from, to);
  }

  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={keys} strategy={verticalListSortingStrategy}>
        <ul className={cx("flex flex-col gap-2", className)}>
          {keys.map((key, index) => (
            <SortableRow
              key={key}
              id={key}
              canUp={allowed(index, index - 1)}
              canDown={allowed(index, index + 1)}
              onUp={() => onMove(index, index - 1)}
              onDown={() => onMove(index, index + 1)}
            >
              {(controls) => children(index, controls)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  canUp,
  canDown,
  onUp,
  onDown,
  children,
}: {
  id: string;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  children: (controls: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const controls = (
    <span className="flex shrink-0 items-center type-meta text-fg-muted">
      <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="Drag to reorder" className="cursor-grab px-1 hover:text-fg">
        ⋮⋮
      </button>
      <button type="button" aria-label="Move up" disabled={!canUp} onClick={onUp} className="px-1 hover:text-fg disabled:opacity-30">
        ↑
      </button>
      <button type="button" aria-label="Move down" disabled={!canDown} onClick={onDown} className="px-1 hover:text-fg disabled:opacity-30">
        ↓
      </button>
    </span>
  );
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cx("min-w-0", isDragging && "relative z-10 cursor-grabbing bg-bg")}>
      {children(controls)}
    </li>
  );
}
