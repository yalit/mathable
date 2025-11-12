# Dependency Injection Container

This directory contains the dependency injection (DI) container implementation for the Mathable backend.

## Overview

The DI container provides:
- **Generic `get<T>()` method** for type-safe service resolution
- **Configuration-based** service loading from `convex/services.config.json`
- **Interface-based** dependency injection
- **Request-scoped** lifecycle (not singleton)
- **Easy testing** with mock implementations

## Core Files

- `ServiceContainer.ts` - Main DI container with generic `get<T>()` method
- `ServiceRegistry.ts` - Registry for mapping interfaces to implementations
- `ServiceConfiguration.ts` - Configuration loader
- `ContainerFactory.ts` - Factory functions for creating containers
- `../services.config.json` - **Production configuration** (loaded by default)
- `config.example.json` - Configuration format reference
- `config.test.example.json` - Test configuration example with mocks

## Configuration

### Production Configuration

The production configuration is located at `convex/services.config.json` and is automatically loaded when you call `createContainer(ctx)` without arguments.

**convex/services.config.json:**
```json
{
  "query": {
    "PlayersQueryRepositoryInterface": "PlayersQueryRepository",
    "GamesQueryRepositoryInterface": "GamesQueryRepository",
    ...
  },
  "mutation": {
    "PlayersMutationRepositoryInterface": "PlayersMutationRepository",
    "GamesMutationRepositoryInterface": "GamesMutationRepository",
    ...
  }
}
```

This file maps interface names to their implementation class names. The configuration is loaded once at startup and cached for the lifetime of the process.

## Usage

### Production Usage

```typescript
import { createContainer } from "./infrastructure/ContainerFactory";
import { SERVICE_IDENTIFIERS } from "./infrastructure/ServiceRegistry";

// In a Convex mutation
export const endTurn = mutation({
  handler: async (ctx, args) => {
    // Automatically loads from convex/services.config.json
    const container = createContainer(ctx);

    // Get services using SERVICE_IDENTIFIERS
    const gamesRepo = container.get(SERVICE_IDENTIFIERS.GamesQuery);
    const playersRepo = container.get(SERVICE_IDENTIFIERS.PlayersQuery);

    const game = await gamesRepo.find(args.gameId);
    const player = await playersRepo.findCurrentPlayer(args.gameId);

    // ... rest of logic
  }
});
```

### Testing with Mock Implementations

```typescript
import { createContainer } from "./infrastructure/ContainerFactory";
import { SERVICE_IDENTIFIERS } from "./infrastructure/ServiceRegistry";

// Create test configuration
const testConfig = {
  query: {
    [SERVICE_IDENTIFIERS.GamesQuery]: "MockGamesQueryRepository",
    [SERVICE_IDENTIFIERS.PlayersQuery]: "MockPlayersQueryRepository",
  },
  mutation: {
    [SERVICE_IDENTIFIERS.GamesMutation]: "MockGamesMutationRepository",
  }
};

// Create container with test config
const container = createContainer(ctx, testConfig);

// Services will be mocked
const gamesRepo = container.get(SERVICE_IDENTIFIERS.GamesQuery);
// gamesRepo is now MockGamesQueryRepository
```

### Loading Configuration from File

By default, `createContainer(ctx)` loads from `convex/services.config.json`. You can also load from a custom file:

```typescript
import { loadServiceConfigurationFromJSON } from "./infrastructure/ServiceConfiguration";
import { createContainerWithRegistry } from "./infrastructure/ContainerFactory";
import { readFileSync } from "fs";
import { join } from "path";

// Load config from custom file
const configPath = join(__dirname, "./config.test.json");
const configJson = readFileSync(configPath, "utf-8");
const registry = loadServiceConfigurationFromJSON(configJson);

// Create container with loaded config
const container = createContainerWithRegistry(ctx, registry);
```

## Service Identifiers

