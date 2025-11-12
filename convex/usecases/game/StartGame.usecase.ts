import { internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { GamesQueryRepository } from "../../repository/query/games.repository";
import { PlayersQueryRepository } from "../../repository/query/players.repository";
import { TilesQueryRepository } from "../../repository/query/tiles.repository";
import { GamesMutationRepository } from "../../repository/mutations/games.repository";
import { PlayersMutationRepository } from "../../repository/mutations/players.repository";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";
import { playerFromDoc } from "../../domain/models/factory/player.factory";
import { Player } from "../../domain/models/Player";
import type {User} from "../../domain/models/User.ts";

export interface StartGameResult {
  success: boolean;
  error?: string;
}

/**
 * StartGameUseCase
 * Orchestrates starting a game that's in waiting status
 */
export class StartGameUseCase {
  private ctx: MutationCtx;

  constructor(ctx: MutationCtx) {
    this.ctx = ctx;
  }

  async execute(
    gameId: Id<"games">,
    user: User,
  ): Promise<StartGameResult> {
    // 1. Validate game exists
    const gameDoc = await GamesQueryRepository.instance.find(gameId);
    if (!gameDoc) {
      return {
        success: false,
        error: "Game not found",
      };
    }

    // 2. Load game into domain model
    const game = createGameFromDoc(gameDoc);

    // 3. Load players
    const playerDocs = await PlayersQueryRepository.instance.findByGame(gameId);
    const players = playerDocs.map((doc) => playerFromDoc(doc));

    // 4. Validate user is the game owner
    const owner = players.find((p) => p.owner);
    if (!owner) {
      return {
        success: false,
        error: "No game owner found",
      };
    }

    if (user.id && !owner.isSameUser(user.id)) {
      return {
        success: false,
        error: "Only the game owner can start the game",
      };
    }

    // 5. Validate game can be started (using domain logic)
    if (!game.canBeStartedBy(owner)) {
      return {
        success: false,
        error: "Game cannot be started (must be in waiting status)",
      };
    }

    // 6. Validate minimum players
    if (players.length < 2) {
      return {
        success: false,
        error: "Need at least 2 players to start the game",
      };
    }

    // 7. Start the game (using domain logic)
    game.start(players);

    // 8. Persist game state changes
    await GamesMutationRepository.instance.save(game);

    // 9. Persist player state changes (order and current status)
    for (const player of players) {
      await PlayersMutationRepository.instance.save(player);
    }

    // 10. Distribute initial tiles to all players
    await this.distributeInitialTiles(gameId, players);

    return {
      success: true,
    };
  }

  /**
   * Distribute 7 tiles to each player from the bag
   */
  private async distributeInitialTiles(
    gameId: Id<"games">,
    players: Player[]
  ): Promise<void> {
    for (const player of players) {
      const tiles = await TilesQueryRepository.instance.findAllInBagByGame(
        gameId
      );

      // Randomize and take 7 tiles
      tiles.sort(() => Math.random() - 0.5);
      const tilesToDistribute = tiles.slice(0, 7);

      for (const tile of tilesToDistribute) {
        await this.ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
          tileId: tile._id as Id<"tiles">,
          playerId: player.id,
        });
      }
    }
  }
}
