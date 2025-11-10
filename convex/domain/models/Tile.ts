import type { Doc, Id } from "../../_generated/dataModel";

export type TileLocation = "in_bag" | "in_hand" | "on_board";

/**
 * Tile domain model with relationship support
 * Uses Lean Domain Model pattern: relationships passed as parameters with validation
 */
export class Tile {
  public readonly id: Id<"tiles">;
  public readonly gameId: Id<"games">;
  public readonly value: number;
  private _location: TileLocation;
  private _playerId: Id<"players"> | null;
  private _cellId: Id<"cells"> | null;

  private constructor(
    id: Id<"tiles">,
    gameId: Id<"games">,
    value: number,
    location: TileLocation,
    playerId: Id<"players"> | null,
    cellId: Id<"cells"> | null
  ) {
    this.id = id;
    this.gameId = gameId;
    this.value = value;
    this._location = location;
    this._playerId = playerId;
    this._cellId = cellId;
  }

  /**
   * Create a Tile domain model from a database document
   */
  static fromDoc(doc: Doc<"tiles">): Tile {
    return new Tile(
      doc._id,
      doc.gameId,
      doc.value,
      doc.location as TileLocation,
      doc.playerId,
      doc.cellId
    );
  }

  /**
   * Convert domain model back to database format
   */
  toDoc(): Partial<Doc<"tiles">> {
    return {
      location: this._location,
      playerId: this._playerId,
      cellId: this._cellId,
    };
  }

  // ========================================
  // Relationship Validation Methods
  // ========================================

  /**
   * Validate that tile belongs to a specific player
   * @throws Error if tile doesn't belong to the player
   */
  private validateBelongsToPlayer(playerId: Id<"players">): void {
    if (this._playerId !== playerId) {
      throw new Error(
        `Tile ${this.id} does not belong to player ${playerId}`
      );
    }
  }

  // Note: Additional validation methods (_validateIsOnCell, _validateBelongsToGame)
  // can be added here when needed for cell-related operations

  // ========================================
  // Business Logic Methods
  // ========================================

  /**
   * Move tile to a player's hand
   * @param playerId - The player to move the tile to
   * @throws Error if tile is already in a hand (must be in bag or on board)
   */
  moveToPlayer(playerId: Id<"players">): void {
    if (this._location === "in_hand" && this._playerId !== playerId) {
      throw new Error(
        `Tile ${this.id} is already in another player's hand`
      );
    }

    this._location = "in_hand";
    this._playerId = playerId;
    this._cellId = null;
  }

  /**
   * Move tile to a cell on the board
   * @param cellId - The cell to place the tile on
   * @param playerId - The player moving the tile (for validation)
   * @throws Error if tile doesn't belong to the player
   */
  moveToCell(cellId: Id<"cells">, playerId: Id<"players">): void {
    // Validate the tile belongs to the player moving it
    if (this._location === "in_hand") {
      this.validateBelongsToPlayer(playerId);
    }

    this._location = "on_board";
    this._cellId = cellId;
    this._playerId = null;
  }

  /**
   * Move tile back to bag
   * @throws Error if tile is not on board or in hand
   */
  moveToBag(): void {
    if (this._location === "in_bag") {
      throw new Error(`Tile ${this.id} is already in the bag`);
    }

    this._location = "in_bag";
    this._playerId = null;
    this._cellId = null;
  }

  /**
   * Check if tile is in bag
   */
  isInBag(): boolean {
    return this._location === "in_bag";
  }

  /**
   * Check if tile is in a player's hand
   */
  isInHand(): boolean {
    return this._location === "in_hand";
  }

  /**
   * Check if tile is on the board
   */
  isOnBoard(): boolean {
    return this._location === "on_board";
  }

  /**
   * Check if tile belongs to a specific player
   */
  belongsToPlayer(playerId: Id<"players">): boolean {
    return this._playerId === playerId;
  }

  // Getters
  get location(): TileLocation {
    return this._location;
  }

  get playerId(): Id<"players"> | null {
    return this._playerId;
  }

  get cellId(): Id<"cells"> | null {
    return this._cellId;
  }
}
