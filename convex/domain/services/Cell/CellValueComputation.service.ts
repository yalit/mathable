import type {AppMutationCtx} from "../../../middleware/app.middleware.ts";
import type {Cell} from "../../models/Cell.ts";
import type {CellsQueryRepositoryInterface} from "../../../repository/query/cells.repository.ts";
import type {CellsMutationRepositoryInterface} from "../../../repository/mutations/cells.repository.ts";

export class CellValueComputationService {
    private ctx: AppMutationCtx;
    private readonly cellsQuery: CellsQueryRepositoryInterface
    private readonly cellsMutation: CellsMutationRepositoryInterface

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
        this.cellsQuery = this.ctx.container.get("CellsQueryRepositoryInterface");
        this.cellsMutation = this.ctx.container.get("CellsMutationRepositoryInterface");
    }

    async computeAllowedValuesForUpdatedCell(cell: Cell): Promise<void> {
        const impactingDirections =
            await this.cellsQuery.findCellInCrossFromCell(cell);

        for (const arr of impactingDirections) {
            for (const c of arr) {
                await this.computeAllowedValuesForCell(c)
            }
        }
    }

    async computeAllowedValuesForCell(cell: Cell): Promise<void> {

        if (cell.isValueCell()) {
            return;
        }

        const allowedValues: Array<number> = [];

        const impactingDirections =
            await this.cellsQuery.findAllImpactingCellsForCellInEachDirection(
                cell,
            );

        await Promise.all(
            impactingDirections.map(async (impactingCells: Cell[]) => {
                if (impactingCells.length !== 2) {
                    // this direction not to be considered as not enough cells impacting
                    return;
                }

                const tempAllowedValues: Set<number> = new Set();
                const first: number = await this.cellsQuery.findNumericValue(impactingCells[0]);
                const second: number = await this.cellsQuery.findNumericValue(impactingCells[1]);

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

                if (cell.isOperatorCell()) {
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
        cell.setAllowedValues(Array.from(allowedValues));
        await this.cellsMutation.save(cell);
    }
}