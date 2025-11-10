import type { Doc, Id } from "../../_generated/dataModel";
import { Tile } from "./Tile";

export type CellType = "empty" | "value" | "multiplier" | "operator";
export type CellOperator = "+" | "-" | "*" | "/";

/**
 * Base Cell domain model with relationship support
 * Abstract base class for all cell types
 * Uses Lean Domain Model pattern: relationships passed as parameters with validation
 */
export abstract class Cell {
  public readonly id: Id<"cells">;
  public readonly gameId: Id<"games">;
  public readonly row: number;
  public readonly column: number;
  public abstract readonly type: CellType;
  protected _allowedValues: number[];
  protected _tileId: Id<"tiles"> | null;

  protected constructor(
    id: Id<"cells"> | null,
    gameId: Id<"games">,
    row: number,
    column: number,
    allowedValues: number[],
    tileId: Id<"tiles"> | null
  ) {
    this.id = id ?? ("" as Id<"cells">);
    this.gameId = gameId;
    this.row = row;
    this.column = column;
    this._allowedValues = allowedValues;
    this._tileId = tileId;
  }

  /**
   * Convert domain model back to database format
   * Abstract method - each subclass provides its own implementation
   */
  abstract toDoc(): Partial<Doc<"cells">>;

  /**
   * NOTE: To create a Cell from a database document, use the factory:
   * import { cellFromDoc } from "./factory/cell.factory";
   * const cell = cellFromDoc(doc);
   */

  /**
   * Get the numeric value of this cell
   * Abstract method - each subclass implements based on its type
   */
  abstract getNumericValue(tile?: Tile): number | null;

  // ========================================
  // Relationship Validation Methods
  // ========================================

  // Note: Additional validation method (_validateBelongsToGame) can be added
  // here when needed for cross-game cell operations

  /**
   * Validate that tile belongs to the same game as the cell
   * @throws Error if tile doesn't belong to cell's game
   */
  private validateTileBelongsToGame(tile: Tile): void {
    if (tile.gameId !== this.gameId) {
      throw new Error(
        `Tile ${tile.id} does not belong to game ${this.gameId}`
      );
    }
  }

  /**
   * Validate that a tile is placed on this cell
   * @throws Error if tile is not on this cell
   */
  protected validateTileIsOnCell(tile: Tile): void {
    if (tile.cellId !== this.id) {
      throw new Error(`Tile ${tile.id} is not on cell ${this.id}`);
    }
  }

  // ========================================
  // Business Logic Methods
  // ========================================

  /**
   * Place a tile on this cell
   * @param tile - The tile to place
   * @throws Error if cell already has a tile or tile doesn't belong to game
   */
  placeTile(tile: Tile): void {
    this.validateTileBelongsToGame(tile);

    if (this._tileId !== null) {
      throw new Error(`Cell ${this.id} already has a tile`);
    }

    if (this.type !== "empty") {
      throw new Error(
        `Cannot place tile on ${this.type} cell at (${this.row}, ${this.column})`
      );
    }

    this._tileId = tile.id;
  }

  /**
   * Remove tile from this cell
   * @param tile - The tile to remove (for validation)
   * @throws Error if no tile on cell or wrong tile
   */
  removeTile(tile: Tile): void {
    this.validateTileBelongsToGame(tile);
    this.validateTileIsOnCell(tile);

    if (this._tileId === null) {
      throw new Error(`Cell ${this.id} has no tile to remove`);
    }

    this._tileId = null;
  }

  /**
   * Check if a value is allowed on this cell
   * @param value - The value to check
   * @returns true if value is allowed
   */
  isValueAllowed(value: number): boolean {
    return this._allowedValues.includes(value);
  }

  /**
   * Set the allowed values for this cell
   * @param allowedValues - Array of allowed values
   */
  setAllowedValues(allowedValues: number[]): void {
    this._allowedValues = allowedValues;
  }

  /**
   * Check if cell has a tile
   */
  hasTile(): boolean {
    return this._tileId !== null;
  }

  /**
   * Check if cell is empty (no tile, no fixed value)
   */
  isEmpty(): boolean {
    return this.type === "empty" && this._tileId === null;
  }

  /**
   * Check if cell is an operator cell
   */
  isOperator(): boolean {
    return this.type === "operator";
  }

  /**
   * Check if cell is a multiplier cell
   */
  isMultiplier(): boolean {
    return this.type === "multiplier";
  }


  // ========================================
  // Getters
  // ========================================

  get allowedValues(): readonly number[] {
    return this._allowedValues;
  }

  get tileId(): Id<"tiles"> | null {
    return this._tileId;
  }

  // ========================================
  // Type Guards
  // ========================================

  /**
   * Check if cell is an EmptyCell
   */
  isEmptyCell(): this is EmptyCell {
    return this.type === "empty";
  }

