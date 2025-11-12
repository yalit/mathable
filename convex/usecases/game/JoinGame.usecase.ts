import { internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { SessionId } from "convex-helpers/server/sessions";
import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository";
import type { PlayersQueryRepositoryInterface } from "../../repository/query/players.repository";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";
import type {AppMutationCtx} from "@cvx/middleware/app.middleware.ts";

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
  private ctx: AppMutationCtx;

  constructor(ctx: AppMutationCtx) {
    this.ctx = ctx;
  }

  private get gamesQuery(): GameQueryRepositoryInterface {
    return this.ctx.container.get("GameQueryRepositoryInterface");
  }

  private get playersQuery(): PlayersQueryRepositoryInterface {
    return this.ctx.container.get("PlayersQueryRepositoryInterface");
  }

  async execute(
    gameId: Id<"games">,
    playerName: string,
    sessionId: SessionId
  ): Promise<JoinGameResult> {
    // 1. Validate game exists
    const gameDoc = await this.gamesQuery.find(gameId);
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
    const players = await this.playersQuery.findByGame(gameId);
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
    const player = await this.playersQuery.find(playerId);

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
