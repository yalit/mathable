import { internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { SessionId } from "convex-helpers/server/sessions";
import { GamesMutationRepository } from "../../repository/mutations/games.repository";
import { GamesQueryRepository } from "../../repository/query/games.repository";
import { PlayersMutationRepository } from "../../repository/mutations/players.repository";
import { PlayersQueryRepository } from "../../repository/query/players.repository";
import { CellsMutationRepository } from "../../repository/mutations/cells.repository";
import { TilesMutationRepository } from "../../repository/mutations/tiles.repository";
import {createGame, getBoardCells, getInitialGameTiles} from "../../domain/models/factory/game.factory.ts";
import type {Cell} from "../../domain/models/Cell.ts";

export interface CreateGameResult {
  gameToken: string;
  playerToken: string;
}

/**
 * CreateGameUseCase
 * Orchestrates the creation of a new game with all required setup
 */
export class CreateGameUseCase {
  private ctx: MutationCtx;

  constructor(ctx: MutationCtx) {
    this.ctx = ctx;
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
    const game = await GamesQueryRepository.instance.find(gameId);
    const player = await PlayersQueryRepository.instance.find(playerId);

    return {
      gameToken: game?.token ?? "",
      playerToken: player?.token ?? "",
    };
  }

  /**
   * Create the game entity
   */
  private async initializeGame(): Promise<Id<"games">> {
    const { UUID } = await import("../../domain/models/factory/uuid.factory.ts");
    const game = createGame(UUID());
    return await GamesMutationRepository.instance.save(game);
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
    const playerDoc = await PlayersQueryRepository.instance.find(playerId);
    if (playerDoc) {
      const { playerFromDoc } = await import("../../domain/models/factory/player.factory");
      const player = playerFromDoc(playerDoc);
      player.setAsOwner();
      await PlayersMutationRepository.instance.save(player);
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
        await CellsMutationRepository.instance.save(cell);
      })
    );
  }

  /**
   * Create the initial set of tiles for the game
   * Uses the factory to get the initial tile configuration
   */
  private async createInitialTiles(gameId: Id<"games">): Promise<void> {
    const initialTiles = getInitialGameTiles(gameId);
    const { createTile } = await import("../../domain/models/factory/tile.factory.ts");

    for (const tileData of initialTiles) {
      const tile = createTile(gameId, tileData.value, tileData.location);
      await TilesMutationRepository.instance.save(tile);
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
