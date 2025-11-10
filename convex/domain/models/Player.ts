import type { Doc, Id } from "../../_generated/dataModel";

/**
 * Player domain model
 * Encapsulates player state and business rules
 */
export class Player {
  private constructor(
    public readonly id: Id<"players">,
    public readonly gameId: Id<"games">,
    public readonly userId: Id<"users">,
    public readonly name: string,
    public readonly token: string,
    private _current: boolean,
    private _score: number,
    private _owner: boolean,
    private _order: number
  ) {}

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
   */
  addScore(points: number): void {
    if (points < 0) {
      throw new Error("Cannot add negative score");
    }
    this._score += points;
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
