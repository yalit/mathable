import {internal} from "../../_generated/api";
import type {Doc} from "../../_generated/dataModel";
import {getNumericValue} from "../../helpers/cell";
import {v} from "convex/values";
import {withRepositoryInternalMutation} from "../../middleware/repository.middleware.ts";
import {CellsQueryRepository} from "../../repository/query/cells.repository.ts";

export const computeAllAllowedValues = withRepositoryInternalMutation({
    args: {gameId: v.id("games")},
    handler: async (ctx, args) => {
        const cells = await ctx.db
            .query("cells")
            .withIndex("by_game_row_column", (q) => q.eq("gameId", args.gameId))
            .collect();

        cells.forEach(
            async (cell) =>
                await ctx.runMutation(
                    internal.mutations.internal.cell.computeAllowedValuesForCell,
                    {cellId: cell._id},
                ),
        );
    },
});

export const computeAllowedValuesFromUpdatedCell = withRepositoryInternalMutation({
    args: {cellId: v.id("cells")},
    handler: async (ctx, args) => {
        const cell: null | Doc<"cells"> = await ctx.db.get(args.cellId);
        if (!cell) {
            return;
        }

        const impactingDirections = await CellsQueryRepository.instance.findAllForCellInEachDirection(cell)

        impactingDirections.forEach(async (arr) =>
            arr.forEach(async (c) => {
                await ctx.runMutation(
                    internal.mutations.internal.cell.computeAllowedValuesForCell,
                    {cellId: c._id},
                );
            }),
        );
    },
});

export const computeAllowedValuesForCell = withRepositoryInternalMutation({
    args: {cellId: v.id("cells")},
    handler: async (ctx, args) => {
        const cell: null | Doc<"cells"> = await ctx.db.get(args.cellId);
        if (!cell) {
            return;
        }

        if (cell.type === "value") {
            return;
        }

        const allowedValues: Set<number> = new Set();

        const impactingDirections = await CellsQueryRepository.instance.findAllImpactingCellsForCellInEachDirection(cell)

        await Promise.all(
            impactingDirections.map(async (impactingCells) => {
                if (impactingCells.length !== 2) {
                    // this direction not to be considered as not enough cells impacting
                    return;
                }

                const first: number = await getNumericValue(impactingCells[0]);
                const second: number = await getNumericValue(impactingCells[1]);

                const add = [first + second];
                const sub = [first - second, second - first];
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
                    add
                        .concat(sub, mult, div)
                        .filter((n) => Number.isInteger(n) && n >= 0)
                        .forEach((n) => {
                            allowedValues.add(n);
                        });
                }
            }),
        );

        // update the cells with the allowedValues
        await ctx.db.patch(cell._id, {
            allowedValues: Array.from(allowedValues),
        });
    },
});
