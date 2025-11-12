import {v} from "convex/values";
import type {Game} from "../../src/context/model/game.ts";
import type {Doc} from "../_generated/dataModel";
import {gameSchema} from "../../src/context/model/game.ts";
import {cellSchema} from "../../src/context/model/cell.ts";
import {api} from "../_generated/api.js";
import {appQuery, SessionArgs} from "../middleware/app.middleware.ts";
import type {GameQueryRepositoryInterface} from "../repository/query/games.repository.ts";
import type {CellsQueryRepositoryInterface} from "../repository/query/cells.repository.ts";
import type {TilesQueryRepositoryInterface} from "../repository/query/tiles.repository.ts";
import type {PlayersQueryRepositoryInterface} from "../repository/query/players.repository.ts";

export const get = appQuery({
    visibility: "public", security: "secure",
    args: {gameToken: v.string()},
    handler: async (ctx, args): Promise<Game | null> => {
        const gamesQueryRepository: GameQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface")
        const cellsQueryRepository: CellsQueryRepositoryInterface = ctx.container.get("CellsQueryRepositoryInterface")
        const tilesQueryRepository: TilesQueryRepositoryInterface = ctx.container.get("TilesQueryRepositoryInterface")
        const playersQueryRepository: PlayersQueryRepositoryInterface = ctx.container.get("PlayersQueryRepositoryInterface")

        const game: Doc<"games"> | null =
            await gamesQueryRepository.findByToken(args.gameToken);

        if (!game) {
            return null;
        }

        const gameCells = await cellsQueryRepository.findAllForGame(
            game._id,
        );

        const cells = await Promise.all(
            gameCells.map(async (c) => {
                if (!c.tileId) {
                    return c;
                }
                const tile = await tilesQueryRepository.find(c.tileId);
                return cellSchema.parse({...c, tile});
            }),
        );

        const gamePlayers = await playersQueryRepository.findByGame(
            game._id,
        );
        const players = await Promise.all(
            gamePlayers.map(async (p) => {
                return await ctx.runQuery(api.queries.player.get, {
                    playerToken: p.token,
                });
            }),
        );

        const tiles = await tilesQueryRepository.findAllByGame(game._id);

        return gameSchema.parse({
            ...game,
            cells,
            players,
            tiles,
        });
    },
});

export const getNonFinishedForSession = appQuery({
    visibility: "public", security: "public",
    args: {...SessionArgs},
    handler: async (ctx, args): Promise<Game[]> => {
        const gamesQueryRepository: GameQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface")
        const convexGames =
            await gamesQueryRepository.findNonFinishedGamesForSessionId(
                args.sessionId,
            );

        const games: Game[] = [];
        await Promise.all(
            convexGames.map(async (g) => {
                const game = await ctx.runQuery(api.queries.game.get, {
                    gameToken: g.token,
                });
                if (game !== null) {
                    games.push(game);
                }
            }),
        );

        return games;
    },
});
