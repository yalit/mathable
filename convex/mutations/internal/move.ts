import {v} from "convex/values";
import type {MovesMutationRepositoryInterface} from "../../repository/mutations/moves.repository.ts";
import {
    createPlayerToCellMove,
    createBagToPlayerMove,
    createCellToPlayerMove,
    createPlayerToBagMove,
} from "../../domain/models/factory/move.factory.ts";
import {appMutation} from "../../middleware/app.middleware.ts";

export const MoveType = {
    PLAYER_TO_CELL: "player_to_cell",
    CELL_TO_PLAYER: "cell_to_player",
    BAG_TO_PLAYER: "bag_to_player",
};
export const TileMoveSource = {
    BAG: "bag",
    CELL: "cell",
    PLAYER: "player",
};

export const createMove = appMutation({
    visibility: "internal", security: "internal",
    args: {
        gameId: v.id("games"),
        type: v.string(),
        turn: v.number(),
        tileId: v.union(v.null(), v.id("tiles")),
        playerId: v.optional(v.union(v.null(), v.id("players"))),
        cellId: v.optional(v.union(v.null(), v.id("cells"))),
        moveScore: v.number(),
    },
    handler: async (ctx, args) => {
        const movesMutationRepository: MovesMutationRepositoryInterface = ctx.container.get("MovesMutationRepositoryInterface");
        const {gameId, type, turn, tileId, playerId, cellId, moveScore} = args;

        let move;
        switch (type) {
            case "PLAYER_TO_CELL":
                if (!playerId || !cellId || !tileId) {
                    throw new Error("PLAYER_TO_CELL requires playerId, cellId, and tileId");
                }
                move = createPlayerToCellMove(gameId, turn, tileId, playerId, cellId, moveScore);
                break;

            case "BAG_TO_PLAYER":
                if (!playerId || !tileId) {
                    throw new Error("BAG_TO_PLAYER requires playerId and tileId");
                }
                move = createBagToPlayerMove(gameId, turn, tileId, playerId);
                break;

            case "CELL_TO_PLAYER":
                if (!playerId || !cellId || !tileId) {
                    throw new Error("CELL_TO_PLAYER requires playerId, cellId, and tileId");
                }
                move = createCellToPlayerMove(gameId, turn, tileId, playerId, cellId, moveScore);
                break;

            case "PLAYER_TO_BAG":
                if (!playerId || !tileId) {
                    throw new Error("PLAYER_TO_BAG requires playerId and tileId");
                }
                move = createPlayerToBagMove(gameId, turn, tileId, playerId);
                break;

            default:
                throw new Error(`Unknown move type: ${type}`);
        }

        await movesMutationRepository.save(move);
    },
});
