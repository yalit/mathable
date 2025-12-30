import {Tile, type TileLocation} from "../Tile.ts";
import type {Doc} from "../../../_generated/dataModel";
import type {Game} from "../Game.ts";
import type {DocData} from "@cvx/repository/repositories.interface.ts";

export const createTileData = (
    game: Game,
    value: number,
    location: TileLocation = "in_bag",
): DocData<"tiles"> => {
    return {
        gameId: game.id,
        value,
        location,
        playerId: null,
        cellId: null
    }
};

/**
 * Create a Tile domain model from a database document
 * Factory function that creates a Tile from a database doc
 * @param doc - Database document for a tile
 * @returns Tile
 */
export const tileFromDoc = (doc: Doc<"tiles">): Tile => {
    return new Tile(
        doc._id,
        doc.gameId,
        doc.value,
        doc.location as TileLocation,
        doc.playerId,
        doc.cellId
    );
};
