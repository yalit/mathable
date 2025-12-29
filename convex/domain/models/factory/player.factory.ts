import {Player} from "../Player.ts";
import type {Doc} from "../../../_generated/dataModel";

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