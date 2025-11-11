import type { Doc, Id } from "../../_generated/dataModel";
import { Player } from "./Player";
import { Tile } from "./Tile";
import { Cell } from "./Cell";

export type MoveType = "PLAYER_TO_CELL" | "CELL_TO_PLAYER" | "BAG_TO_PLAYER" | "PLAYER_TO_BAG";

/**
 * Base Move domain model with relationship support
 * Abstract base class for all move types
 * Uses Lean Domain Model pattern: relationships passed as parameters with validation
 */
export abstract class Move {
  public readonly id: Id<"moves"> | null;
  public readonly gameId: Id<"games">;
  public abstract readonly type: MoveType;
  public readonly turn: number;
  public readonly tileId: Id<"tiles"> | null;

  protected constructor(
    id: Id<"moves"> | null,
    gameId: Id<"games">,
    turn: number,
    tileId: Id<"tiles"> | null
  ) {
    this.id = id;
    this.gameId = gameId;
    this.turn = turn;
    this.tileId = tileId;
  }

  /**
   * Convert domain model back to database format
   * Abstract method - each subclass provides its own implementation
   */
  abstract toDoc(): Partial<Doc<"moves">>;

  /**
   * NOTE: To create a Move from a database document, use the factory:
   * import { moveFromDoc } from "./factory/move.factory";
   * const move = moveFromDoc(doc);
   */

  /**
   * Check if this move can be cancelled/undone
   * Abstract method - each move type defines its own cancellability
   */
  abstract isCancellable(): boolean;

  // ========================================
  // Relationship Validation Methods
  // ========================================

  /**
   * Validate that player belongs to the same game as the move
   * @throws Error if player doesn't belong to move's game
   */
  protected validatePlayerBelongsToGame(player: Player): void {
    if (player.gameId !== this.gameId) {
      throw new Error(
        `Player ${player.id} does not belong to game ${this.gameId}`
      );
    }
  }

  /**
   * Validate that tile belongs to the same game as the move
   * @throws Error if tile doesn't belong to move's game
   */
  protected validateTileBelongsToGame(tile: Tile): void {
    if (tile.gameId !== this.gameId) {
      throw new Error(
        `Tile ${tile.id} does not belong to game ${this.gameId}`
      );
    }
  }

  /**
   * Validate that cell belongs to the same game as the move
   * @throws Error if cell doesn't belong to move's game
   */
  protected validateCellBelongsToGame(cell: Cell): void {
    if (cell.gameId !== this.gameId) {
      throw new Error(
        `Cell ${cell.id} does not belong to game ${this.gameId}`
      );
    }
  }

  // ========================================
  // Business Logic Methods
  // ========================================

  /**
   * Check if move belongs to a specific turn
   */
  isFromTurn(turn: number): boolean {
    return this.turn === turn;
  }

  /**
   * Check if move has a tile reference
   */
  hasTile(): boolean {
    return this.tileId !== null;
  }

  // ========================================
  // Type Guards
  // ========================================

  /**
   * Check if this is a PlayerToCellMove
   */
  isPlayerToCell(): this is PlayerToCellMove {
    return this.type === "PLAYER_TO_CELL";
  }

  /**
   * Check if this is a CellToPlayerMove
   */
  isCellToPlayer(): this is CellToPlayerMove {
    return this.type === "CELL_TO_PLAYER";
  }

  /**
   * Check if this is a BagToPlayerMove
   */
  isBagToPlayer(): this is BagToPlayerMove {
    return this.type === "BAG_TO_PLAYER";
  }

  /**
   * Check if this is a PlayerToBagMove
   */
  isPlayerToBag(): this is PlayerToBagMove {
    return this.type === "PLAYER_TO_BAG";
  }
}

// ========================================
// Specialized Move Classes
// ========================================

/**
 * PlayerToCellMove - Player placing a tile from hand to board cell
 */
export class PlayerToCellMove extends Move {
  public readonly type: MoveType = "PLAYER_TO_CELL";
  public readonly playerId: Id<"players">;
  public readonly cellId: Id<"cells">;
  public readonly moveScore: number;

  public constructor(
    id: Id<"moves"> | null,
    gameId: Id<"games">,
    turn: number,
    tileId: Id<"tiles">,
    playerId: Id<"players">,
    cellId: Id<"cells">,
    moveScore: number
  ) {
    super(id, gameId, turn, tileId);
    this.playerId = playerId;
    this.cellId = cellId;
    this.moveScore = moveScore;
  }

  toDoc(): Partial<Doc<"moves">> {
    return {
      type: this.type,
      turn: this.turn,
      tileId: this.tileId,
      playerId: this.playerId,
      cellId: this.cellId,
      moveScore: this.moveScore,
    };
  }

  /**
   * Player-to-cell moves are cancellable (can be undone)
   */
  isCancellable(): boolean {
    return true;
  }

