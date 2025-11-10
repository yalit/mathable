import type { Doc, Id } from "../../_generated/dataModel";
import { Tile } from "./Tile";

/**
 * Player domain model with relationship support
 * Uses Lean Domain Model pattern: relationships passed as parameters with validation
 */
export class Player {
  public readonly id: Id<"players">;
  public readonly gameId: Id<"games">;
  public readonly userId: Id<"users">;
  public readonly name: string;
  public readonly token: string;
  private _current: boolean;
  private _score: number;
  private _owner: boolean;
  private _order: number;

  private constructor(
    id: Id<"players">,
    gameId: Id<"games">,
    userId: Id<"users">,
    name: string,
    token: string,
    current: boolean,
    score: number,
    owner: boolean,
    order: number
  ) {
    this.id = id;
    this.gameId = gameId;
    this.userId = userId;
    this.name = name;
    this.token = token;
    this._current = current;
    this._score = score;
    this._owner = owner;
    this._order = order;
  }

  /**
   * Create a Player domain model from a database document
   */
  static fromDoc(doc: Doc<"players">): Player {
    return new Player(
      doc._id,
      doc.gameId,
      doc.userId,
      doc.name,
      doc.token,
      doc.current,
      doc.score,
      doc.owner,
      doc.order
    );
  }

  /**
   * Create a new Player instance for initial creation
   */
  static create(
    id: Id<"players">,
    gameId: Id<"games">,
    userId: Id<"users">,
    name: string,
    token: string,
    isOwner: boolean
  ): Player {
    return new Player(
      id,
      gameId,
      userId,
      name,
      token,
      false, // current
      0, // score
      isOwner,
      0 // order (not set yet)
    );
  }

  /**
   * Convert domain model back to database format
   */
  toDoc(): Partial<Doc<"players">> {
    return {
      current: this._current,
      score: this._score,
      owner: this._owner,
      order: this._order,
    };
  }

  // ========================================
  // Relationship Validation Methods
  // ========================================

  /**
   * Validate that all tiles belong to this player
   * @throws Error if any tile doesn't belong to this player
   */
  private validateTilesBelongToPlayer(tiles: Tile[]): void {
    for (const tile of tiles) {
      if (tile.playerId !== this.id) {
        throw new Error(
          `Tile ${tile.id} does not belong to player ${this.id}`
        );
      }
    }
  }

  /**
   * Validate that tiles belong to the same game as the player
   * @throws Error if any tile doesn't belong to player's game
   */
  private validateTilesBelongToGame(tiles: Tile[]): void {
    for (const tile of tiles) {
      if (tile.gameId !== this.gameId) {
        throw new Error(
          `Tile ${tile.id} does not belong to game ${this.gameId}`
        );
      }
    }
  }

  // ========================================
  // Business Logic Methods
  // ========================================

  /**
   * Set this player as the current player
   */
  setAsCurrent(): void {
    this._current = true;
  }

  /**
   * Remove current player status
   */
  removeAsCurrent(): void {
    this._current = false;
  }

  /**
   * Add points to player's score
   * @param points - Points to add (must be non-negative)
   * @throws Error if points is negative
   */
  addScore(points: number): void {
    if (points < 0) {
      throw new Error("Cannot add negative score");
    }
    this._score += points;
  }

  /**
   * Check if player has won (no tiles remaining in hand)
   * @param playerTiles - The tiles in player's hand
   * @returns true if player has no tiles
   */
  hasNoTilesRemaining(playerTiles: Tile[]): boolean {
    this.validateTilesBelongToPlayer(playerTiles);
    this.validateTilesBelongToGame(playerTiles);

    // Only count tiles that are in the player's hand
    const tilesInHand = playerTiles.filter(t => t.isInHand());
    return tilesInHand.length === 0;
  }

  /**
   * Get total hand value (sum of all tile values in hand)
   * @param playerTiles - The tiles in player's hand
   * @returns sum of tile values
   */
  getHandValue(playerTiles: Tile[]): number {
    this.validateTilesBelongToPlayer(playerTiles);
    this.validateTilesBelongToGame(playerTiles);

    return playerTiles
      .filter(t => t.isInHand())
      .reduce((sum, tile) => sum + tile.value, 0);
  }

  /**
   * Set the player's order in the game
   */
  setOrder(order: number): void {
    if (order < 1) {
      throw new Error("Order must be at least 1");
    }
    this._order = order;
  }

  /**
   * Check if this player is the game owner
   */
  isOwner(): boolean {
    return this._owner;
  }

  /**
   * Check if this player is currently active
   */
  isCurrent(): boolean {
    return this._current;
  }

  /**
   * Check if this player is the same user
   */
  isSameUser(userId: Id<"users">): boolean {
    return this.userId === userId;
  }

  /**
   * Assign random order to a list of players
   * Static method for player collection operations
   */
  static assignRandomOrder(players: Player[]): void {
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    shuffled.forEach((player, index) => {
      player.setOrder(index + 1);
      if (index === 0) {
        player.setAsCurrent();
      } else {
        player.removeAsCurrent();
      }
    });
  }

  // Getters
  get current(): boolean {
    return this._current;
  }

  get score(): number {
    return this._score;
  }

  get owner(): boolean {
    return this._owner;
  }

  get order(): number {
    return this._order;
  }
}
