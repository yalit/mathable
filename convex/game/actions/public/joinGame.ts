import { mutation } from "../../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../../_generated/api";
import { getPlayer } from "../../../helpers/player";
import { getGamePlayers } from "../../../helpers/game";

export default mutation({
  args: { gameId: v.id("games"), playerName: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; token: string }> => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return { success: false, token: "" };
    }

    const players = await getGamePlayers(game, ctx);

    if (players.length >= 4) {
      return { success: false, token: "" };
    }

    const playerId = await ctx.runMutation(
      internal.game.actions.internal.createPlayer.default,
      { gameId: args.gameId, name: args.playerName },
    );

    const player = await getPlayer(playerId, ctx);

    return { success: player !== null, token: player?.token ?? "" };
  },
});
