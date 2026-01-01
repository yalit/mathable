import type { Doc, Id } from "../../_generated/dataModel";
import type {Player} from "./Player.ts";
import type {Cell} from "./Cell.ts";

export type TileLocation = "in_bag" | "in_hand" | "on_board";

/**
 * Tile domain model with relationship support
 * Uses Lean Domain Model pattern: relationships passed as parameters with validation
 */
export class Tile {
  private readonly _id: Id<"tiles">;
  public readonly gameId: Id<"games">;
  public readonly value: number;
  public _playerId: Id<"players"> | null;
  public _cellId: Id<"cells"> | null;
  private _location: TileLocation;

  public constructor(
    id: Id<"tiles">,
    gameId: Id<"games">,
    value: number,
    location: TileLocation,
    playerId: Id<"players"> | null,
    cellId: Id<"cells"> | null
  ) {
    this._id = id;
    this.gameId = gameId;
    this.value = value;
    this._location = location;
    this._playerId = playerId;
    this._cellId = cellId;
  }

  /**
   * Get the tile ID
   */
  get id(): Id<"tiles"> {
    return this._id;
  }

  /**
   * NOTE: To create a Tile from a database document, use the factory:
   * import { tileFromDoc } from "./factory/tile.factory";
   * const tile = tileFromDoc(doc);
   */

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
  private validateBelongsToPlayer(player: Player): void {
    if (this._playerId !== player.id) {
      throw new Error(
        `Tile ${this.id} does not belong to player ${player.id}`
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
   * @param cell - The cell to place the tile on
   * @param player - The player moving the tile (for validation)
   * @throws Error if tile doesn't belong to the player or is in invalid state
   *
   * Handles two scenarios:
   * 1. Placing from player's hand (tile location is "in_hand")
   * 2. Displacing from another cell (tile location is "on_board")
   */
  moveToCell(cell: Cell, player: Player): void {
    // Validate based on current location
    if (this._location === "in_hand") {
      // Tile is being placed from player's hand - validate ownership
      this.validateBelongsToPlayer(player);
    } else if (this._location === "on_board") {
      // Tile is being displaced from another cell - no ownership validation needed
      // (displacement validation happens at use case level)
    } else if (this._location === "in_bag") {
      throw new Error(`Cannot move tile ${this.id} from bag directly to board`);
    }

    this._location = "on_board";
    this._cellId = cell.id;
    this._playerId = null;
  }

  /**
   * Move tile back to bag
   * @throws Error if tile is already in bag
   *
   * Handles tiles from:
   * 1. Board/cell (current implementation)
   * 2. Player's hand (future support for returning tiles)
   */
  moveToBag(): void {
    if (this._location === "in_bag") {
      throw new Error(`Tile ${this.id} is already in the bag`);
    }

    // Tile can come from "on_board" or "in_hand" - both are valid
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
  belongsToPlayer(player:Player): boolean {
    return this._playerId === player.id;
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

  // ========================================
  // Serialization
  // ========================================

  /**
   * Convert to plain object for Convex serialization
   */
  toJSON() {
    return {
      id: this._id,
      gameId: this.gameId,
      value: this.value,
      location: this._location,
      playerId: this._playerId,
      cellId: this._cellId,
    };
  }
}
