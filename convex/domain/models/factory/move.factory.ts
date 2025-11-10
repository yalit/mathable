import { Move, type MoveType } from "../Move.ts";
import { UUID } from "@cvx/domain/models/factory/uuid.factory.ts";
import type { Doc, Id } from "@cvx/_generated/dataModel";

/**
 * Create a new Move instance
 * Factory function for creating a move with specified parameters
 * @param id - Move ID (null to generate)
 * @param gameId - Game ID
 * @param type - Type of move
 * @param turn - Turn number
 * @param moveScore - Score for this move
 * @param cellId - Cell ID (if applicable)
 * @param tileId - Tile ID (if applicable)
 * @param playerId - Player ID (if applicable)
 * @returns Move
 */
export const createMove = (
    id: Id<"moves"> | null,
    gameId: Id<"games">,
    type: MoveType,
    turn: number,
    moveScore: number,
    cellId: Id<"cells"> | null | undefined,
    tileId: Id<"tiles"> | null,
    playerId: Id<"players"> | null | undefined
): Move => {
    return new Move(
        id ?? UUID() as Id<"moves">,
        gameId,
        type,
        turn,
        moveScore,
        cellId,
        tileId,
        playerId
    );
};

/**
 * Create a Move domain model from a database document
 * Factory function that creates a Move from a database doc
 * @param doc - Database document for a move
 * @returns Move
 */
export const moveFromDoc = (doc: Doc<"moves">): Move => {
    return new Move(
        doc._id,
        doc.gameId,
        doc.type as MoveType,
        doc.turn,
        doc.moveScore,
        doc.cellId,
        doc.tileId,
        doc.playerId
    );
};