Use the `SERVICE_IDENTIFIERS` constants for type-safe service resolution:

```typescript
import { SERVICE_IDENTIFIERS } from "./infrastructure/ServiceRegistry";

// Query Repositories
SERVICE_IDENTIFIERS.PlayersQuery
SERVICE_IDENTIFIERS.GamesQuery
SERVICE_IDENTIFIERS.TilesQuery
SERVICE_IDENTIFIERS.MovesQuery
SERVICE_IDENTIFIERS.CellsQuery
SERVICE_IDENTIFIERS.UsersQuery

// Mutation Repositories
SERVICE_IDENTIFIERS.PlayersMutation
SERVICE_IDENTIFIERS.GamesMutation
SERVICE_IDENTIFIERS.TilesMutation
SERVICE_IDENTIFIERS.MovesMutation
SERVICE_IDENTIFIERS.CellsMutation
SERVICE_IDENTIFIERS.UsersMutation
```

## Configuration Format

Configuration files (JSON) map interface names to implementation class names:

```json
{
  "query": {
    "GamesQueryRepositoryInterface": "GamesQueryRepository"
  },
  "mutation": {
    "GamesMutationRepositoryInterface": "GamesMutationRepository"
  }
}
```

**Important:** All implementation classes referenced in the configuration must be registered in the `IMPLEMENTATION_REGISTRY` in `ServiceConfiguration.ts`.

## Creating Mock Implementations

To create mock implementations for testing:

1. Create mock repository classes that implement the same interfaces:

```typescript
// Example: MockGamesQueryRepository.ts
import type { GamesQueryRepositoryInterface } from "./repository/query/games.repository";
import type { Doc, Id } from "./_generated/dataModel";

export class MockGamesQueryRepository implements GamesQueryRepositoryInterface {
  private mockData: Doc<"games">[] = [];

  static create(db: any): GamesQueryRepositoryInterface {
    return new MockGamesQueryRepository();
  }

  async findAll(): Promise<Doc<"games">[]> {
    return this.mockData;
  }

  async find(id: Id<"games">): Promise<Doc<"games"> | null> {
    return this.mockData.find(g => g._id === id) ?? null;
  }

  // ... other methods

  // Test helper methods
  setMockData(data: Doc<"games">[]): void {
    this.mockData = data;
  }
}
```

2. Register mock implementations in `ServiceConfiguration.ts`:

```typescript
const IMPLEMENTATION_REGISTRY = {
  // Production implementations
  GamesQueryRepository,

  // Mock implementations
  MockGamesQueryRepository,

  // ... other implementations
};
```

3. Use mock configuration in tests:

```typescript
const testConfig = {
  query: {
    [SERVICE_IDENTIFIERS.GamesQuery]: "MockGamesQueryRepository"
  }
};

const container = createContainer(ctx, testConfig);
```

## Benefits

1. **Type Safety**: TypeScript ensures you get the correct type from `container.get()`
2. **Testability**: Easy to swap implementations for testing
3. **Configuration File**: Services configured in `convex/services.config.json`
4. **Centralized**: All service creation happens in one place
5. **Request Scoped**: New container per request, services cached within request
6. **Performance**: Configuration loaded once and cached for process lifetime

## Migration Guide

### Old Approach (Static Singletons)

```typescript
const game = await GamesQueryRepository.instance.find(gameId);
await GamesMutationRepository.instance.save(game);
```

### New Approach (DI Container)

```typescript
const container = createContainer(ctx);
const gamesQuery = container.get(SERVICE_IDENTIFIERS.GamesQuery);
const gamesMutation = container.get(SERVICE_IDENTIFIERS.GamesMutation);

const game = await gamesQuery.find(gameId);
await gamesMutation.save(game);
```

## Future Enhancements

- Support for YAML configuration files
- Circular dependency detection
- Service lifecycle management (singleton, transient, scoped)
- Decorator-based dependency injection
- Auto-registration of services
