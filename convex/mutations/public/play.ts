import { v } from "convex/values";
import { MoveType } from "../internal/move";
import { internal } from "../../_generated/api";
import type { PlayersQueryRepositoryInterface } from "../../repository/query/players.repository.ts";
import type { MovesQueryRepositoryInterface } from "../../repository/query/moves.repository.ts";
import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository.ts";
import type { MovesMutationRepositoryInterface } from "../../repository/mutations/moves.repository.ts";
import { EndTurnUseCase } from "../../usecases/play/EndTurn.usecase";
import { appMutation, SessionArgs } from "../../middleware/app.middleware.ts";

export const resetTurn = appMutation({
    visibility: "public", security: "secure",
    args: { gameId: v.id("games"), ...SessionArgs },
    handler: async (ctx, { gameId }) => {
        const gamesQueryRepository: GameQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface");
        const playersQueryRepository: PlayersQueryRepositoryInterface = ctx.container.get("PlayersQueryRepositoryInterface");
        const movesQueryRepository: MovesQueryRepositoryInterface = ctx.container.get("MovesQueryRepositoryInterface");
        const movesMutationRepository: MovesMutationRepositoryInterface = ctx.container.get("MovesMutationRepositoryInterface");

        const game = await gamesQueryRepository.find(gameId);
        if (!game) {
            return;
        }
        if (!ctx.user) {
            return;
        }

        const player = await playersQueryRepository.findCurrentPlayer(
            game._id,
        );
        if (!player || player.userId !== ctx.user._id) {
            return;
        }

        const moves =
            await movesQueryRepository.findAllForCurrentTurn(game);
        let canContinue = true;
        for (const m of moves) {
            if (!canContinue) {
                continue;
            }
            if (m.type === MoveType.PLAYER_TO_CELL) {
                if (!(m.cellId && m.tileId && m.playerId)) {
                    continue;
                }
                await ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
                    tileId: m.tileId,
                    playerId: m.playerId,
                });
                await ctx.runMutation(
                    internal.mutations.internal.cell.computeAllowedValuesFromUpdatedCell,
                    { cellId: m.cellId },
                );
            }
            if (m.type === MoveType.BAG_TO_PLAYER) {
                if (!m.tileId) {
                    continue;
                }
                // if a tile is moved from the bag to the player during a turn it means that the player played on an operator cell and so fetched a new tile
                // in that case stop the reset as it would contrevene the randomness of the game
                canContinue = false;
                continue;
            }

            await movesMutationRepository.delete(m._id);
        }
    },
});

export const endTurn = appMutation({
    visibility: "public", security: "secure",
    args: { gameId: v.id("games"), ...SessionArgs },
    handler: async (ctx, { gameId }) => {
        if (!ctx.user) {
            throw new Error("User not authenticated");
        }

        const useCase = new EndTurnUseCase(ctx, ctx.container);
        const result = await useCase.execute(gameId, ctx.user._id, ctx.sessionId);

        if (!result.success) {
            throw new Error(result.error || "Failed to end turn");
        }
    },
});
