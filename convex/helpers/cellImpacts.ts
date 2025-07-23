import { GAME_SIZE } from "../../src/context/model/game";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { hasValue } from "./cell";

export const impactingDirections = ["left", "right", "up", "down"];

export type ImpactingCells = Doc<"cells">[][];

export const getImpactingCellsByDirection = async (
  cell: Doc<"cells">,
  ctx: QueryCtx,
): Promise<ImpactingCells> => {
  const left: Doc<"cells">[] = await ctx.db
    .query("cells")
    .withIndex("by_game_row_column", (q) =>
      q
        .eq("gameId", cell.gameId)
        .eq("row", cell.row)
        .gte("column", Math.max(0, cell.column - 2))
        .lt("column", cell.column),
    )
    .collect();

  const right: Doc<"cells">[] = await ctx.db
    .query("cells")
    .withIndex("by_game_row_column", (q) =>
      q
        .eq("gameId", cell.gameId)
        .eq("row", cell.row)
        .gt("column", cell.column)
        .lt("column", Math.min(GAME_SIZE, cell.column + 3)),
    )
    .collect();

  const up: Doc<"cells">[] = await ctx.db
    .query("cells")
    .withIndex("by_game_column_row", (q) =>
      q
        .eq("gameId", cell.gameId)
        .eq("column", cell.column)
        .gte("row", Math.max(0, cell.row - 2))
        .lt("row", cell.row),
    )
    .collect();

  const down: Doc<"cells">[] = await ctx.db
    .query("cells")
    .withIndex("by_game_column_row", (q) =>
      q
        .eq("gameId", cell.gameId)
        .eq("column", cell.column)
        .gt("row", cell.row)
        .lt("row", Math.min(GAME_SIZE, cell.row + 3)),
    )
    .collect();

  return [
    left.filter((c) => hasValue(c)),
    right.filter((c) => hasValue(c)),
    up.filter((c) => hasValue(c)),
    down.filter((c) => hasValue(c)),
  ];
};
