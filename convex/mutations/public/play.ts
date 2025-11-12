import { withSessionMutation } from "../../middleware/sessions";
import { v } from "convex/values";
import { MoveType } from "../internal/move";
import { internal } from "../../_generated/api";
import { PlayersQueryRepository } from "../../repository/query/players.repository.ts";
import { MovesQueryRepository } from "../../repository/query/moves.repository.ts";
import { GamesQueryRepository } from "../../repository/query/games.repository.ts";
import { MovesMutationRepository } from "../../repository/mutations/moves.repository.ts";
import { EndTurnUseCase } from "../../usecases/play/EndTurn.usecase";

export const resetTurn = withSessionMutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, { gameId }) => {
        const game = await GamesQueryRepository.instance.find(gameId);
        if (!game) {
            return;
        }
        if (!ctx.user) {
            return;
        }

        const player = await PlayersQueryRepository.instance.findCurrentPlayer(
            game._id,
        );
        if (!player || player.userId !== ctx.user._id) {
            return;
        }

        const moves =
            await MovesQueryRepository.instance.findAllForCurrentTurn(game);
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

            await MovesMutationRepository.instance.delete(m._id);
        }
    },
});

export const endTurn = withSessionMutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, { gameId }) => {
        if (!ctx.user) {
            throw new Error("User not authenticated");
        }

        const useCase = new EndTurnUseCase(ctx);
        const result = await useCase.execute(gameId, ctx.user._id, ctx.sessionId);

        if (!result.success) {
            throw new Error(result.error || "Failed to end turn");
        }
    },
});
