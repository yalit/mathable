import { internalMutation } from "../../_generated/server";
import { v } from "convex/values";

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

export const createMove = internalMutation({
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
    await ctx.db.insert("moves", {
      ...args,
    });
  },
});