  /**
   * Check if cell is a ValueCell
   */
  isValueCell(): this is ValueCell {
    return this.type === "value";
  }

  /**
   * Check if cell is a MultiplierCell
   */
  isMultiplierCell(): this is MultiplierCell {
    return this.type === "multiplier";
  }

  /**
   * Check if cell is an OperatorCell
   */
  isOperatorCell(): this is OperatorCell {
    return this.type === "operator";
  }
}

// ========================================
// Specialized Cell Classes
// ========================================

/**
 * EmptyCell - A cell that can hold a tile
 */
export class EmptyCell extends Cell {
  public readonly type: CellType = "empty";

  public constructor(
    id: Id<"cells"> | null,
    gameId: Id<"games">,
    row: number,
    column: number,
    allowedValues: number[],
    tileId: Id<"tiles"> | null
  ) {
    super(id, gameId, row, column, allowedValues, tileId);
  }

  toDoc(): Partial<Doc<"cells">> {
    return {
      type: this.type,
      value: null,
      multiplier: null,
      operator: null,
      allowedValues: this._allowedValues,
      tileId: this._tileId,
    };
  }

  getNumericValue(tile?: Tile): number | null {
    if (tile && this._tileId === tile.id) {
      this.validateTileIsOnCell(tile);
      return tile.value;
    }
    return null;
  }
}

/**
 * ValueCell - A cell with a fixed numeric value
 */
export class ValueCell extends Cell {
  public readonly type: CellType = "value";
  public readonly value: number;

  public constructor(
    id: Id<"cells"> | null,
    gameId: Id<"games">,
    row: number,
    column: number,
    value: number,
    allowedValues: number[]
  ) {
    super(id, gameId, row, column, allowedValues, null); // Value cells never have tiles
    this.value = value;
  }

  toDoc(): Partial<Doc<"cells">> {
    return {
      type: this.type,
      value: this.value,
      multiplier: null,
      operator: null,
      allowedValues: this._allowedValues,
      tileId: null,
    };
  }

  getNumericValue(): number {
    return this.value;
  }

  /**
   * Value cells cannot have tiles placed on them
   * @throws Error always - value cells are fixed
   */
  placeTile(_tile: Tile): void {
    throw new Error(
      `Cannot place tile on value cell at (${this.row}, ${this.column})`
    );
  }
}

/**
 * MultiplierCell - A cell that multiplies the score
 */
export class MultiplierCell extends Cell {
  public readonly type: CellType = "multiplier";
  public readonly multiplier: number;

  public constructor(
    id: Id<"cells"> | null,
    gameId: Id<"games">,
    row: number,
    column: number,
    multiplier: number,
    allowedValues: number[],
    tileId: Id<"tiles"> | null
  ) {
    super(id, gameId, row, column, allowedValues, tileId);
    if (multiplier <= 0) {
      throw new Error("Multiplier must be positive");
    }
    this.multiplier = multiplier;
  }

  toDoc(): Partial<Doc<"cells">> {
    return {
      type: this.type,
      value: null,
      multiplier: this.multiplier,
      operator: null,
      allowedValues: this._allowedValues,
      tileId: this._tileId,
    };
  }

  getNumericValue(tile?: Tile): number | null {
    if (tile && this._tileId === tile.id) {
      this.validateTileIsOnCell(tile);
      return tile.value;
    }
    return null;
  }

  /**
   * Get the score multiplier for this cell
   */
  getMultiplier(): number {
    return this.multiplier;
  }
}

/**
 * OperatorCell - A cell with a mathematical operator
 */
export class OperatorCell extends Cell {
  public readonly type: CellType = "operator";
  public readonly operator: CellOperator;

  public constructor(
    id: Id<"cells"> | null,
    gameId: Id<"games">,
    row: number,
    column: number,
    operator: CellOperator,
    allowedValues: number[],
    tileId: Id<"tiles"> | null
  ) {
    super(id, gameId, row, column, allowedValues, tileId);
    this.operator = operator;
  }

  toDoc(): Partial<Doc<"cells">> {
    return {
      type: this.type,
      value: null,
      multiplier: null,
      operator: this.operator,
      allowedValues: this._allowedValues,
      tileId: this._tileId,
    };
  }

  getNumericValue(tile?: Tile): number | null {
    if (tile && this._tileId === tile.id) {
      this.validateTileIsOnCell(tile);
      return tile.value;
    }
    return null;
  }

  /**
   * Get the operator for this cell
   */
  getOperator(): CellOperator {
    return this.operator;
  }

  /**
   * Apply the operator to two operands
   */
  applyOperator(left: number, right: number): number {
    switch (this.operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        if (right === 0) {
          throw new Error("Division by zero");
        }
        return left / right;
      default:
        throw new Error(`Unknown operator: ${this.operator}`);
    }
  }
}