  /**
   * Validate that move references match the provided entities
   */
  validateReferences(player: Player, tile: Tile, cell: Cell): void {
    this.validatePlayerBelongsToGame(player);
    this.validateTileBelongsToGame(tile);
    this.validateCellBelongsToGame(cell);

    if (this.playerId !== player.id) {
      throw new Error(
        `Move ${this.id} references player ${this.playerId} but received ${player.id}`
      );
    }

    if (this.tileId !== tile.id) {
      throw new Error(
        `Move ${this.id} references tile ${this.tileId} but received ${tile.id}`
      );
    }

    if (this.cellId !== cell.id) {
      throw new Error(
        `Move ${this.id} references cell ${this.cellId} but received ${cell.id}`
      );
    }
  }
}

/**
 * BagToPlayerMove - Drawing a random tile from bag to player's hand
 */
export class BagToPlayerMove extends Move {
  public readonly type: MoveType = "BAG_TO_PLAYER";
  public readonly playerId: Id<"players">;
  public readonly moveScore: number = 0; // No score for picking tiles

  public constructor(
    id: Id<"moves"> | null,
    gameId: Id<"games">,
    turn: number,
    tileId: Id<"tiles">,
    playerId: Id<"players">
  ) {
    super(id, gameId, turn, tileId);
    this.playerId = playerId;
  }

  toDoc(): Partial<Doc<"moves">> {
    return {
      type: this.type,
      turn: this.turn,
      tileId: this.tileId,
      playerId: this.playerId,
      cellId: null,
      moveScore: this.moveScore,
    };
  }

  /**
   * Bag-to-player moves are NOT cancellable (randomness cannot be undone)
   */
  isCancellable(): boolean {
    return false;
  }

  /**
   * Validate that move references match the provided entities
   */
  validateReferences(player: Player, tile: Tile): void {
    this.validatePlayerBelongsToGame(player);
    this.validateTileBelongsToGame(tile);

    if (this.playerId !== player.id) {
      throw new Error(
        `Move ${this.id} references player ${this.playerId} but received ${player.id}`
      );
    }

    if (this.tileId !== tile.id) {
      throw new Error(
        `Move ${this.id} references tile ${this.tileId} but received ${tile.id}`
      );
    }
  }
}

/**
 * CellToPlayerMove - Cancelling a tile placement (undo move)
 */
export class CellToPlayerMove extends Move {
  public readonly type: MoveType = "CELL_TO_PLAYER";
  public readonly playerId: Id<"players">;
  public readonly cellId: Id<"cells">;
  public readonly moveScore: number;

  public constructor(
    id: Id<"moves"> | null,
    gameId: Id<"games">,
    turn: number,
    tileId: Id<"tiles">,
    playerId: Id<"players">,
    cellId: Id<"cells">,
    moveScore: number // Negative of original placement score
  ) {
    super(id, gameId, turn, tileId);
    this.playerId = playerId;
    this.cellId = cellId;
    this.moveScore = moveScore;
  }

  toDoc(): Partial<Doc<"moves">> {
    return {
      type: this.type,
      turn: this.turn,
      tileId: this.tileId,
      playerId: this.playerId,
      cellId: this.cellId,
      moveScore: this.moveScore,
    };
  }

  /**
   * Cell-to-player moves represent cancellations, so they're not themselves cancellable
   */
  isCancellable(): boolean {
    return false;
  }

  /**
   * Validate that move references match the provided entities
   */
  validateReferences(player: Player, tile: Tile, cell: Cell): void {
    this.validatePlayerBelongsToGame(player);
    this.validateTileBelongsToGame(tile);
    this.validateCellBelongsToGame(cell);

    if (this.playerId !== player.id) {
      throw new Error(
        `Move ${this.id} references player ${this.playerId} but received ${player.id}`
      );
    }

    if (this.tileId !== tile.id) {
      throw new Error(
        `Move ${this.id} references tile ${this.tileId} but received ${tile.id}`
      );
    }

    if (this.cellId !== cell.id) {
      throw new Error(
        `Move ${this.id} references cell ${this.cellId} but received ${cell.id}`
      );
    }
  }
}

/**
 * PlayerToBagMove - Returning a tile from player's hand to bag (rare operation)
 */
export class PlayerToBagMove extends Move {
  public readonly type: MoveType = "PLAYER_TO_BAG";
  public readonly playerId: Id<"players">;
  public readonly moveScore: number = 0; // No score for returning tiles

  public constructor(
    id: Id<"moves"> | null,
    gameId: Id<"games">,
    turn: number,
    tileId: Id<"tiles">,
    playerId: Id<"players">
  ) {
    super(id, gameId, turn, tileId);
    this.playerId = playerId;
  }

  toDoc(): Partial<Doc<"moves">> {
    return {
      type: this.type,
      turn: this.turn,
      tileId: this.tileId,
      playerId: this.playerId,
      cellId: null,
      moveScore: this.moveScore,
    };
  }

  /**
   * Player-to-bag moves are cancellable
   */
  isCancellable(): boolean {
    return true;
  }

  /**
   * Validate that move references match the provided entities
   */
  validateReferences(player: Player, tile: Tile): void {
    this.validatePlayerBelongsToGame(player);
    this.validateTileBelongsToGame(tile);

    if (this.playerId !== player.id) {
      throw new Error(
        `Move ${this.id} references player ${this.playerId} but received ${player.id}`
      );
    }

    if (this.tileId !== tile.id) {
      throw new Error(
        `Move ${this.id} references tile ${this.tileId} but received ${tile.id}`
      );
    }
  }
}
