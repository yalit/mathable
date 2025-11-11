import { withSessionMutation } from "../../middleware/sessions";
import { v } from "convex/values";
import { MoveType } from "../internal/move";
import { api, internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { TilesQueryRepository } from "../../repository/query/tiles.repository.ts";
import { PlayersQueryRepository } from "../../repository/query/players.repository.ts";
import { MovesQueryRepository } from "../../repository/query/moves.repository.ts";
import { GamesQueryRepository } from "../../repository/query/games.repository.ts";
import { MovesMutationRepository } from "../../repository/mutations/moves.repository.ts";
import { PlayersMutationRepository } from "../../repository/mutations/players.repository.ts";
import { GamesMutationRepository } from "../../repository/mutations/games.repository.ts";

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
        const game = await GamesQueryRepository.instance.find(gameId);
        if (!game) {
            return;
        }
        const currentPlayer =
            await PlayersQueryRepository.instance.findCurrentPlayer(game._id);

        if (!ctx.user || !currentPlayer || currentPlayer.userId !== ctx.user._id) {
            return;
        }

        // check if game is finished
        // 1. or the current player has no tile anymore and there are no tiles anymore in the bag => set the game in finished status + a
        if (await GamesQueryRepository.instance.isGameWon(gameId, currentPlayer._id)) {
            await ctx.runMutation(internal.mutations.internal.game.endGameWithWinner, {gameId: gameId, playerId: currentPlayer._id})
        }
        // 2. or if there were no actions for the last 2 moves for each player (so 4 turns) => set the
        if (await GamesQueryRepository.instance.isGameIdle(game._id)) {
            await ctx.runMutation(internal.mutations.internal.game.endGameAsIdle, {gameId: gameId})
        }

        const turnScore = await ctx.runQuery(api.queries.play.getCurrentTurnScore, {
            gameId,
            sessionId: ctx.sessionId,
        });

        // change the current player to the next one
        const nextPlayerDoc = await PlayersQueryRepository.instance.findNextPlayer(
            game._id,
        );

        if (!nextPlayerDoc) {
            return;
        }

        const { playerFromDoc } = await import("../../domain/models/factory/player.factory");
        const nextPlayer = playerFromDoc(nextPlayerDoc);
        nextPlayer.setAsCurrent();
        await PlayersMutationRepository.instance.save(nextPlayer);

        // update the score of the current playerId
        const currentPlayerTiles = await TilesQueryRepository.instance.findByPlayer(
            currentPlayer._id,
        );
        const additionalScoreForEmptyHand =
            currentPlayerTiles.length === 0 ? 50 : 0;

        const currentPlayerModel = playerFromDoc(currentPlayer);
        currentPlayerModel.removeAsCurrent();
        currentPlayerModel.addScore(turnScore + additionalScoreForEmptyHand);
        await PlayersMutationRepository.instance.save(currentPlayerModel);

        // add the needed tiles to the current player
        const currentTiles = await TilesQueryRepository.instance.findByPlayer(
            currentPlayer._id,
        );
        const neededTiles = 7 - currentTiles.length;

        for (let i = 0; i < neededTiles; i++) {
            const tiles = await TilesQueryRepository.instance.findAllInBagByGame(
                game._id,
            );
            tiles
                .sort(() => Math.random() - 0.5)
                .slice(0, 1)
                .forEach(async (t) => {
                    await ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
                        tileId: t._id as Id<"tiles">,
                        playerId: currentPlayer._id as Id<"players">,
                    });
                });
        }

        // update the current turn to + 1
        const { createGameFromDoc } = await import("../../domain/models/factory/game.factory.ts");
        const gameModel = createGameFromDoc(game);
        gameModel.incrementTurn();
        await GamesMutationRepository.instance.save(gameModel);
    },
});
