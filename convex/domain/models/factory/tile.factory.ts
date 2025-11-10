import {Tile, type TileLocation} from "../Tile.ts";
import {UUID} from "./uuid.factory.ts";
import type {Doc, Id} from "../../../_generated/dataModel";

export const createTile = (
    id: Id<"tiles"> | null, gameId: Id<"games">,
    value: number,
    location: TileLocation = "in_bag",
): Tile => {
    return new Tile(id ?? UUID() as Id<"tiles">, gameId, value, location, null, null)
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
