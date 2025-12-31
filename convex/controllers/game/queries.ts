import type {Game} from "../../domain/models/Game.ts";
import {appQuery, SessionArgs} from "../../infrastructure/middleware/app.middleware.ts";
import type {GamesQueryRepositoryInterface} from "../../repository/query/games.repository.ts";
import {v} from "convex/values";
import type {PlayersQueryRepositoryInterface} from "../../repository/query/players.repository.ts";
import type {Player} from "../../domain/models/Player.ts";

type OngoingGame = {
    id: string;
    status: string;
    currentTurn: number;
    players: Array<OngoingGamePlayer>;
    token: string
}

type OngoingGamePlayer = {
    token: string
    userId: string
    name: string;
    score: number;
}

export const getNonFinishedForSession = appQuery({
    args: {...SessionArgs},
    handler: async (ctx): Promise<OngoingGame[]> => {
        if (!ctx.user) return []
        const playersQuery: PlayersQueryRepositoryInterface = ctx.container.get("PlayersQueryRepositoryInterface")
        const sessionPlayers: Player[] = await playersQuery.findAllByUserId(ctx.user)

        const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get("GamesQueryRepositoryInterface")
        const nonFinishedGames: Game[] = await gamesQuery.findNonFinishedGamesForSessionId(sessionPlayers);

        console.log("Non Finished Games", nonFinishedGames)
        return Promise.all(
            nonFinishedGames.map(async (g: Game): Promise<OngoingGame> => {
                const players = await playersQuery.findByGame(g)
                return {
                    id: g.id,
                    status: g.status,
                    currentTurn: g.currentTurn,
                    token: g.token,
                    players: players.map((p: Player): OngoingGamePlayer => ({
                        token: p.token,
                        userId: p.userId,
                        name: p.name,
                        score: p.score
                    }))
                }
            })
        )
    }
});

export const get = appQuery({
    args: {gameToken: v.string()},
    handler: async (ctx, args): Promise<Game | null> => {
        console.log(ctx)
        const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get("GamesQueryRepositoryInterface")
        return await gamesQuery.findByToken(args.gameToken);
    }
});
