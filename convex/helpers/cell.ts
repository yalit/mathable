import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export const hasValue = (cell: Doc<"cells">): boolean => {
  return cell && (cell.value !== null || cell.tileId !== null);
};

export const getNumericValue = async (
  c: Doc<"cells">,
  ctx: QueryCtx,
): Promise<number> => {
  if (c.value) {
    return c.value;
  }
  if (c.tileId) {
    const tile = await ctx.db.get(c.tileId);
    if (!tile) {
      throw new Error("Tile is not existing");
    }
    return tile.value;
  }
  throw new Error("No value for the cell");
};
