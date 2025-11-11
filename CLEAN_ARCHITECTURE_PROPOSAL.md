# Clean Architecture Refactoring Proposal

## Current Architecture Issues

### 1. **Business Logic in Repositories**
```typescript
// convex/repository/query/games.repository.ts
async isGameWon(id: Id<"games">, playerId: Id<"players">): Promise<boolean> {
    const bagTiles = await TilesQueryRepository.instance.findAllInBagByGame(id);
    if (bagTiles.length > 0) return false
    const playerTiles = await TilesQueryRepository.instance.findByPlayer(playerId)
    return playerTiles.length === 0;
}
```
❌ **Problem**: Game win logic belongs in domain/use case layer, not data access layer

### 2. **Orchestration Logic in Mutations**
```typescript
// convex/mutations/public/game.ts - 170 lines of orchestration
export const start = withSessionMutation({
  handler: async (ctx, { gameId }) => {
    // Authorization check
    // Status updates
    // Player ordering
    // Tile distribution
    // Multiple repository calls
  }
});
```
❌ **Problem**: Mutations should be thin adapters, not contain business logic

### 3. **Anemic Domain Models**
```typescript
// Current domain models are just type definitions
export interface Game {
    _id: string;
    token: string;
    status: string;
    // ... no behavior
}
```
❌ **Problem**: No encapsulation of business rules

---

## Proposed Options

### **Option 1: Use Cases Layer** (Recommended Starting Point)

**Effort**: Low-Medium | **Impact**: High | **Risk**: Low

Add a use cases layer between mutations and repositories without changing existing code structure significantly.

#### Structure
```
convex/
├── mutations/           # Thin adapters (validation, auth, delegation)
├── usecases/           # NEW: Business logic orchestration
│   ├── game/
│   │   ├── StartGame.usecase.ts
│   │   ├── EndTurn.usecase.ts
│   │   └── CreateGame.usecase.ts
│   └── tile/
│       └── MoveTile.usecase.ts
├── domain/
│   └── services/       # NEW: Business logic helpers
│       ├── GameRules.service.ts
│       └── ScoreCalculator.service.ts
├── repository/         # Keep as-is (data access only)
└── helpers/            # Keep as-is
```

#### Example Implementation

**Before** (`convex/mutations/public/game.ts`):
```typescript
export const start = withSessionMutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    // 50+ lines of business logic mixed with data access
    const game = await GamesQueryRepository.instance.find(gameId);
    if (!game) return;

    const players = await PlayersQueryRepository.instance.findByGame(game._id);
    const owner = players.filter((p) => p.owner);
    if (owner.length === 0 || owner[0].userId !== ctx.user._id) return;

    await GamesMutationRepository.instance.patch(game._id, {
      status: "ongoing",
      currentTurn: 1,
    });

    players.sort(() => Math.random() - 0.5);
    // ... 30 more lines
  },
});
```

**After** (Mutation - thin adapter):
```typescript
// convex/mutations/public/game.ts
import { StartGameUseCase } from "../../usecases/game/StartGame.usecase";

export const start = withSessionMutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    const useCase = new StartGameUseCase(ctx);
    await useCase.execute(gameId, ctx.user._id);
  },
});
```

**Use Case** (business logic):
```typescript
// convex/usecases/game/StartGame.usecase.ts
import { GamesQueryRepository } from "../../repository/query/games.repository";
import { PlayersQueryRepository } from "../../repository/query/players.repository";
import { GamesMutationRepository } from "../../repository/mutations/games.repository";
import { PlayersMutationRepository } from "../../repository/mutations/players.repository";
import { TileDistributionService } from "../../domain/services/TileDistribution.service";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export class StartGameUseCase {
  constructor(private ctx: MutationCtx) {}

  async execute(gameId: Id<"games">, userId: Id<"users">): Promise<void> {
    // 1. Validate game exists and user is owner
    const game = await GamesQueryRepository.instance.find(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const players = await PlayersQueryRepository.instance.findByGame(gameId);
    await this.validateUserIsOwner(players, userId);

    // 2. Update game status
    await GamesMutationRepository.instance.patch(gameId, {
      status: "ongoing",
      currentTurn: 1,
    });

    // 3. Randomize player order
    await this.assignPlayerOrder(players);

    // 4. Distribute initial tiles
    const tileDistribution = new TileDistributionService(this.ctx);
    await tileDistribution.distributeInitialTiles(game._id, players);
  }

  private async validateUserIsOwner(
    players: Doc<"players">[],
    userId: Id<"users">
  ): Promise<void> {
    const owner = players.find((p) => p.owner);
    if (!owner || owner.userId !== userId) {
      throw new Error("Only game owner can start the game");
    }
  }

  private async assignPlayerOrder(players: Doc<"players">[]): Promise<void> {
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffled.length; i++) {
      await PlayersMutationRepository.instance.patch(
        shuffled[i]._id as Id<"players">,
        {
          order: i + 1,
          current: i === 0,
        }
      );
    }
  }
}
```

