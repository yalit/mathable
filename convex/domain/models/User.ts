import type { Doc, Id } from "../../_generated/dataModel";
import type { SessionId } from "convex-helpers/server/sessions";
import { Player } from "./Player";

/**
 * User domain model with relationship support
 * Uses Lean Domain Model pattern: relationships passed as parameters with validation
 */
export class User {
  public readonly id: Id<"users">;
  public readonly sessionId: SessionId;
  private _name: string;

  public constructor(
    id: Id<"users"> | null,
    sessionId: SessionId,
    name: string
  ) {
    this.id = id ?? ("" as Id<"users">);
    this.sessionId = sessionId;
    this._name = name;
  }

  /**
   * NOTE: To create a User from a database document, use the factory:
   * import { userFromDoc } from "./factory/user.factory";
   * const user = userFromDoc(doc);
   *
   * To create a new User instance, use:
   * import { createUser } from "./factory/user.factory";
   * const user = createUser(id, sessionId, name);
   */

  /**
   * Convert domain model back to database format
   */
  toDoc(): Partial<Doc<"users">> {
    return {
      name: this._name,
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
   * Change user's name
   * @param newName - The new name for the user
   */
  changeName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error("Name cannot be empty");
    }

    if (newName.length > 50) {
      throw new Error("Name cannot exceed 50 characters");
    }

    this._name = newName.trim();
  }

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
  // Getters
  // ========================================

  get name(): string {
    return this._name;
  }
}
