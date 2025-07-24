import { getGamePlayers } from "../../helpers/game";
import {
  getBoardCells,
  getGameTiles,
} from "../../../src/context/factories/gameFactory";
import { UUID } from "../../../src/context/factories/uuidFactory";
import type { Cell } from "../../../src/context/model/cell";
import type { Tile } from "../../../src/context/model/tile";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { getPlayer } from "../../helpers/player";

export const create = mutation({
  args: { gameName: v.string(), playerName: v.string() },
  handler: async (ctx, args) => {
    // create Game
    const gameId = await ctx.db.insert("games", {
      name: args.gameName,
      token: UUID(),
      status: "waiting",
    });
    const game = await ctx.db.get(gameId);

    // create playerName
    const playerId: Id<"players"> = await ctx.runMutation(
      internal.mutations.internal.player.create,
      { gameId, name: args.playerName },
    );
    // set the user as owner
    await ctx.db.patch(playerId, { owner: true });
    const player = await ctx.db.get(playerId);

    // create Cells
    let boardCells = getBoardCells();
    boardCells = await Promise.all(
      boardCells.map(async (c: Cell) => {
        const cellId = await ctx.db.insert("cells", {
          gameId,
          row: c.row,
          column: c.column,
          allowedValues: [],
          type: c.type,
          value: c.type === "value" ? c.value : null,
          multiplier: c.type === "multiplier" ? c.multiplier : null,
          operator: c.type === "operator" ? c.operator : null,
          tileId: null,
        });
        return {
          ...c,
          id: cellId,
        };
      }),
    );

    // generate allowedValues
    await ctx.runMutation(
      internal.game.actions.internal.computeAllowedValues
        .computeAllAllowedValues,
      { gameId },
    );

    // create Tiles
    getGameTiles().forEach(async (t: Tile) => {
      await ctx.db.insert("tiles", {
        gameId,
        value: t.value,
        location: t.location,
        playerId: null,
        cellId: null,
      });
    });

    return { gameToken: game?.token ?? "", playerToken: player?.token ?? "" };
  },
});

export const join = mutation({
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
      internal.mutations.internal.player.create,
      { gameId: args.gameId, name: args.playerName },
    );

    const player = await getPlayer(playerId, ctx);

    return { success: player !== null, token: player?.token ?? "" };
  },
});