**Domain Service** (reusable business logic):
```typescript
// convex/domain/services/TileDistribution.service.ts
import { internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";
import { TilesQueryRepository } from "../../repository/query/tiles.repository";

export class TileDistributionService {
  private readonly INITIAL_TILE_COUNT = 7;

  constructor(private ctx: MutationCtx) {}

  async distributeInitialTiles(
    gameId: Id<"games">,
    players: Doc<"players">[]
  ): Promise<void> {
    for (const player of players) {
      await this.dealTilesToPlayer(gameId, player._id as Id<"players">);
    }
  }

  async dealTilesToPlayer(
    gameId: Id<"games">,
    playerId: Id<"players">,
    count: number = this.INITIAL_TILE_COUNT
  ): Promise<void> {
    const availableTiles = await TilesQueryRepository.instance
      .findAllInBagByGame(gameId);

    const tilesToDeal = availableTiles
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    for (const tile of tilesToDeal) {
      await this.ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
        tileId: tile._id as Id<"tiles">,
        playerId,
      });
    }
  }

  async refillPlayerHand(
    gameId: Id<"games">,
    playerId: Id<"players">
  ): Promise<void> {
    const currentTiles = await TilesQueryRepository.instance.findByPlayer(playerId);
    const needed = this.INITIAL_TILE_COUNT - currentTiles.length;

    if (needed > 0) {
      await this.dealTilesToPlayer(gameId, playerId, needed);
    }
  }
}
```

**Move business logic out of repositories**:
```typescript
// convex/domain/services/GameRules.service.ts
import { TilesQueryRepository } from "../../repository/query/tiles.repository";
import { MovesQueryRepository } from "../../repository/query/moves.repository";
import { PlayersQueryRepository } from "../../repository/query/players.repository";
import type { Doc, Id } from "../../_generated/dataModel";

export class GameRulesService {
  async isGameWon(game: Doc<"games">, playerId: Id<"players">): Promise<boolean> {
    const bagTiles = await TilesQueryRepository.instance.findAllInBagByGame(game._id);
    if (bagTiles.length > 0) return false;

    const playerTiles = await TilesQueryRepository.instance.findByPlayer(playerId);
    return playerTiles.length === 0;
  }

  async isGameIdle(game: Doc<"games">): Promise<boolean> {
    const lastMoves = await MovesQueryRepository.instance.findLast(game);
    if (lastMoves.length === 0) return false;

    const lastMove = lastMoves[lastMoves.length - 1];
    const players = await PlayersQueryRepository.instance.findByGame(game._id);

    const idleThreshold = 2 * players.length; // 2 turns per player
    return lastMove.turn < game.currentTurn - idleThreshold;
  }
}
```

#### Pros
✅ Clear separation: mutations (adapters) → use cases (orchestration) → repositories (data)
✅ Testable business logic (use cases can be unit tested)
✅ Reusable services across multiple use cases
✅ Incremental migration (refactor one mutation at a time)
✅ Works well with Convex's function-based architecture

#### Cons
❌ Still some duplication between use cases
❌ Domain models remain anemic
❌ Doesn't enforce business rules at domain level

---

### **Option 2: Use Cases + Rich Domain Models** (Moderate)

**Effort**: Medium-High | **Impact**: Very High | **Risk**: Medium

Add use cases AND enrich domain models with business logic.

