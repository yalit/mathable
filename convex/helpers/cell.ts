import type {Doc} from "../_generated/dataModel";
import {TilesQueryRepository} from "../repository/query/tiles.repository.ts";

export const hasValue = (cell: Doc<"cells">): boolean => {
    return cell && (cell.value !== null || cell.tileId !== null);
};

export const getNumericValue = async (c: Doc<"cells">): Promise<number> => {
    if (c.value) {
        return c.value;
    }
    if (c.tileId) {
        const tile = await TilesQueryRepository.instance.find(c.tileId)
        if (!tile) {
            throw new Error("Tile is not existing");
        }
        return tile.value;
    }
    throw new Error("No value for the cell");
};
