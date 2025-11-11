# Domain Model Relationships Guide

This document explains how to handle relationships between domain models in Clean Architecture with Convex.

## The Pattern: Lean Domain Models with Explicit Relationships

We use **Option 2** from the Clean Architecture proposal: Domain models don't store relationships internally, but accept them as method parameters.

## Core Principle

```typescript
// ❌ Don't do this (tight coupling, always loads everything)
class Game {
  private players: Player[];
  start() {
    if (this.players.length < 2) throw Error();
  }
}

// ✅ Do this (explicit dependencies, load only what you need)
class Game {
  start(players: Player[]) {
    if (players.length < 2) throw Error();
  }
}
```

## The Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USE CASE: Load what you need                             │
│                                                              │
│  const game = await loadGame(id);                           │
│  const players = await loadPlayers(gameId);                 │
│  const tiles = await loadTiles(gameId);                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. DOMAIN MODELS: Convert to domain objects                 │
│                                                              │
│  const gameModel = Game.fromDoc(game);                      │
│  const playerModels = players.map(Player.fromDoc);          │
│  const tileModels = tiles.map(Tile.fromDoc);                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. BUSINESS LOGIC: Pass relationships as parameters         │
│                                                              │
│  gameModel.start(playerModels);                             │
│  gameModel.nextTurn(currentPlayer, nextPlayer);             │
│  gameModel.isWon(playerId, bagTiles, playerTiles);          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PERSIST: Save modified entities                          │
│                                                              │
│  await GameRepo.patch(id, gameModel.toDoc());               │
│  for (p of playerModels) {                                  │
│    await PlayerRepo.patch(p.id, p.toDoc());                 │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Examples

### Example 1: Game.start() with Players

```typescript
// convex/domain/models/Game.ts
export class Game {
  /**
   * Start the game
   * Requires players to validate and assign order
   */
  start(players: Player[]): void {
    // Business rule: validate game state
    if (this._status !== "waiting") {
      throw new Error("Can only start a game that is waiting");
    }

    // Business rule: validate relationships
    if (players.length < 2) {
      throw new Error("Need at least 2 players");
    }

    // Modify game state
    this._status = "ongoing";
    this._currentTurn = 1;

    // Modify related entities
    Player.assignRandomOrder(players);
  }
}

// convex/usecases/game/StartGame.usecase.ts
export class StartGameUseCase {
  async execute(gameId: Id<"games">, userId: Id<"users">): Promise<void> {
    // Load
    const gameDoc = await GamesQueryRepository.instance.find(gameId);
    const playerDocs = await PlayersQueryRepository.instance.findByGame(gameId);

    // Convert to domain models
    const game = Game.fromDoc(gameDoc);
    const players = playerDocs.map(Player.fromDoc);

    // Business logic with relationships
    const owner = players.find(p => p.isOwner());
    if (!game.canBeStartedBy(owner)) {
      throw new Error("Cannot start");
    }

    game.start(players); // <-- Pass relationships

    // Persist both game and players (both were modified)
    await GamesMutationRepository.instance.patch(gameId, game.toDoc());
    for (const player of players) {
      await PlayersMutationRepository.instance.patch(player.id, player.toDoc());
    }
  }
}
```

### Example 2: Game.nextTurn() with Current/Next Player

```typescript
// convex/domain/models/Game.ts
export class Game {
  /**
   * Advance to next turn
   * Requires current and next player to update both
   */
  nextTurn(currentPlayer: Player, nextPlayer: Player): void {
    if (!this.isOngoing()) {
      throw new Error("Game not ongoing");
    }

    if (currentPlayer.id === nextPlayer.id) {
      throw new Error("Must be different players");
    }

    this._currentTurn++;

    // Modify related entities
    currentPlayer.removeAsCurrent();
    nextPlayer.setAsCurrent();
  }
}

// convex/usecases/play/EndTurn.usecase.ts
export class EndTurnUseCase {
  async execute(gameId: Id<"games">, userId: Id<"users">): Promise<void> {
    // Load
    const game = Game.fromDoc(await loadGame(gameId));
    const players = (await loadPlayers(gameId)).map(Player.fromDoc);

    // Find relationships
    const currentPlayer = players.find(p => p.isCurrent());
    const nextPlayer = players[(players.indexOf(currentPlayer) + 1) % players.length];

    // Business logic
    game.nextTurn(currentPlayer, nextPlayer); // <-- Pass both players

    // Persist all modified entities
    await saveGame(game);
    await savePlayer(currentPlayer);
    await savePlayer(nextPlayer);
  }
}
```

### Example 3: Game.isWon() with Tiles

```typescript
// convex/domain/models/Game.ts
export class Game {
  /**
   * Check if game is won
   * Requires tile information to make decision
   */
  isWon(playerId: Id<"players">, bagTiles: Tile[], playerTiles: Tile[]): boolean {
    if (!this.isOngoing()) return false;

    // Business rule: no tiles in bag AND player has no tiles
    return bagTiles.length === 0 && playerTiles.length === 0;
  }
}

// convex/usecases/play/EndTurn.usecase.ts
export class EndTurnUseCase {
  async execute(gameId: Id<"games">, userId: Id<"users">): Promise<void> {
    const game = Game.fromDoc(await loadGame(gameId));
    const currentPlayer = Player.fromDoc(await loadCurrentPlayer(gameId));

    // Load tiles only when needed for win check
    const bagTiles = (await loadBagTiles(gameId)).map(Tile.fromDoc);
    const playerTiles = (await loadPlayerTiles(currentPlayer.id)).map(Tile.fromDoc);

    // Check win condition
    if (game.isWon(currentPlayer.id, bagTiles, playerTiles)) {
      game.endWithWinner(currentPlayer.id);
    }

    await saveGame(game);
  }
}
```

## Benefits of This Approach

### 1. **Performance**
Only load what you need for each operation:
```typescript
// Just checking game status? Load only game
const game = await loadGame(id);
if (game.isOngoing()) { /* ... */ }

// Starting game? Load game + players
const game = await loadGame(id);
const players = await loadPlayers(gameId);
game.start(players);

// Checking win? Load game + tiles
const game = await loadGame(id);
const tiles = await loadTiles(gameId);
if (game.isWon(tiles)) { /* ... */ }
```

### 2. **Clear Dependencies**
Easy to see what data each operation needs:
```typescript
// Method signature shows exactly what's needed
start(players: Player[]): void
nextTurn(currentPlayer: Player, nextPlayer: Player): void
isWon(playerId: Id, bagTiles: Tile[], playerTiles: Tile[]): boolean
```

### 3. **Testability**
Easy to mock relationships in tests:
```typescript
test("game start requires 2+ players", () => {
  const game = Game.create(id, "token");
  const onePlayer = [Player.create(...)];

  expect(() => game.start(onePlayer)).toThrow();
});
```

### 4. **Convex-Friendly**
Works naturally with Convex's table-based storage:
```typescript
// Load from separate tables
const game = await ctx.db.get(gameId);
const players = await ctx.db.query("players").filter(...)

// Convert to models
const gameModel = Game.fromDoc(game);
const playerModels = players.map(Player.fromDoc);

// Business logic
gameModel.start(playerModels);

// Save to separate tables
await ctx.db.patch(gameId, gameModel.toDoc());
for (const p of playerModels) {
  await ctx.db.patch(p.id, p.toDoc());
}
```

## When to Load Relationships

### Use Case Level (Recommended)
```typescript
// ✅ Load everything the use case needs upfront
async execute(gameId: Id<"games">): Promise<void> {
  const game = await loadGame(gameId);
  const players = await loadPlayers(gameId);
  const tiles = await loadTiles(gameId);

  // All business logic operations have what they need
  game.start(players);
  // ... more operations
}
```

### On-Demand (When Needed)
```typescript
// ✅ Load only when specific condition met
async execute(gameId: Id<"games">): Promise<void> {
  const game = await loadGame(gameId);

  if (game.needsValidation()) {
    // Only load players if validation needed
    const players = await loadPlayers(gameId);
    game.validate(players);
  }
}
```

### Not in Domain Model
```typescript
// ❌ Don't do this - domain models shouldn't fetch data
class Game {
  async start() {
    const players = await this.loadPlayers(); // NO!
  }
}
```

## Files to Reference

- **Enhanced Game Model**: `convex/domain/models/Game.enhanced.ts`
- **Tile Model**: `convex/domain/models/Tile.ts`
- **Player Model**: `convex/domain/models/Player.ts`
- **Use Case Examples**: `convex/usecases/game/StartGame.usecase.example.ts`

## Migration Path

To update your existing models:

1. ✅ Keep current structure (id, token, status, etc.)
2. ✅ Add methods that need relationships as parameters:
   ```typescript
   start(players: Player[]): void
   ```
3. ✅ Update use cases to load and pass relationships
4. ✅ Remove any async methods from domain models
5. ✅ Move data fetching to use case layer

You don't need to rewrite everything - just adopt this pattern for new methods or when refactoring existing ones.
