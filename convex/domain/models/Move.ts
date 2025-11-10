import type { Doc, Id } from "../../_generated/dataModel";
import { Player } from "./Player";
import { Tile } from "./Tile";
import { Cell } from "./Cell";

export type MoveType = "PLAYER_TO_CELL" | "CELL_TO_PLAYER" | "BAG_TO_PLAYER" | "PLAYER_TO_BAG";

/**
 * Move domain model with relationship support
 * Uses Lean Domain Model pattern: relationships passed as parameters with validation
 */
export class Move {
  public readonly id: Id<"moves">;
  public readonly gameId: Id<"games">;
  public readonly type: MoveType;
  public readonly turn: number;
  public readonly moveScore: number;
  public readonly cellId: Id<"cells"> | null | undefined;
  public readonly tileId: Id<"tiles"> | null;
  public readonly playerId: Id<"players"> | null | undefined;

  public constructor(
    id: Id<"moves"> | null,
    gameId: Id<"games">,
    type: MoveType,
    turn: number,
    moveScore: number,
    cellId: Id<"cells"> | null | undefined,
    tileId: Id<"tiles"> | null,
    playerId: Id<"players"> | null | undefined
  ) {
    this.id = id ?? ("" as Id<"moves">);
    this.gameId = gameId;
    this.type = type;
    this.turn = turn;
    this.moveScore = moveScore;
    this.cellId = cellId;
    this.tileId = tileId;
    this.playerId = playerId;
  }

  /**
   * Create a Move domain model from a database document
   */
  static fromDoc(doc: Doc<"moves">): Move {
    return new Move(
      doc._id,
      doc.gameId,
      doc.type as MoveType,
      doc.turn,
      doc.moveScore,
      doc.cellId,
      doc.tileId,
      doc.playerId
    );
  }

  /**
   * Convert domain model back to database format
   */
  toDoc(): Partial<Doc<"moves">> {
    return {
      type: this.type,
      turn: this.turn,
      moveScore: this.moveScore,
      cellId: this.cellId,
      tileId: this.tileId,
      playerId: this.playerId,
    };
  }

  // ========================================
  // Relationship Validation Methods
  // ========================================

  // Note: Additional validation method (_validateBelongsToGame) can be added
  // here when needed for cross-game move operations

  /**
   * Validate that player belongs to the same game as the move
   * @throws Error if player doesn't belong to move's game
   */
  private validatePlayerBelongsToGame(player: Player): void {
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
  private validateTileBelongsToGame(tile: Tile): void {
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
  private validateCellBelongsToGame(cell: Cell): void {
    if (cell.gameId !== this.gameId) {
      throw new Error(
        `Cell ${cell.id} does not belong to game ${this.gameId}`
      );
    }
  }

  /**
   * Validate that move references match the provided entities
   * @throws Error if move references don't match entities
   */
  validateReferences(player?: Player, tile?: Tile, cell?: Cell): void {
    if (player) {
      this.validatePlayerBelongsToGame(player);
      if (this.playerId !== player.id) {
        throw new Error(
          `Move ${this.id} references player ${this.playerId} but received ${player.id}`
        );
      }
    }

    if (tile) {
      this.validateTileBelongsToGame(tile);
      if (this.tileId !== tile.id) {
        throw new Error(
          `Move ${this.id} references tile ${this.tileId} but received ${tile.id}`
        );
      }
    }

    if (cell) {
      this.validateCellBelongsToGame(cell);
      if (this.cellId !== cell.id) {
        throw new Error(
          `Move ${this.id} references cell ${this.cellId} but received ${cell.id}`
        );
      }
    }
  }

  // ========================================
  // Business Logic Methods
  // ========================================

  /**
   * Check if this is a player-to-cell move
   */
  isPlayerToCell(): boolean {
    return this.type === "PLAYER_TO_CELL";
  }

  /**
   * Check if this is a cell-to-player move (undo)
   */
  isCellToPlayer(): boolean {
    return this.type === "CELL_TO_PLAYER";
  }

  /**
   * Check if this is a bag-to-player move (draw tile)
   */
  isBagToPlayer(): boolean {
    return this.type === "BAG_TO_PLAYER";
  }

  /**
   * Check if this is a player-to-bag move (return tile)
   */
  isPlayerToBag(): boolean {
    return this.type === "PLAYER_TO_BAG";
  }

  /**
   * Check if this move can be cancelled/undone
   * BAG_TO_PLAYER moves cannot be undone (randomness)
   */
  isCancellable(): boolean {
    return this.type !== "BAG_TO_PLAYER";
  }

  /**
   * Check if move belongs to a specific turn
   */
  isFromTurn(turn: number): boolean {
    return this.turn === turn;
  }

  /**
   * Check if move has a player reference
   */
  hasPlayer(): boolean {
    return this.playerId !== null && this.playerId !== undefined;
  }

  /**
   * Check if move has a tile reference
   */
  hasTile(): boolean {
    return this.tileId !== null;
  }

  /**
   * Check if move has a cell reference
   */
  hasCell(): boolean {
    return this.cellId !== null && this.cellId !== undefined;
  }
}