#### Structure
```
convex/
├── mutations/           # Thin adapters
├── usecases/           # Orchestration
├── domain/
│   ├── models/         # NEW: Rich domain models with behavior
│   │   ├── Game.ts
│   │   ├── Player.ts
│   │   ├── Tile.ts
│   │   └── Cell.ts
│   └── services/       # Complex business logic
└── repository/         # Data access (uses domain models)
```

#### Example Implementation

**Rich Domain Model**:
```typescript
// convex/domain/models/Game.ts
import type { Doc, Id } from "../../_generated/dataModel";
import type { Player } from "./Player";

export class Game {
  private constructor(
    public readonly id: Id<"games">,
    public readonly token: string,
    private _status: GameStatus,
    private _currentTurn: number,
    private winner?: Id<"players">
  ) {}

  static fromDoc(doc: Doc<"games">): Game {
    return new Game(
      doc._id,
      doc.token,
      doc.status as GameStatus,
      doc.currentTurn,
      doc.winner
    );
  }

  toDoc(): Partial<Doc<"games">> {
    return {
      status: this._status,
      currentTurn: this._currentTurn,
      winner: this.winner,
    };
  }

  // Business logic encapsulated
  start(): void {
    if (this._status !== "waiting") {
      throw new Error("Game cannot be started");
    }
    this._status = "ongoing";
    this._currentTurn = 1;
  }

  endWithWinner(winnerId: Id<"players">): void {
    if (this._status !== "ongoing") {
      throw new Error("Game is not ongoing");
    }
    this._status = "ended";
    this.winner = winnerId;
  }

  endAsIdle(): void {
    if (this._status !== "ongoing") {
      throw new Error("Game is not ongoing");
    }
    this._status = "ended";
  }

  nextTurn(): void {
    if (this._status !== "ongoing") {
      throw new Error("Cannot advance turn - game not ongoing");
    }
    this._currentTurn++;
  }

  canPlayerStart(player: Player): boolean {
    return this._status === "waiting" && player.isOwner();
  }

  isOngoing(): boolean {
    return this._status === "ongoing";
  }

  isWaiting(): boolean {
    return this._status === "waiting";
  }

  get status(): GameStatus {
    return this._status;
  }

  get currentTurn(): number {
    return this._currentTurn;
  }
}

type GameStatus = "waiting" | "ongoing" | "ended";
```

**Use Case with Rich Models**:
```typescript
// convex/usecases/game/StartGame.usecase.ts
import { Game } from "../../domain/models/Game";
import { Player } from "../../domain/models/Player";

export class StartGameUseCase {
  constructor(private ctx: MutationCtx) {}

  async execute(gameId: Id<"games">, userId: Id<"users">): Promise<void> {
    // 1. Load domain entities
    const gameDoc = await GamesQueryRepository.instance.find(gameId);
    if (!gameDoc) throw new Error("Game not found");

    const game = Game.fromDoc(gameDoc);

    const playerDocs = await PlayersQueryRepository.instance.findByGame(gameId);
    const players = playerDocs.map(Player.fromDoc);

    // 2. Business logic on domain models
    const owner = players.find(p => p.isOwner());
    if (!owner || !owner.isSameUser(userId)) {
      throw new Error("Only owner can start game");
    }

    if (!game.canPlayerStart(owner)) {
      throw new Error("Game cannot be started");
    }

    // 3. Execute domain logic
    game.start(); // Encapsulated validation + state change
    Player.assignRandomOrder(players); // Static domain method

    // 4. Persist changes
    await GamesMutationRepository.instance.patch(gameId, game.toDoc());

    for (const player of players) {
      await PlayersMutationRepository.instance.patch(
        player.id,
        player.toDoc()
      );
    }

    // 5. Tile distribution
    const tileService = new TileDistributionService(this.ctx);
    await tileService.distributeInitialTiles(gameId, playerDocs);
  }
}
```

