import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { SessionId } from "convex-helpers/server/sessions";
import type { GamesMutationRepositoryInterface } from "../../repository/mutations/games.repository";
import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository";
import type { PlayersMutationRepositoryInterface } from "../../repository/mutations/players.repository";
import type { PlayersQueryRepositoryInterface } from "../../repository/query/players.repository";
import type { CellsMutationRepositoryInterface } from "../../repository/mutations/cells.repository";
import type { TilesMutationRepositoryInterface } from "../../repository/mutations/tiles.repository";
import {createGame, getBoardCells, getInitialGameTiles} from "../../domain/models/factory/game.factory.ts";
import type {Cell} from "../../domain/models/Cell.ts";
import { UUID } from "../../domain/models/factory/uuid.factory.ts";
import {createTile} from "../../domain/models/factory/tile.factory.ts";
import {playerFromDoc} from "../../domain/models/factory/player.factory.ts";
import type {AppMutationCtx} from "@cvx/middleware/app.middleware.ts";

export interface CreateGameResult {
  gameToken: string;
  playerToken: string;
}

/**
 * CreateGameUseCase
 * Orchestrates the creation of a new game with all required setup
 */
export class CreateGameUseCase {
  private ctx: AppMutationCtx;

  constructor(ctx: AppMutationCtx) {
    this.ctx = ctx;
  }

  private get gamesQuery(): GameQueryRepositoryInterface {
    return this.ctx.container.get("GameQueryRepositoryInterface");
  }

  private get gamesMutation(): GamesMutationRepositoryInterface {
    return this.ctx.container.get("GamesMutationRepositoryInterface");
  }

  private get playersQuery(): PlayersQueryRepositoryInterface {
    return this.ctx.container.get("PlayersQueryRepositoryInterface");
  }

  private get playersMutation(): PlayersMutationRepositoryInterface {
    return this.ctx.container.get("PlayersMutationRepositoryInterface");
  }

  private get cellsMutation(): CellsMutationRepositoryInterface {
    return this.ctx.container.get("CellsMutationRepositoryInterface");
  }

  private get tilesMutation(): TilesMutationRepositoryInterface {
    return this.ctx.container.get("TilesMutationRepositoryInterface");
  }

  async execute(
    playerName: string,
    sessionId: SessionId
  ): Promise<CreateGameResult> {
    // 1. Create game entity
    const gameId = await this.initializeGame();

    // 2. Create owner player
    const playerId = await this.initializeOwner(gameId, playerName, sessionId);

    // 3. Initialize game board
    await this.initializeBoard(gameId);

    // 4. Create initial tile set
    await this.createInitialTiles(gameId);

    // 5. Compute allowed values for all cells
    await this.computeAllowedValues(gameId);

    // 6. Retrieve created entities for return
    const game = await this.gamesQuery.find(gameId);
    const player = await this.playersQuery.find(playerId);

    return {
      gameToken: game?.token ?? "",
      playerToken: player?.token ?? "",
    };
  }

  /**
   * Create the game entity
   */
  private async initializeGame(): Promise<Id<"games">> {
    const game = createGame(UUID());
    return await this.gamesMutation.save(game);
  }

  /**
   * Create the owner player for the game
   */
  private async initializeOwner(
    gameId: Id<"games">,
    playerName: string,
    sessionId: SessionId
  ): Promise<Id<"players">> {
    // Create player via internal mutation
    const playerId: Id<"players"> = await this.ctx.runMutation(
      internal.mutations.internal.player.create,
      { gameId, name: playerName, sessionId }
    );

    // Set the player as owner
    const playerDoc = await this.playersQuery.find(playerId);
    if (playerDoc) {
      const player = playerFromDoc(playerDoc);
      player.setAsOwner();
      await this.playersMutation.save(player);
    }

    return playerId;
  }

  /**
   * Initialize the game board with cells
   * Uses the factory to get the initial board structure
   */
  private async initializeBoard(gameId: Id<"games">): Promise<void> {
    const boardCells = getBoardCells(gameId);

    await Promise.all(
      boardCells.map(async (cell: Cell) => {
        await this.cellsMutation.save(cell);
      })
    );
  }

  /**
   * Create the initial set of tiles for the game
   * Uses the factory to get the initial tile configuration
   */
  private async createInitialTiles(gameId: Id<"games">): Promise<void> {
    const initialTiles = getInitialGameTiles(gameId);

    for (const tileData of initialTiles) {
      const tile = createTile(gameId, tileData.value, tileData.location);
      await this.tilesMutation.save(tile);
    }
  }

  /**
   * Compute allowed values for all cells on the board
   */
  private async computeAllowedValues(gameId: Id<"games">): Promise<void> {
    await this.ctx.runMutation(
      internal.mutations.internal.cell.computeAllAllowedValues,
      { gameId }
    );
  }
}
