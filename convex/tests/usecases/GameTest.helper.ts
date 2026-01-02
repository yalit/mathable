import type { Doc, Id } from "@cvx/_generated/dataModel";
import type schema from "@cvx/schema";
import type { TestConvex } from "convex-test";
import { api } from "../../_generated/api";
import type { SessionId } from "convex-helpers/server/sessions";

type CreateGameInput = {
  playerNames: string[];
  playerTileValues?: number[][];
};

type GameSetupResult = {
  game: Doc<"games">;
  players: Doc<"players">[];
  users: Doc<"users">[];
};

type CurrentPlayerResult = {
  player: Doc<"players">;
  user: Doc<"users">;
};

type ValidTileCellPairResult = {
  tile: Doc<"tiles">;
  cell: Doc<"cells">;
  player: Doc<"players">;
  user: Doc<"users">;
};

type EmptyCellWithAllowedValues = {
  cell: Doc<"cells">;
  allowedValues: number[];
};

export interface GameTestHelperInterface {
  createGame(input: CreateGameInput): Promise<GameSetupResult>;
  getCurrentPlayer(gameId: Id<"games">): Promise<CurrentPlayerResult>;
  getPlayerTiles(playerId: Id<"players">): Promise<Doc<"tiles">[]>;
  findValidTileCellPair(gameId: Id<"games">): Promise<ValidTileCellPairResult>;
  getEmptyCellAt(
    gameId: Id<"games">,
    row: number,
    column: number,
  ): Promise<Doc<"cells">>;
  getEmptyCellsWithAllowedValues(
    gameId: Id<"games">,
  ): Promise<EmptyCellWithAllowedValues[]>;
  emptyTileBag(gameId: Id<"games">): Promise<void>;
  getCurrentTurnMoves(gameId: Id<"games">): Promise<Doc<"moves">[]>;
}

export class GameTestHelper implements GameTestHelperInterface {
  private readonly t: TestConvex<typeof schema>;

  constructor(t: TestConvex<typeof schema>) {
    this.t = t;
  }

