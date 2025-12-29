import {
    type Move,
    type MoveType,
    PlayerToCellMove,
    BagToPlayerMove,
    CellToPlayerMove,
    PlayerToBagMove
} from "../Move.ts";
import type { Doc, Id } from "../../../_generated/dataModel";

/**
 * Create appropriate Move subclass from a database document
 * Factory function that returns the correct move type based on doc.type
 * @param doc - Database document for a move
 * @returns PlayerToCellMove | BagToPlayerMove | CellToPlayerMove | PlayerToBagMove
 * @throws Error if move type is unknown
 */
export const moveFromDoc = (doc: Doc<"moves">): Move => {
    const type = doc.type as MoveType;

    switch (type) {
        case "PLAYER_TO_CELL":
            if (!doc.playerId || !doc.cellId) {
                throw new Error(
                    `PlayerToCellMove at turn ${doc.turn} missing required fields`
                );
            }
            return new PlayerToCellMove(
                doc._id,
                doc.gameId,
                doc.turn,
                doc.tileId as Id<"tiles">,
                doc.playerId,
                doc.cellId,
                doc.moveScore
            );

        case "BAG_TO_PLAYER":
            if (!doc.playerId) {
                throw new Error(
                    `BagToPlayerMove at turn ${doc.turn} missing playerId`
                );
            }
            return new BagToPlayerMove(
                doc._id,
                doc.gameId,
                doc.turn,
                doc.tileId as Id<"tiles">,
                doc.playerId
            );

        case "CELL_TO_PLAYER":
            if (!doc.playerId || !doc.cellId) {
                throw new Error(
                    `CellToPlayerMove at turn ${doc.turn} missing required fields`
                );
            }
            return new CellToPlayerMove(
                doc._id,
                doc.gameId,
                doc.turn,
                doc.tileId as Id<"tiles">,
                doc.playerId,
                doc.cellId,
                doc.moveScore
            );

        case "PLAYER_TO_BAG":
            if (!doc.playerId) {
                throw new Error(
                    `PlayerToBagMove at turn ${doc.turn} missing playerId`
                );
            }
            return new PlayerToBagMove(
                doc._id,
                doc.gameId,
                doc.turn,
                doc.tileId as Id<"tiles">,
                doc.playerId
            );

        default:
            throw new Error(`Unknown move type: ${type}`);
    }
};
