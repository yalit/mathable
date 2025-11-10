import { internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { SessionId } from "convex-helpers/server/sessions";
import { GamesQueryRepository } from "../../repository/query/games.repository";
import { PlayersQueryRepository } from "../../repository/query/players.repository";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";

export interface JoinGameResult {
  success: boolean;
  playerToken: string|null;
  error?: string;
}

/**
 * JoinGameUseCase
 * Orchestrates a player joining an existing game
 */
export class JoinGameUseCase {
  private ctx: MutationCtx;

  constructor(ctx: MutationCtx) {
    this.ctx = ctx;
  }

  async execute(
    gameId: Id<"games">,
    playerName: string,
    sessionId: SessionId
  ): Promise<JoinGameResult> {
    // 1. Validate game exists
    const gameDoc = await GamesQueryRepository.instance.find(gameId);
    if (!gameDoc) {
      return {
        success: false,
        error: "Game not found",
        playerToken: null,
      };
    }

    // 2. Load game into domain model
    const game = createGameFromDoc(gameDoc);

    // 3. Validate game is in waiting status
    if (!game.isWaiting()) {
      return {
        success: false,
        error: "Game has already started",
        playerToken: null,
      };
    }

    // 4. Validate there's room for more players
    const players = await PlayersQueryRepository.instance.findByGame(gameId);
    if (players.length >= 4) {
      return {
        success: false,
        error: "Game is full (maximum 4 players)",
        playerToken: null,
      };
    }

    // 5. Create the player
    const playerId = await this.createPlayer(gameId, playerName, sessionId);

    // 6. Retrieve created player for return
    const player = await PlayersQueryRepository.instance.find(playerId);

    return {
      success: true,
      playerToken: player?.token ?? "",
    };
  }

  /**
   * Create a new player for the game
   */
  private async createPlayer(
    gameId: Id<"games">,
    playerName: string,
    sessionId: SessionId
  ): Promise<Id<"players">> {
    return await this.ctx.runMutation(
      internal.mutations.internal.player.create,
      { gameId, name: playerName, sessionId }
    );
  }
}