#### Pros
✅ All benefits of Option 1
✅ Business rules enforced at domain level (can't accidentally violate)
✅ Self-documenting code (Game.start() vs manual status updates)
✅ Better testability (unit test domain models in isolation)
✅ Domain logic reusable across use cases

#### Cons
❌ More refactoring effort (need to create all domain models)
❌ Conversion overhead (Doc ↔ Domain Model)
❌ Need to maintain two representations (database Doc + domain class)
❌ Zod schemas need to coexist with domain models

---

### **Option 3: Full Clean Architecture** (Advanced)

**Effort**: High | **Impact**: Very High | **Risk**: High

Full Clean Architecture with all layers, domain events, and specifications pattern.

#### Structure
```
convex/
├── mutations/           # Infrastructure/Interface Adapters
├── usecases/           # Application Layer
│   ├── game/
│   └── ports/          # NEW: Interfaces for dependencies
│       └── IGameRepository.ts
├── domain/
│   ├── models/         # Rich domain entities
│   ├── services/       # Domain services
│   ├── events/         # NEW: Domain events
│   │   ├── GameStarted.event.ts
│   │   └── TurnEnded.event.ts
│   ├── specifications/ # NEW: Business rule validators
│   │   └── CanStartGameSpec.ts
│   └── valueobjects/   # NEW: Immutable value objects
│       ├── Score.ts
│       └── TileValue.ts
└── repository/         # Infrastructure (implements ports)
```

This option includes:
- **Dependency Inversion**: Use cases depend on port interfaces, not concrete repositories
- **Domain Events**: Track what happened for event sourcing/audit
- **Specifications Pattern**: Complex business rule validation
- **Value Objects**: Type-safe primitives (Score, Token, etc.)

#### Example
```typescript
// convex/usecases/ports/IGameRepository.ts
export interface IGameRepository {
  findById(id: GameId): Promise<Game | null>;
  save(game: Game): Promise<void>;
}

// convex/usecases/game/StartGame.usecase.ts
export class StartGameUseCase {
  constructor(
    private gameRepo: IGameRepository,  // Depends on interface
    private playerRepo: IPlayerRepository,
    private eventBus: IEventBus
  ) {}

  async execute(command: StartGameCommand): Promise<void> {
    const game = await this.gameRepo.findById(command.gameId);
    const players = await this.playerRepo.findByGame(command.gameId);

    // Specification pattern
    const canStart = new CanStartGameSpecification(command.userId);
    if (!canStart.isSatisfiedBy(game, players)) {
      throw new Error("Cannot start game");
    }

    // Domain logic
    game.start();
    players.assignRandomOrder();

    // Emit domain event
    this.eventBus.publish(new GameStartedEvent(game.id, Date.now()));

    // Persist
    await this.gameRepo.save(game);
    await this.playerRepo.saveAll(players);
  }
}
```

#### Pros
✅ Perfect separation of concerns
✅ Fully testable (mock all dependencies via interfaces)
✅ Domain completely isolated from infrastructure
✅ Event sourcing capabilities
✅ Scalable for large, complex domains

#### Cons
❌ Massive refactoring effort
❌ High complexity overhead for current scope
❌ Fights against Convex's patterns
❌ May be over-engineering for a game project

---

## Recommendation

**Start with Option 1: Use Cases Layer**

### Migration Strategy

**Phase 1** (Week 1-2): Set up infrastructure
1. Create `convex/usecases/` directory structure
2. Create `convex/domain/services/` directory
3. Move business logic from repositories to services
4. Document patterns

**Phase 2** (Week 3-4): Migrate high-value mutations
1. Refactor `game.start` → `StartGameUseCase`
2. Refactor `play.endTurn` → `EndTurnUseCase`
3. Refactor `game.create` → `CreateGameUseCase`
4. Extract `TileDistributionService`, `GameRulesService`, `ScoreCalculatorService`

**Phase 3** (Week 5-6): Complete migration
1. Migrate remaining mutations
2. Remove business logic from repositories
3. Add tests for use cases
4. Update CLAUDE.md

### Success Criteria
- ✅ Mutations are <20 lines (delegation only)
- ✅ No business logic in repositories
- ✅ Use cases have single responsibility
- ✅ Business logic is testable independently

---

## Future Evolution

After Option 1 is stable, consider:
- Add rich domain models for Game, Player (Option 2)
- Introduce domain events for audit trail
- Add specification pattern for complex validations

But don't commit to Option 3 unless the domain complexity truly demands it.
