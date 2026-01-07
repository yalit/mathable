import { useDragLayer } from "react-dnd";
import type { Tile } from "@context/model/tile";
import { NumberIcon } from "@components/includes/icon";
import { classnames } from "@libraries/helpers/dom";
import { useMemo, useRef, useEffect } from "react";

export function TileDragLayer() {
  const prevPositionRef = useRef<{ x: number; y: number } | null>(null);
  const rotationRef = useRef<number>(0);

  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem() as Tile | null,
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  // Calculate simple 30° rotation opposite to horizontal movement only
  useEffect(() => {
    if (!currentOffset || !isDragging) {
      prevPositionRef.current = null;
      rotationRef.current = 0;
      return;
    }

    if (prevPositionRef.current) {
      const deltaX = currentOffset.x - prevPositionRef.current.x;

      // Only apply rotation for horizontal movement (ignore vertical)
      if (Math.abs(deltaX) > 1) {
        // Moving right → tilt left (-30°), moving left → tilt right (+30°)
        rotationRef.current = deltaX > 0 ? -30 : 30;
      }
    }

    prevPositionRef.current = { x: currentOffset.x, y: currentOffset.y };
  }, [currentOffset, isDragging]);

  // Render tile content (same logic as PlayTile)
  const tileContent = useMemo(() => {
    if (!item) return null;

    const split = String(item.value)
      .split("")
      .map((x) => +x);
    return split.map((n, idx) => (
      <NumberIcon key={item.id + "_" + idx} icon={n} className="tile" />
    ));
  }, [item]);

  if (!isDragging || !currentOffset || !item) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 100,
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: currentOffset.x,
          top: currentOffset.y,
          transform: `translate(-50%, -50%) rotate(${rotationRef.current}deg)`,
          width: "3rem",
          height: "3rem",
        }}
        className={classnames(
          "bg-linear-to-br from-sky-700 to-sky-900 text-white rounded shadow-xl flex justify-center items-center gap-1 aspect-square border-2 border-sky-400",
          "p-2 text-sm"
        )}
      >
        {tileContent}
      </div>
    </div>
  );
}
