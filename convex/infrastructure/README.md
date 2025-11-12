# Dependency Injection Container

This directory contains the dependency injection (DI) container implementation for the Mathable backend.

## Overview

The DI container provides:
- **Generic `get<T>()` method** for type-safe service resolution
- **TypeScript configuration** with direct class references
- **Constructor dependency injection** with automatic resolution
- **Interface-based** dependency injection
- **Request-scoped** lifecycle (not singleton)
- **Easy testing** with mock implementations

## Core Files

- `ServiceContainer.ts` - Main DI container with generic `get<T>()` and dependency resolution
- `ServiceRegistry.ts` - Registry for mapping interfaces to service definitions
- `ServiceConfiguration.ts` - Configuration loader for TypeScript configs
- `ServiceConfig.types.ts` - TypeScript types for service configuration
- `ContainerFactory.ts` - Factory functions for creating containers
- `../services.config.ts` - **Production configuration** (loaded by default)
- `services.config.example.ts` - Configuration format reference
- `services.config.test.example.ts` - Test configuration example with mocks

## Configuration

### Production Configuration

The production configuration is located at `convex/services.config.ts` and is automatically loaded when you call `createContainer(ctx)` without arguments.

**convex/services.config.ts:**
```typescript
import type { ServicesConfig } from "./infrastructure/ServiceConfig.types";
import { SERVICE_IDENTIFIERS } from "./infrastructure/ServiceRegistry";
import { PlayersQueryRepository } from "./repository/query/players.repository";
import { GamesQueryRepository } from "./repository/query/games.repository";

export const servicesConfig: ServicesConfig = {
  query: {
    [SERVICE_IDENTIFIERS.PlayersQuery]: {
      class: PlayersQueryRepository,
      arguments: [], // No service dependencies, only db
    },
    [SERVICE_IDENTIFIERS.GamesQuery]: {
      class: GamesQueryRepository,
      arguments: [], // Can specify dependencies: [SERVICE_IDENTIFIERS.PlayersQuery]
    },
  },
  mutation: {
    [SERVICE_IDENTIFIERS.PlayersMutation]: {
      class: PlayersMutationRepository,
      arguments: [],
    },
  },
};
```

**Key Features:**
- **Direct class references** - No string lookups, TypeScript validates class types
- **Constructor dependencies** - Specify service dependencies in `arguments` array
- **Automatic resolution** - Container resolves and injects dependencies recursively
- **Type-safe** - Full TypeScript support with type checking

## Usage

### Production Usage

```typescript
import { createContainer } from "./infrastructure/ContainerFactory";
import { SERVICE_IDENTIFIERS } from "./infrastructure/ServiceRegistry";

// In a Convex mutation
export const endTurn = mutation({
  handler: async (ctx, args) => {
    // Automatically loads from convex/services.config.ts
    const container = createContainer(ctx);

    // Get services using SERVICE_IDENTIFIERS
    const gamesRepo = container.get(SERVICE_IDENTIFIERS.GamesQuery);
    const playersRepo = container.get(SERVICE_IDENTIFIERS.PlayersQuery);

    const game = await gamesRepo.find(args.gameId);
    const player = await playersRepo.findCurrentPlayer(args.gameId);

    // Dependencies are automatically resolved!
    // If GamesRepo needed PlayersRepo, container would inject it
  }
});
```

### Testing with Mock Implementations

```typescript
import { createContainer } from "./infrastructure/ContainerFactory";
import { SERVICE_IDENTIFIERS } from "./infrastructure/ServiceRegistry";
import type { ServicesConfig } from "./infrastructure/ServiceConfig.types";
import { MockGamesQueryRepository } from "./mocks/MockGamesQueryRepository";
import { MockPlayersQueryRepository } from "./mocks/MockPlayersQueryRepository";

// Create test configuration with mock classes
const testConfig: ServicesConfig = {
  query: {
    [SERVICE_IDENTIFIERS.GamesQuery]: {
      class: MockGamesQueryRepository,
      arguments: [],
    },
    [SERVICE_IDENTIFIERS.PlayersQuery]: {
      class: MockPlayersQueryRepository,
      arguments: [],
    },
  },
  mutation: {},
};

// Create container with test config
const container = createContainer(ctx, testConfig);

// Services will be mocked
const gamesRepo = container.get(SERVICE_IDENTIFIERS.GamesQuery);
// gamesRepo is now an instance of MockGamesQueryRepository
```

### Constructor Dependency Injection

Services can depend on other services through constructor injection:

```typescript
// Example service that depends on other services
class GameLogicService {
  constructor(
    private db: GenericDatabaseReader<DataModel>,
    private gamesRepo: GameQueryRepositoryInterface,
    private playersRepo: PlayersQueryRepositoryInterface
  ) {}

  async calculateScore(gameId: Id<"games">): Promise<number> {
    const game = await this.gamesRepo.find(gameId);
    const players = await this.playersRepo.findByGame(gameId);
    // ... logic
  }
}

// Configuration
const config: ServicesConfig = {
  query: {
    [SERVICE_IDENTIFIERS.GamesQuery]: {
      class: GamesQueryRepository,
      arguments: [],
    },
    [SERVICE_IDENTIFIERS.PlayersQuery]: {
      class: PlayersQueryRepository,
      arguments: [],
    },
    "GameLogicService": {
      class: GameLogicService,
      // Container will resolve these dependencies automatically
      arguments: [SERVICE_IDENTIFIERS.GamesQuery, SERVICE_IDENTIFIERS.PlayersQuery],
    },
  },
  mutation: {},
};
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

Configuration is a TypeScript object that maps interface names to service definitions:

```typescript
import type { ServicesConfig, ServiceDefinition } from "./infrastructure/ServiceConfig.types";
import { SERVICE_IDENTIFIERS } from "./infrastructure/ServiceRegistry";
import { YourRepository } from "./repository/YourRepository";

export const config: ServicesConfig = {
  query: {
    [SERVICE_IDENTIFIERS.SomeQuery]: {
      class: YourRepository,           // Direct class reference
      arguments: [],                    // Array of service dependencies
    },
  },
  mutation: {},
};
```

**Service Definition Structure:**
- `class`: The constructor function for the service
- `arguments`: Array of service identifiers that should be injected into the constructor
  - These are resolved from the container before instantiation
  - Services are constructed with: `new ServiceClass(db, ...resolvedDependencies)`

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

1. **Type Safety**: TypeScript validates class types at compile time
2. **No String Lookups**: Direct class references, no need for string-based registries
3. **Dependency Injection**: Constructor dependencies automatically resolved
4. **Testability**: Easy to swap implementations for testing
5. **Circular Dependency Detection**: Container detects and prevents circular dependencies
6. **Centralized Configuration**: All services configured in one place
7. **Request Scoped**: New container per request, services cached within request
8. **Performance**: Configuration loaded once and cached for process lifetime

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
