import {internal} from "../../_generated/api";
import type {Doc} from "../../_generated/dataModel";
import {getNumericValue} from "../../helpers/cell";
import {v} from "convex/values";
import {CellsQueryRepository} from "../../repository/query/cells.repository.ts";
import {CellsMutationRepository} from "../../repository/mutations/cells.repository.ts";
import {cellFromDoc} from "../../domain/models/factory/cell.factory.ts";
import {appMutation} from "../../middleware/app.middleware.ts";

export const computeAllAllowedValues = appMutation({
    visibility: "internal", security: "internal",
    args: {gameId: v.id("games")},
    handler: async (ctx, args) => {
        const cells = await CellsQueryRepository.instance.findAllForGame(
            args.gameId,
        );
        for (const cell of cells) {
            await ctx.runMutation(
                internal.mutations.internal.cell.computeAllowedValuesForCell,
                {cellId: cell._id},
            );
        }
    },
});

export const computeAllowedValuesFromUpdatedCell =
    appMutation({
        visibility: "internal", security: "internal",
        args: {cellId: v.id("cells")},
        handler: async (ctx, args) => {
            const cell: null | Doc<"cells"> =
                await CellsQueryRepository.instance.find(args.cellId);
            if (!cell) {
                return;
            }

            const impactingDirections =
                await CellsQueryRepository.instance.findCellInCrossFromCell(cell);

            for (const arr of impactingDirections) {
                for (const c of arr) {
                    await ctx.runMutation(
                        internal.mutations.internal.cell.computeAllowedValuesForCell,
                        {cellId: c._id},
                    );
                }
            }
        },
    });

export const computeAllowedValuesForCell = appMutation({
    visibility: "internal", security: "internal",
    args: {cellId: v.id("cells")},
    handler: async (_, args) => {
        const cell: null | Doc<"cells"> = await CellsQueryRepository.instance.find(
            args.cellId,
        );
        if (!cell) {
            return;
        }

        if (cell.type === "value") {
            return;
        }

        const allowedValues: Array<number> = [];

        const impactingDirections =
            await CellsQueryRepository.instance.findAllImpactingCellsForCellInEachDirection(
                cell,
            );

        await Promise.all(
            impactingDirections.map(async (impactingCells) => {
                if (impactingCells.length !== 2) {
                    // this direction not to be considered as not enough cells impacting
                    return;
                }

                const tempAllowedValues: Set<number> = new Set();
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
                            tempAllowedValues.add(add[0]);
                            break;
                        case "-":
                            tempAllowedValues.add(sub[0]);
                            break;
                        case "*":
                            tempAllowedValues.add(mult[0]);
                            break;
                        case "/":
                            div.forEach((n) => tempAllowedValues.add(n));
                            break;
                    }
                } else {
                    add
                        .concat(sub, mult, div)
                        .filter((n) => Number.isInteger(n) && n >= 0)
                        .forEach((n) => {
                            tempAllowedValues.add(n);
                        });
                }

                allowedValues.push(...tempAllowedValues)
            }),
        );

        // update the cells with the allowedValues
        const cellModel = cellFromDoc(cell);
        cellModel.setAllowedValues(Array.from(allowedValues));
        await CellsMutationRepository.instance.save(cellModel);
    },
});
