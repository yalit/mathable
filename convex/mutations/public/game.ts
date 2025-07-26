import { getGame, getGamePlayers, getGameTiles } from "../../helpers/game";
import {
  getBoardCells,
  getInitialGameTiles,
} from "../../../src/context/factories/gameFactory";
import { UUID } from "../../../src/context/factories/uuidFactory";
import type { Cell } from "../../../src/context/model/cell";
import type { Tile } from "../../../src/context/model/tile";
import { internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { getPlayer } from "../../helpers/player";
import { vSessionId } from "convex-helpers/server/sessions";
import { mutationWithSession } from "../../middleware/sessions";
import type { Player } from "../../../src/context/model/player";

export const create = mutation({
  args: { gameName: v.string(), playerName: v.string(), sessionId: vSessionId },
  handler: async (ctx, args) => {
    // create Game
    const gameId = await ctx.db.insert("games", {
      name: args.gameName,
      token: UUID(),
      status: "waiting",
      currentTurn: 0,
    });
    const game = await ctx.db.get(gameId);

    // create playerName
    const playerId: Id<"players"> = await ctx.runMutation(
      internal.mutations.internal.player.create,
      { gameId, name: args.playerName, sessionId: args.sessionId },
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
      internal.mutations.internal.cell.computeAllAllowedValues,
      { gameId },
    );

    // create Tiles
    getInitialGameTiles().forEach(async (t: Tile) => {
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
  args: {
    gameId: v.id("games"),
    playerName: v.string(),
    sessionId: vSessionId,
  },
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
      { gameId: args.gameId, name: args.playerName, sessionId: args.sessionId },
    );

    const player = await getPlayer(playerId, ctx);

    return { success: player !== null, token: player?.token ?? "" };
  },
});

export const start = mutationWithSession({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game: Doc<"games"> | null = await getGame(gameId, ctx);

    if (!game) {
      return;
    }

    if (!ctx.user) {
      return;
    }

    const players = await getGamePlayers(game, ctx);
    const owner = players.filter((p: Player) => p.owner);
    if (owner.length === 0 || owner[0].userId !== ctx.user._id) {
      return;
    }

    // change the status & setup the currentTurn
    await ctx.db.patch(gameId, { status: "ongoing", currentTurn: 1 });

    // set the random order for the players
    // set the current player to the player with order 1
    // randomize the order
    players.sort(() => Math.random() - 0.5);
    players.forEach(async (p, idx) => {
      await ctx.db.patch(p._id as Id<"players">, {
        order: idx + 1,
        current: idx === 0,
      });
    });

    // set the tiles for each users
    players.forEach(async (p) => {
      const tiles = await getGameTiles(game, ctx);
      tiles.sort(() => Math.random() - 0.5);
      tiles
        .filter((t) => t.location === "in_bag")
        .slice(0, 7)
        .forEach(async (t) => {
          await ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
            tileId: t._id as Id<"tiles">,
            playerId: p._id as Id<"players">,
          });
        });
    });
  },
});

//TODO : implement endGame
export const endGame = {};
