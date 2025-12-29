import type {Id} from "../../_generated/dataModel";
import {Player} from "./Player";

export type GameStatus = "waiting" | "ongoing" | "ended";

/**
 * Game domain model with relationship support
 * Uses Lean Domain Model pattern: relationships passed as parameters with validation
 */
export class Game {
    private readonly _id: Id<"games">;
    public readonly token: string;
    private _status: GameStatus;
    private _currentTurn: number;
    private _winner?: Id<"players">;

    public constructor(
        id: Id<"games">,
        token: string,
        status: GameStatus,
        currentTurn: number,
        winner?: Id<"players">
    ) {
        this._id = id;
        this.token = token;
        this._status = status;
        this._currentTurn = currentTurn;
        this._winner = winner;
    }

    /**
     * Get the game ID
     */
    get id(): Id<"games"> {
        return this._id;
    }

    static gameSize = () : number => 14

    // ========================================
    // Relationship Validation Methods
    // ========================================

    /**
     * Validate that all players belong to this game
     * @throws Error if any player doesn't belong to this game
     */
    private validatePlayersBelongToGame(players: Player[]): void {
        for (const player of players) {
            if (player.gameId !== this.id) {
                throw new Error(
                    `Player ${player.id} does not belong to game ${this.id}`
                );
            }
        }
    }

    /**
     * Validate that a single player belongs to this game
     * @throws Error if player doesn't belong to this game
     */
    private validatePlayerBelongsToGame(player: Player): void {
        if (player.gameId !== this.id) {
            throw new Error(
                `Player ${player.id} does not belong to game ${this.id}`
            );
        }
    }

    /**
     * Validate that a winner exists in the player list
     * @throws Error if winner is not found in players
     */
    private validateWinnerInPlayers(
        winnerId: Id<"players">,
        players: Player[]
    ): void {
        const winner = players.find(p => p.id === winnerId);
        if (!winner) {
            throw new Error(
                `Winner ${winnerId} not found in game ${this.id} players`
            );
        }
    }

    // ========================================
    // Business Logic Methods with Relationships
    // ========================================

    /**
     * Start the game
     * Requires players to validate and assign turn order
     * @param players - All players in the game
     * @throws Error if game cannot be started or players invalid
     */
    start(players: Player[]): void {
        // Validate relationship
        this.validatePlayersBelongToGame(players);

        // Validate game state
        if (this._status !== "waiting") {
            throw new Error("Can only start a game that is waiting");
        }

        // Validate business rules with relationships
        if (players.length < 2) {
            throw new Error("Need at least 2 players to start a game");
        }

        if (players.length > 4) {
            throw new Error("Maximum 4 players allowed");
        }

        // Update game state
        this._status = "ongoing";
        this._currentTurn = 1;

        // Update related entities (players are modified by reference)
        Player.assignRandomOrder(players);
    }

    /**
     * Increment the current turn
     */
    incrementTurn(): void {
        this._currentTurn++;
    }

    /**
     * Check if a specific player can start this game
     * @param player - The player attempting to start the game
     * @returns true if player is owner and game is waiting
     */
    canBeStartedBy(player: Player): boolean {
        this.validatePlayerBelongsToGame(player);
        return this._status === "waiting" && player.isOwner();
    }

    /**
     * End the game with a winner
     * @param winnerId - The ID of the winning player
     * @param players - All players to validate winner exists
     * @throws Error if game cannot be ended or winner invalid
     */
    endWithWinner(winnerId: Id<"players">, players?: Player[]): void {
        if (players) {
            // Validate relationships
            this.validatePlayersBelongToGame(players);
            this.validateWinnerInPlayers(winnerId, players);

            // Validate game state
            if (this._status !== "ongoing") {
                throw new Error("Can only end a game that is ongoing");
            }
        }

        // Update state
        this._status = "ended";
        this._winner = winnerId;
    }

    /**
     * End the game as idle (no activity)
     * @throws Error if game is not ongoing
     */
    endAsIdle(): void {
        if (this._status !== "ongoing") {
            throw new Error("Can only end a game that is ongoing");
        }
        this._status = "ended";
    }

    /**
     * Advance to next turn
     * @param currentPlayer - The current active player
     * @param nextPlayer - The next player to become active
     * @throws Error if game not ongoing or players invalid
     */
    nextTurn(currentPlayer: Player, nextPlayer: Player): void {
        // Validate relationships
        this.validatePlayerBelongsToGame(currentPlayer);
        this.validatePlayerBelongsToGame(nextPlayer);

        // Validate game state
        if (this._status !== "ongoing") {
            throw new Error("Cannot advance turn - game not ongoing");
        }

        // Validate business rule
        if (currentPlayer.id === nextPlayer.id) {
            throw new Error("Current and next player must be different");
        }

        if (!currentPlayer.isCurrent()) {
            throw new Error("Provided currentPlayer is not the active player");
        }

        // Update turn counter
        this._currentTurn++;

        // Update player states (modified by reference)
        currentPlayer.removeAsCurrent();
        nextPlayer.setAsCurrent();
    }

    /**
     * Check if it's a specific player's turn
     * @param player - The player to check
     * @returns true if game is ongoing and player is current
     */
    isPlayerTurn(player: Player): boolean {
        this.validatePlayerBelongsToGame(player);
        return this.isOngoing() && player.isCurrent();
    }

    // ========================================
    // State Check Methods
    // ========================================

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

    // ========================================
    // Getters
    // ========================================

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
