import type { Id } from "../../_generated/dataModel";
import type { SessionId } from "convex-helpers/server/sessions";
import { Player } from "./Player";
import type {DocData} from "../../repository/repositories.interface.ts";

/**
 * User domain model with relationship support
 * Uses Lean Domain Model pattern: relationships passed as parameters with validation
 */
export class User {
  public readonly id: Id<"users">;
  public readonly sessionId: SessionId;

  public constructor(
    id: Id<"users">,
    sessionId: SessionId,
  ) {
    this.id = id;
    this.sessionId = sessionId;
  }

  /**
   * Convert domain model back to database format
   */
  toDoc(): DocData<"users"> {
    return {
      sessionId: this.sessionId,
    };
  }

  // ========================================
  // Relationship Validation Methods
  // ========================================

  /**
   * Validate that player belongs to this user
   * @throws Error if player doesn't belong to this user
   */
  private validatePlayerBelongsToUser(player: Player): void {
    if (player.userId !== this.id) {
      throw new Error(
        `Player ${player.id} does not belong to user ${this.id}`
      );
    }
  }

  /**
   * Validate that all players belong to this user
   * @throws Error if any player doesn't belong to this user
   */
  private validatePlayersBelongToUser(players: Player[]): void {
    for (const player of players) {
      if (player.userId !== this.id) {
        throw new Error(
          `Player ${player.id} does not belong to user ${this.id}`
        );
      }
    }
  }

  // ========================================
  // Business Logic Methods
  // ========================================

  /**
   * Check if this user owns a specific player
   * @param player - The player to check
   * @returns true if user owns the player
   */
  ownsPlayer(player: Player): boolean {
    this.validatePlayerBelongsToUser(player);
    return true; // If validation passes, user owns player
  }

  /**
   * Get count of active games for this user
   * @param players - All players belonging to this user
   * @returns count of unique games
   */
  getActiveGameCount(players: Player[]): number {
    this.validatePlayersBelongToUser(players);

    const uniqueGameIds = new Set(players.map(p => p.gameId));
    return uniqueGameIds.size;
  }

  /**
   * Check if user is in a specific game
   * @param gameId - The game ID to check
   * @param players - All players belonging to this user
   * @returns true if user has a player in the game
   */
  isInGame(gameId: Id<"games">, players: Player[]): boolean {
    this.validatePlayersBelongToUser(players);
    return players.some(p => p.gameId === gameId);
  }

  /**
   * Find player for a specific game
   * @param gameId - The game ID
   * @param players - All players belonging to this user
   * @returns the player in that game or undefined
   */
  getPlayerInGame(
    gameId: Id<"games">,
    players: Player[]
  ): Player | undefined {
    this.validatePlayersBelongToUser(players);
    return players.find(p => p.gameId === gameId);
  }

  // ========================================
  // Serialization
  // ========================================

  /**
   * Convert to plain object for Convex serialization
   */
  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
    };
  }
}
