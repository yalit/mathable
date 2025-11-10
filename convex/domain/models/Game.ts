import type { Doc, Id } from "../../_generated/dataModel";

export type GameStatus = "waiting" | "ongoing" | "ended";

/**
 * Game domain model
 * Encapsulates game state and business rules
 */
export class Game {
  public readonly id: Id<"games">;
  public readonly token: string;
  private _status: GameStatus;
  private _currentTurn: number;
  private _winner?: Id<"players">;

  private constructor(
    id: Id<"games">,
    token: string,
    status: GameStatus,
    currentTurn: number,
    winner?: Id<"players">
  ) {
    this.id = id;
    this.token = token;
    this._status = status;
    this._currentTurn = currentTurn;
    this._winner = winner;
  }

  /**
   * Create a Game domain model from a database document
   */
  static fromDoc(doc: Doc<"games">): Game {
    return new Game(
      doc._id,
      doc.token,
      doc.status as GameStatus,
      doc.currentTurn,
      doc.winner
    );
  }

  /**
   * Create a new Game instance for initial creation
   */
  static create(id: Id<"games">, token: string): Game {
    return new Game(id, token, "waiting", 0);
  }

  /**
   * Convert domain model back to database format
   */
  toDoc(): Partial<Doc<"games">> {
    return {
      status: this._status,
      currentTurn: this._currentTurn,
      winner: this._winner,
    };
  }

  /**
   * Start the game
   * Validates that game can be started and updates state
   */
  start(): void {
    if (this._status !== "waiting") {
      throw new Error("Can only start a game that is waiting");
    }
    this._status = "ongoing";
    this._currentTurn = 1;
  }

  /**
   * End the game with a winner
   */
  endWithWinner(winnerId: Id<"players">): void {
    if (this._status !== "ongoing") {
      throw new Error("Can only end a game that is ongoing");
    }
    this._status = "ended";
    this._winner = winnerId;
  }

  /**
   * End the game as idle (no activity)
   */
  endAsIdle(): void {
    if (this._status !== "ongoing") {
      throw new Error("Can only end a game that is ongoing");
    }
    this._status = "ended";
  }

  /**
   * Advance to next turn
   */
  nextTurn(): void {
    if (this._status !== "ongoing") {
      throw new Error("Cannot advance turn - game not ongoing");
    }
    this._currentTurn++;
  }

  /**
   * Check if game is in waiting state
   */
  isWaiting(): boolean {
    return this._status === "waiting";
  }

  /**
   * Check if game is ongoing
   */
  isOngoing(): boolean {
    return this._status === "ongoing";
  }

  /**
   * Check if game has ended
   */
  isEnded(): boolean {
    return this._status === "ended";
  }

  // Getters
  get status(): GameStatus {
    return this._status;
  }

  get currentTurn(): number {
    return this._currentTurn;
  }

  get winner(): Id<"players"> | undefined {
    return this._winner;
  }
}
