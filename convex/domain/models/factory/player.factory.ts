import {Player} from "../Player.ts";
import type {Doc, Id} from "../../../_generated/dataModel";
import {UUID} from "./uuid.factory.ts";

export const createPlayer = (
    id: Id<"players">, gameId: Id<"games">, userId: Id<"users">,
    name: string,
    token: string,
    current: boolean = false,
    score: number = 0,
    owner: boolean = false,
    order: number
): Player => {
    return new Player(
        id ?? UUID(),
        gameId,
        userId,
        name,
        token,
        current,
        score,
        owner,
        order
    )
};

/**
 * Create a Player domain model from a database document
 * Factory function that creates a Player from a database doc
 * @param doc - Database document for a player
 * @returns Player
 */
export const playerFromDoc = (doc: Doc<"players">): Player => {
    return new Player(
        doc._id,
        doc.gameId,
        doc.userId,
        doc.name,
        doc.token,
        doc.current,
        doc.score,
        doc.owner,
        doc.order
    );
};

/**
 * Create a new Player instance for initial creation
 * Factory function for creating a new player with default values
 * @param id - Player ID
 * @param gameId - Game ID
 * @param userId - User ID
 * @param name - Player name
 * @param token - Player token
 * @param isOwner - Whether player is the game owner
 * @returns Player
 */
export const createNewPlayer = (
    id: Id<"players">,
    gameId: Id<"games">,
    userId: Id<"users">,
    name: string,
    token: string,
    isOwner: boolean
): Player => {
    return new Player(
        id,
        gameId,
        userId,
        name,
        token,
        false, // current
        0, // score
        isOwner,
        0 // order (not set yet)
    );
};
