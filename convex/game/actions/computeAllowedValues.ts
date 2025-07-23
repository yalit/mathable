import { internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import type { Doc } from "../../_generated/dataModel";

const impactingDirections = ["left", "right", "up", "down"];
export const computeAllAllowedValues = internalMutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const cells = await ctx.db
      .query("cells")
      .withIndex("by_game_row_number", (q) => q.eq("gameId", args.gameId))
      .collect();

    cells.forEach(
      async (cell) =>
        await ctx.runMutation(
          internal.game.actions.computeAllowedValues
            .computeAllowedValuesForCell,
          { cellId: cell._id },
        ),
    );
  },
});

export const computeAllowedValuesFromUpdatedCell = internalMutation({
  args: { cellId: v.id("cells") },
  handler: (ctx, args) => {
    impactingDirections.forEach(async (direction) => {
      const impacts: Doc<"cellImpacts">[] = await ctx.db
        .query("cellImpacts")
        .withIndex("by_direction_impacting_cell", (q) =>
          q.eq("direction", direction).eq("impactingCellId", args.cellId),
        )
        .collect();

      const impactedCells: Doc<"cells">[] = [];

      impacts.forEach(async (ci) => {
        const cell = await ctx.db.get(ci.impactedCellId);
        if (cell) {
          impactedCells.push(cell);
        }
      });

      impactedCells.forEach(
        async (c) =>
          await ctx.runMutation(
            internal.game.actions.computeAllowedValues
              .computeAllowedValuesForCell,
            { cellId: c._id },
          ),
      );
    });
  },
});

export const computeAllowedValuesForCell = internalMutation({
  args: { cellId: v.id("cells") },
  handler: async (ctx, args) => {
    const cell: null | Doc<"cells"> = await ctx.db.get(args.cellId);
    if (!cell) {
      console.log(args.cellId, "No cell");
      return;
    }

    if (!hasValue(cell)) {
      await ctx.db.patch(cell._id, { allowedValues: [] });
      console.log(args.cellId, "Cell not a value or not has a tile");
      return;
    }

    const allowedValues: Set<number> = new Set();

    await Promise.all(
      impactingDirections.map(async (direction) => {
        const impacts: Doc<"cellImpacts">[] = await ctx.db
          .query("cellImpacts")
          .withIndex("by_direction_impacted_cell", (q) =>
            q.eq("direction", direction).eq("impactedCellId", args.cellId),
          )
          .collect();

        // get impacting cells
        const impactingCells: Doc<"cells">[] = [];
        impacts.forEach(async (ci: Doc<"cellImpacts">) => {
          const cell = await ctx.db.get(ci.impactingCellId);
          if (cell && (cell.value || cell.tileId)) {
            // only impacting if there is a value in it
            impactingCells.push(cell);
          }
        });

        if (impactingCells.length !== 2) {
          console.log(
            cell.row,
            cell.column,
            direction,
            "not enough impacting cells",
          );
          return;
        }

        const value = async (c: Doc<"cells">): Promise<number> => {
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
        const first: number = await value(impactingCells[0]);
        const second: number = await value(impactingCells[1]);

        console.log("Values", cell.row, cell.column, direction, first, second);
        const add = [first + second];
        const sub = [first - second];
        const mult = [first * second];
        const div = [];
        if (second !== 0 && Number.isInteger(first / second)) {
          div.push(first / second);
        }
        if (first !== 0 && Number.isInteger(second / first)) {
          div.push(second / first);
        }

        if (cell.type === "operator") {
          switch (cell.operator) {
            case "+":
              allowedValues.add(add[0]);
              break;
            case "-":
              allowedValues.add(sub[0]);
              break;
            case "*":
              allowedValues.add(mult[0]);
              break;
            case "/":
              div.forEach((n) => allowedValues.add(n));
              break;
          }
        } else {
          add.concat(sub, mult, div).forEach(allowedValues.add);
        }
      }),
    );

    // update the cells with the allowedValues
    await ctx.db.patch(cell._id, {
      allowedValues: Array.from(allowedValues),
    });
    console.log(cell.row, cell.column, allowedValues);
  },
});
