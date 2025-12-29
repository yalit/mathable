# Backend Architecture Documentation

This document describes the architectural patterns, design principles, and conventions used in the Mathable Convex backend.

## Table of Contents
- [Overview](#overview)
- [Core Principles](#core-principles)
- [Layer Architecture](#layer-architecture)
- [Domain Model Pattern](#domain-model-pattern)
- [Repository Pattern](#repository-pattern)
- [Use Case Pattern](#use-case-pattern)
- [Controller/API Layer](#controllerapi-layer)
- [Error Handling Strategy](#error-handling-strategy)
- [Type System Conventions](#type-system-conventions)
- [Directory Structure](#directory-structure)

---

## Overview

The backend follows **Clean Architecture** principles with clear separation of concerns across layers. The architecture enforces:
- **Domain-driven design** for business logic
- **Dependency inversion** for testability
- **Type safety** throughout the stack
- **Immutability** for domain models
- **Exception-based** error handling

---

## Core Principles

### 1. **Single Responsibility Principle**
Each layer has one clear responsibility:
- **Controllers**: Adapt use case results to API format
- **Use Cases**: Orchestrate business operations
- **Domain Models**: Encode business rules
- **Repositories**: Abstract data access

### 2. **Dependency Inversion**
```typescript
// Use cases depend on abstractions, not concrete implementations
class StartGameUseCase {
    private get gamesMutation(): GamesMutationRepositoryInterface {
        return this.ctx.container.get("GamesMutationRepositoryInterface");
    }
}
```

### 3. **Fail-Fast**
Validation errors are thrown immediately, not wrapped in result objects:
```typescript
if (!game.isWaiting()) {
    throw new Error("Game has already started");
}
```

### 4. **Type Safety**
End-to-end type safety from database to client:
- Domain models: TypeScript classes
- Repositories: Typed interfaces
- Controllers: Convex validators
- API: Inferred types from validators

---

## Layer Architecture

```
┌─────────────────────────────────────────┐
│         Controllers (API Layer)         │  ← Thin adapters
│  - Validate input with Convex schemas  │
│  - Convert errors to API format         │
│  - Return APIReturn<T> responses        │
└──────────────┬──────────────────────────┘
               │ calls
┌──────────────▼──────────────────────────┐
│           Use Cases Layer               │  ← Orchestration
│  - Business workflow orchestration      │
│  - Throw errors on validation failure   │
│  - Return specific data types           │
└──────────────┬──────────────────────────┘
               │ uses
┌──────────────▼──────────────────────────┐
│          Domain Layer                   │  ← Business logic
│  - Models: Immutable entities           │
│  - Services: Stateless domain logic     │
│  - Factories: Object construction       │
└──────────────┬──────────────────────────┘
               │ persisted by
┌──────────────▼──────────────────────────┐
│        Repository Layer                 │  ← Data access
│  - Query repos: Read operations         │
│  - Mutation repos: Write operations     │
│  - Return domain models (not DTOs)      │
└─────────────────────────────────────────┘
```

---

## Domain Model Pattern

### Immutability & Encapsulation

Domain models are **immutable** with **truly readonly IDs**:

```typescript
export class Player {
    private readonly _id: Id<"players">;  // Private backing field
    public readonly gameId: Id<"games">;
    private _score: number;                // Mutable internal state

    constructor(
        id: Id<"players">,                 // ID required at construction
        gameId: Id<"games">,
        score: number
    ) {
        this._id = id;
        this.gameId = gameId;
        this._score = score;
    }

    // Public getter for read-only access
    get id(): Id<"players"> {
        return this._id;
    }

    // Business logic methods
    addScore(points: number): void {
        if (points < 0) {
            throw new Error("Cannot add negative score");
        }
        this._score += points;
    }

    // Convert to database format
    toDoc(): DocData<"players"> {
        return {
            gameId: this.gameId,
            score: this._score
        };
    }
}
```

### Key Rules:
- ✅ **ID is private**: External code cannot modify it
- ✅ **No null IDs**: All entities have IDs at construction
- ✅ **Encapsulated state**: Use methods to modify internal state
- ✅ **Validation in methods**: Throw errors for invalid operations
- ✅ **No setters**: Use domain-meaningful methods instead

### Domain Model Types

#### **1. Entities**
Classes with identity (ID):
- `Game`, `Player`, `User`, `Tile`, `Cell`, `Move`

#### **2. Value Objects** (if needed)
Immutable objects without identity:
```typescript
class Score {
    constructor(readonly value: number) {
        if (value < 0) throw new Error("Score cannot be negative");
    }
}
```

#### **3. Aggregates**
Entity clusters with a root (e.g., `Game` + `Player[]` + `Cell[]` + `Tile[]`)

---

## Repository Pattern

### Interface Design

```typescript
export interface MutationRepositoryInterface<DomainModel, TableName extends TableNames> {
    delete(entity: DomainModel): Promise<void>;
    save(entity: DomainModel): Promise<DomainModel>;
}
```

### Implementation Pattern

```typescript
export class PlayersMutationRepository implements PlayersMutationRepositoryInterface {
    private db: GenericDatabaseWriter<DataModel>;

    // Factory method for new entities
    async new(data: DocData<"players">): Promise<Player> {
        const id = await this.db.insert("players", data);
        return playerFromDoc({...data, _id: id, _creationTime: 0});
    }

    // Domain-specific convenience factory
    async newFromName(game: Game, user: User, name: string): Promise<Player> {
        return this.new({
            gameId: game.id,
            userId: user.id,
            name: name,
            token: UUID(),
            current: false,
            score: 0,
            order: 0
        });
    }

    // Update existing entities
    async save(player: Player): Promise<Player> {
        const docData = player.toDoc();
        await this.db.patch(player.id, docData);
        return player;
    }

    // Delete by entity (not ID)
    async delete(player: Player): Promise<void> {
        await this.db.delete(player.id);
    }
}
```

### Key Patterns:

#### **A. Creation vs Update**
```typescript
// NEW entities → use new() factory methods
const player = await playersMutation.new({...});

// EXISTING entities → use save()
player.addScore(10);
await playersMutation.save(player);
```

#### **B. Return Domain Models**
```typescript
// ✅ GOOD: Returns domain model
async save(player: Player): Promise<Player>

// ❌ BAD: Returns ID (old pattern)
async save(player: Player): Promise<Id<"players">>
```

#### **C. Domain-Specific Factories**
Add convenience methods for common creation patterns:
```typescript
interface MovesMutationRepositoryInterface {
    newPlayerToCell(game: Game, tile: Tile, player: Player, cell: Cell, score: number): Promise<PlayerToCellMove>
    newBagToPlayer(game: Game, tile: Tile, player: Player): Promise<BagToPlayerMove>
}
```

---

## Use Case Pattern

### Structure

Use cases orchestrate business operations and **throw errors** on validation failure:

```typescript
export class JoinGameUseCase {
    private readonly ctx: AppMutationCtx;

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
    }

    // Get repositories from DI container
    private get playersQuery(): PlayersQueryRepositoryInterface {
        return this.ctx.container.get("PlayersQueryRepositoryInterface");
    }

    private get playersMutation(): PlayersMutationRepositoryInterface {
        return this.ctx.container.get("PlayersMutationRepositoryInterface");
    }

    // Execute business operation
    async execute(
        game: Game,
        user: User,
        playerName: string,
    ): Promise<{playerToken: string}> {
        // 1. Validate business rules (throw on failure)
        if (!game.isWaiting()) {
            throw new Error("Game has already started");
        }

        // 2. Load related data
        const players = await this.playersQuery.findByGame(game);

        // 3. More validation
        if (players.length >= 4) {
            throw new Error("Game is full (maximum 4 players)");
        }

        // 4. Execute business logic
        const player = await this.playersMutation.newFromName(game, user, playerName);

        // 5. Return specific data (not success/error wrapper)
        return {playerToken: player.token};
    }
}
```

### Return Type Patterns

```typescript
// Void for operations with no return data
async execute(...): Promise<void>

// Specific data object for operations that return data
async execute(...): Promise<{playerToken: string}>

// Domain model for operations that create/modify entities
async execute(...): Promise<Player>
```

### Error Handling Rules

✅ **DO:**
- Throw `Error` for validation failures
- Throw `Error` for business rule violations
- Return specific data on success
- Use meaningful error messages

❌ **DON'T:**
- Return `{success: boolean, error?: string}` result objects
- Catch errors inside use cases
- Return null/undefined on errors
- Use generic error messages

---

## Controller/API Layer

### APIReturn Pattern

Generic type for consistent API responses:

```typescript
// Extracted validators for reusability
const APIReturnError: Validator<any, any, any> = v.object({
    status: v.literal("error"),
    data: v.string()
});

const APIReturnSuccess = <T extends Validator<any, any, any>>(dataValidator: T) => {
    return v.object({
        status: v.literal("success"),
        data: dataValidator
    });
};

// Main APIReturn validator factory
export const APIReturn = <T extends Validator<any, any, any>>(dataValidator: T) => {
    return v.union(APIReturnError, APIReturnSuccess(dataValidator));
};

// Helper functions for consistent response creation
export const APIError = (message: string): Infer<typeof APIReturnError> => {
    return {
        status: "error",
        data: message
    }
}

export const APISuccess = <T>(data: T) => {
    return {
        status: "success" as const,
        data
    }
}
```

### Controller Implementation

Controllers use `APISuccess` and `APIError` helpers for consistent responses:

```typescript
// 1. Define return validator
const createGameReturn = APIReturn(v.object({
    gameToken: v.string(),
    playerToken: v.string(),
}));

// 2. Create mutation with typed handler
export const create = appMutation({
    visibility: "public",
    security: "public",
    args: {playerName: v.string(), ...SessionArgs},
    returns: createGameReturn,
    handler: async (ctx, args): Promise<Infer<typeof createGameReturn>> => {
        try {
            // 3. Call use case (can throw)
            const useCase = new CreateGameUseCase(ctx);
            const data = await useCase.execute(args.playerName, args.sessionId);

            // 4. Return success response using helper
            return APISuccess(data);
        } catch (e: any) {
            // 5. Catch errors and convert to API format using helper
            return APIError(e.message);
        }
    },
});
```

**Key Benefits of Helper Functions:**
- ✅ **DRY principle** - No duplicate object creation code
- ✅ **Type safety** - Helpers ensure correct response structure
- ✅ **Consistency** - All controllers use the same pattern
- ✅ **Maintainability** - Changes to response format in one place

### Return Value Examples

```typescript
// Success with data - using helper
const data = {gameToken: "abc", playerToken: "xyz"};
return APISuccess(data);
// → {status: "success", data: {gameToken: "abc", playerToken: "xyz"}}

// Success with no data (void operation) - using helper
return APISuccess(null);
// → {status: "success", data: null}

// Error - using helper
return APIError("Game has already started");
// → {status: "error", data: "Game has already started"}
```

### Early Return Validation Examples

Controllers should validate entities exist before calling use cases:

```typescript
handler: async (ctx, args): Promise<Infer<typeof returnValidator>> => {
    // Fetch required entities
    const game = await gamesQuery.find(args.gameId);
    if (!game) return APIError("No Game found");

    const player = await playersQuery.find(args.playerId);
    if (!player) return APIError("Player not found");

    if (!ctx.user) return APIError("User not authenticated");

    // Now call use case with entities
    try {
        const useCase = new PlaceTileUseCase(ctx);
        await useCase.execute(tile, cell, player, ctx.user);
        return APISuccess(null);
    } catch (e: any) {
        return APIError(e.message);
    }
}
```

### Controller Responsibilities

Controllers are **thin adapters** that:
1. ✅ Validate input arguments (Convex validators)
2. ✅ Fetch required entities from repositories
3. ✅ Validate entities exist (return `APIError()` if not found)
4. ✅ Call use case with domain entities
5. ✅ Catch exceptions and convert using `APIError(e.message)`
6. ✅ Return success using `APISuccess(data)`

Controllers should **NOT**:
- ❌ Contain business logic
- ❌ Directly access the database
- ❌ Throw errors to the client
- ❌ Perform complex data transformations
- ❌ Manually create `{status, data}` objects (use helpers instead)

---

## Error Handling Strategy

### Exception-Based Flow

```
Use Case Layer          Controller Layer         Client
──────────────          ────────────────         ──────
Validation fails   →    try {                    Receives:
throw Error("...")        useCase.execute()      {
                        } catch (e) {              status: "error",
                          return {                 data: "error message"
                            status: "error",     }
                            data: e.message
                          }
                        }

Success            →    return {                 Receives:
return data               status: "success",     {
                          data                     status: "success",
                        }                          data: {...}
                                                 }
```

### Error Message Guidelines

✅ **Good error messages:**
```typescript
throw new Error("Game has already started");
throw new Error("Game is full (maximum 4 players)");
throw new Error("Only the game owner can start the game");
```

❌ **Bad error messages:**
```typescript
throw new Error("Invalid");
throw new Error("Error");
throw new Error("Failed");
```

---

## Type System Conventions

### Helper Types

```typescript
// Data for insertion (omits Convex metadata)
type DocData<TableName> = Omit<Doc<TableName>, "_id" | "_creationTime">

// Infer type from validator
const validator = APIReturn(v.object({...}));
type ReturnType = Infer<typeof validator>;
```

### Validator Patterns

```typescript
// Import for type inference
import {v, type Infer} from "convex/values";

// Define validator
const myValidator = v.object({
    id: v.string(),
    count: v.number()
});

// Use in mutation
export const myMutation = mutation({
    args: {input: myValidator},
    returns: myValidator,
    handler: async (ctx, args): Promise<Infer<typeof myValidator>> => {
        // TypeScript knows the exact return type
        return {id: "123", count: 42};
    }
});
```

### Domain Model Type Conversions

```typescript
// Domain model → Database
const docData: DocData<"players"> = player.toDoc();
await db.insert("players", docData);

// Database → Domain model
const doc: Doc<"players"> = await db.get(playerId);
const player: Player = playerFromDoc(doc);
```

---

## Directory Structure

```
convex/
├── controllers/                  # API Layer (thin adapters)
│   ├── game/
│   │   ├── mutations.ts         # Game mutations (create, join, start)
│   │   └── queries.ts           # Game queries
│   ├── player/
│   │   └── queries.ts
│   ├── tile/
│   │   └── queries.ts
│   └── return.type.ts           # Shared APIReturn helper
│
├── usecases/                    # Application Layer (orchestration)
│   ├── game/
│   │   ├── CreateGame.usecase.ts
│   │   ├── JoinGame.usecase.ts
│   │   └── StartGame.usecase.ts
│   ├── play/
│   │   ├── EndTurn.usecase.ts
│   │   └── ResetTurn.usecase.ts
│   └── tile/
│       ├── PlaceTile.usecase.ts
│       └── PickTile.usecase.ts
│
├── domain/                      # Domain Layer (business logic)
│   ├── models/                  # Domain entities
│   │   ├── Cell.ts             # Abstract + 4 subclasses
│   │   ├── Game.ts
│   │   ├── Player.ts
│   │   ├── Tile.ts
│   │   ├── User.ts
│   │   ├── Move.ts             # Abstract + 4 subclasses
│   │   └── factory/            # Entity factories
│   │       ├── cell.factory.ts
│   │       ├── game.factory.ts
│   │       └── ...
│   │
│   └── services/               # Domain services (stateless)
│       ├── Cell/
│       │   └── CellValueComputation.service.ts
│       ├── Game/
│       │   └── EndGame.service.ts
│       ├── Play/
│       │   ├── Score.service.ts
│       │   └── Turn.service.ts
│       └── Tile/
│           ├── TileDistribution.service.ts
│           └── TileMove.service.ts
│
├── repository/                 # Data Access Layer
│   ├── query/                  # Read repositories
│   │   ├── games.repository.ts
│   │   ├── players.repository.ts
│   │   └── ...
│   ├── mutations/              # Write repositories
│   │   ├── games.repository.ts
│   │   ├── players.repository.ts
│   │   └── ...
│   └── repositories.interface.ts
│
├── middleware/                 # Cross-cutting concerns
│   ├── app.middleware.ts      # Main middleware
│   └── repository.middleware.ts
│
├── schema.ts                   # Database schema
└── services.config.ts          # DI container configuration
```

### File Naming Conventions

- **Controllers**: `{entity}/mutations.ts`, `{entity}/queries.ts`
- **Use Cases**: `{Operation}.usecase.ts` (PascalCase operation)
- **Domain Models**: `{Entity}.ts` (PascalCase, singular)
- **Repositories**: `{entities}.repository.ts` (lowercase plural)
- **Services**: `{Service}.service.ts` (PascalCase)

---

## Best Practices Summary

### ✅ DO

1. **Keep controllers thin** - just adapt use case results to API format
2. **Use helper functions** - `APISuccess()` and `APIError()` in all controllers
3. **Use cases throw errors** - don't wrap in result objects
4. **Return domain models from repositories** - not IDs or raw documents
5. **Make domain model IDs truly readonly** - private field + public getter
6. **Use factory methods for creation** - `repository.new()` pattern
7. **Validate in domain models** - throw errors in business methods
8. **Validate entities in controllers** - return `APIError()` if not found
9. **Use meaningful error messages** - help debugging
10. **Type everything** - leverage TypeScript fully
11. **Use dependency injection** - access repositories via container

### ❌ DON'T

1. **Don't put business logic in controllers** - keep them thin
2. **Don't manually create response objects** - use `APISuccess()`/`APIError()` helpers
3. **Don't return result objects from use cases** - throw errors instead
4. **Don't make IDs nullable** - require at construction
5. **Don't bypass repositories** - always use repository layer
6. **Don't catch errors in use cases** - let them bubble to controllers
7. **Don't use generic error messages** - be specific
8. **Don't mix layers** - respect dependency direction
9. **Don't use setters in domain models** - use domain methods

---

## Migration Guide

When refactoring existing code to follow these patterns:

### 1. **Update Domain Models**
```typescript
// Old
public readonly id: Id<"players"> | null;

// New
private readonly _id: Id<"players">;
get id(): Id<"players"> { return this._id; }
```

### 2. **Update Repositories**
```typescript
// Old
async save(player: Player): Promise<Id<"players">>

// New
async new(data: DocData<"players">): Promise<Player>
async save(player: Player): Promise<Player>
```

### 3. **Update Use Cases**
```typescript
// Old
async execute(...): Promise<{success: boolean, error?: string}>

// New
async execute(...): Promise<void> // or specific return type
// Throw errors instead of returning {success: false}
```

### 4. **Update Controllers**
```typescript
// Old - no error handling
handler: async (ctx, args) => {
    return await useCase.execute(...);
}

// New - with helper functions
handler: async (ctx, args): Promise<Infer<typeof returnValidator>> => {
    // Validate entities exist
    const entity = await repository.find(args.id);
    if (!entity) return APIError("Entity not found");

    try {
        const data = await useCase.execute(...);
        return APISuccess(data);
    } catch (e: any) {
        return APIError(e.message);
    }
}
```

### 5. **Import Helper Functions**
```typescript
// Add to controller imports
import { APIReturn, APIError, APISuccess } from "../return.type";
```

---

## Conclusion

This architecture provides:
- ✅ **Clear separation of concerns** - each layer has one job
- ✅ **Type safety** - from database to client
- ✅ **Testability** - dependency injection enables testing
- ✅ **Maintainability** - consistent patterns across codebase
- ✅ **Scalability** - easy to add new features following patterns

Follow these patterns for all new code and gradually migrate legacy code during feature development.