  /**
   * Creates and starts a game with deterministic tile distribution
   *
   * @param input.playerNames - Array of player names (first player is the owner)
   * @param input.playerTileValues - Optional array of tile value arrays for each player.
   *   Each inner array specifies the tile values that must be in that player's hand.
   *   Remaining slots (up to 7) are filled randomly from the bag.
   *   Example: [[1, 2, 3], [4, 5]] - Player 1 gets tiles 1,2,3 + 4 random, Player 2 gets 4,5 + 5 random
   */
  async createGame(input: CreateGameInput): Promise<GameSetupResult> {
    const { playerNames, playerTileValues } = input;

    if (playerNames.length < 2) {
      throw new Error("At least 2 players are required");
    }

    // Generate session IDs for each player
    const sessionIds = playerNames.map((_, i) => `session-${i}`);

    // Create game with owner (first player)
    const createResult = await this.t.mutation(
      api.controllers.game.mutations.create,
      {
        playerName: playerNames[0],
        sessionId: sessionIds[0] as SessionId,
      },
    );

    const gameToken = createResult.data!.gameToken;

    const game = await this.t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", gameToken))
        .first();
    });

    if (!game) {
      throw new Error("Failed to create game");
    }

    // Join remaining players
    for (let i = 1; i < playerNames.length; i++) {
      await this.t.mutation(api.controllers.game.mutations.join, {
        gameId: game._id,
        playerName: playerNames[i],
        sessionId: sessionIds[i] as SessionId,
      });
    }

    // Start the game (distributes random tiles)
    await this.t.mutation(api.controllers.game.mutations.start, {
      gameId: game._id,
      sessionId: sessionIds[0] as SessionId,
    });

    // Get updated game after start
    const startedGame = await this.t.run(async (ctx) => {
      return await ctx.db.get(game._id);
    });

    // Get players sorted by order
    const players = await this.t.run(async (ctx) => {
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_game", (q) => q.eq("gameId", game._id))
        .collect();
      return allPlayers.sort((a, b) => a.order - b.order);
    });

    // Get users for each player
    const users: Doc<"users">[] = [];
    for (const player of players) {
      const user = await this.t.run(async (ctx) => {
        return await ctx.db.get(player.userId);
      });
      if (user) {
        users.push(user);
      }
    }

    // Apply deterministic tile distribution if specified
    if (playerTileValues) {
      await this.applyDeterministicTiles(game._id, players, playerTileValues);
    }

    return {
      game: startedGame!,
      players,
      users,
    };
  }

  /**
   * Replaces player tiles with specified values
   * The tiles are taken from the bag and swapped with current player tiles
   */
  private async applyDeterministicTiles(
    gameId: Id<"games">,
    players: Doc<"players">[],
    playerTileValues: number[][],
  ): Promise<void> {
    for (let i = 0; i < playerTileValues.length && i < players.length; i++) {
      const player = players[i];
      const desiredValues = playerTileValues[i];

      if (!desiredValues || desiredValues.length === 0) {
        continue;
      }

      await this.assignTilesToPlayer(gameId, player._id, desiredValues);
    }
  }

  /**
   * Assigns specific tile values to a player's hand
   * Swaps existing tiles back to bag and takes desired tiles from bag
   */
  private async assignTilesToPlayer(
    gameId: Id<"games">,
    playerId: Id<"players">,
    desiredValues: number[],
  ): Promise<void> {
    // Get current tiles in player's hand
    const currentTiles = await this.t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_player", (q) => q.eq("playerId", playerId))
        .collect();
    });

    // Find which desired values the player already has
    const currentValues = currentTiles.map((t) => t.value);
    const valuesToAdd: number[] = [];
    const desiredValuesCopy = [...desiredValues];

    for (const value of desiredValuesCopy) {
      const existingIndex = currentValues.indexOf(value);
      if (existingIndex !== -1) {
        // Player already has this value, remove from consideration
        currentValues.splice(existingIndex, 1);
      } else {
        // Need to get this value from bag
        valuesToAdd.push(value);
      }
    }

    // Get tiles to swap back to bag (tiles not in desired values)
    const tilesToSwapBack = currentTiles.filter((tile) => {
      const idx = desiredValues.indexOf(tile.value);
      if (idx !== -1) {
        // Remove from desiredValues to handle duplicates correctly
        desiredValues.splice(idx, 1);
        return false;
      }
      return true;
    });

    // Swap tiles back to bag (only as many as we need to add)
    const swapCount = Math.min(tilesToSwapBack.length, valuesToAdd.length);
    for (let i = 0; i < swapCount; i++) {
      await this.t.run(async (ctx) => {
        await ctx.db.patch(tilesToSwapBack[i]._id, {
          playerId: null,
          location: "in_bag",
        });
      });
    }

    // Get desired tiles from bag and assign to player
    for (const value of valuesToAdd) {
      const tileFromBag = await this.t.run(async (ctx) => {
        return await ctx.db
          .query("tiles")
          .withIndex("by_game_location", (q) =>
            q.eq("gameId", gameId).eq("location", "in_bag"),
          )
          .filter((q) => q.eq(q.field("value"), value))
          .first();
      });

      if (!tileFromBag) {
        throw new Error(
          `No tile with value ${value} available in bag for game ${gameId}`,
        );
      }

      await this.t.run(async (ctx) => {
        await ctx.db.patch(tileFromBag._id, {
          playerId: playerId,
          location: "in_hand",
        });
      });
    }
  }

  /**
   * Gets the current player with their user session
   */
  async getCurrentPlayer(gameId: Id<"games">): Promise<CurrentPlayerResult> {
    const player = await this.t.run(async (ctx) => {
      return await ctx.db
        .query("players")
        .withIndex("by_game_current", (q) =>
          q.eq("gameId", gameId).eq("current", true),
        )
        .first();
    });

    if (!player) {
      throw new Error("No current player found");
    }

    const user = await this.t.run(async (ctx) => {
      return await ctx.db.get(player.userId);
    });

    if (!user) {
      throw new Error("No user found for current player");
    }

    return { player, user };
  }

  /**
   * Gets tiles in a player's hand
   */
  async getPlayerTiles(playerId: Id<"players">): Promise<Doc<"tiles">[]> {
    return await this.t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_player", (q) => q.eq("playerId", playerId))
        .collect();
    });
  }

  /**
   * Finds a valid tile-cell pair for the current player
   * Returns the first tile that can be placed on any empty cell
   */
  async findValidTileCellPair(
    gameId: Id<"games">,
  ): Promise<ValidTileCellPairResult> {
    const { player, user } = await this.getCurrentPlayer(gameId);

    const cells = await this.t.run(async (ctx) => {
      return await ctx.db
        .query("cells")
        .withIndex("by_game_row_column", (q) => q.eq("gameId", gameId))
        .collect();
    });

    const availableCells = cells.filter(
      (c) =>
        c.type === "empty" && c.tileId === null && c.allowedValues.length > 0,
    );

    const tiles = await this.getPlayerTiles(player._id);

    for (const tile of tiles) {
      const matchingCell = availableCells.find((c) =>
        c.allowedValues.includes(tile.value),
      );
      if (matchingCell) {
        return { tile, cell: matchingCell, player, user };
      }
    }

    throw new Error(
      "No valid tile-cell pair found. Player tiles: " +
        tiles.map((t) => t.value).join(", ") +
        ". Available cell values: " +
        availableCells.map((c) => c.allowedValues.join(",")).join(" | "),
    );
  }

  /**
   * Gets an empty cell at a specific position
   */
  async getEmptyCellAt(
    gameId: Id<"games">,
    row: number,
    column: number,
  ): Promise<Doc<"cells">> {
    const cell = await this.t.run(async (ctx) => {
      return await ctx.db
        .query("cells")
        .withIndex("by_game_row_column", (q) =>
          q.eq("gameId", gameId).eq("row", row).eq("column", column),
        )
        .first();
    });

    if (!cell) {
      throw new Error(`No cell found at position (${row}, ${column})`);
    }

    if (cell.type !== "empty") {
      throw new Error(`Cell at (${row}, ${column}) is not empty`);
    }

    return cell;
  }

  /**
   * Gets all empty cells with their allowed values
   */
  async getEmptyCellsWithAllowedValues(
    gameId: Id<"games">,
  ): Promise<EmptyCellWithAllowedValues[]> {
    const cells = await this.t.run(async (ctx) => {
      return await ctx.db
        .query("cells")
        .withIndex("by_game_row_column", (q) => q.eq("gameId", gameId))
        .collect();
    });

    return cells
      .filter((c) => c.type === "empty" && c.tileId === null)
      .map((c) => ({
        cell: c,
        allowedValues: c.allowedValues,
      }));
  }

  /**
   * Empties the tile bag (useful for testing empty bag scenarios)
   */
  async emptyTileBag(gameId: Id<"games">): Promise<void> {
    const tilesInBag = await this.t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_game_location", (q) =>
          q.eq("gameId", gameId).eq("location", "in_bag"),
        )
        .collect();
    });

    for (const tile of tilesInBag) {
      await this.t.run(async (ctx) => {
        await ctx.db.delete(tile._id);
      });
    }
  }

  /**
   * Gets moves for the current turn
   */
  async getCurrentTurnMoves(gameId: Id<"games">): Promise<Doc<"moves">[]> {
    const game = await this.t.run(async (ctx) => {
      return await ctx.db.get(gameId);
    });

    return await this.t.run(async (ctx) => {
      return await ctx.db
        .query("moves")
        .withIndex("by_turn", (q) =>
          q.eq("gameId", gameId).eq("turn", game!.currentTurn),
        )
        .collect();
    });
  }
}
