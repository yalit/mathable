import type { ServicesConfig } from "./ServiceConfig.types";
import { SERVICE_IDENTIFIERS } from "./ServiceRegistry";
import type { GameQueryRepositoryInterface } from "../repository/query/games.repository";
import type { PlayersQueryRepositoryInterface } from "../repository/query/players.repository";
import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";

/**
 * Example mock implementation for testing
 */
class MockGamesQueryRepository implements GameQueryRepositoryInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_db: GenericDatabaseReader<DataModel>) {}

  async findAll(): Promise<Doc<"games">[]> {
    return []; // Mock implementation
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async find(_id: Id<"games">): Promise<Doc<"games"> | null> {
    return null; // Mock implementation
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findByToken(_token: string): Promise<Doc<"games"> | null> {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findNonFinishedGamesForSessionId(_sessionId: any): Promise<Doc<"games">[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async isGameWon(_id: Id<"games">, _playerId: Id<"players">): Promise<boolean> {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async isGameIdle(_id: Id<"games">): Promise<boolean> {
    return false;
  }
}

class MockPlayersQueryRepository implements PlayersQueryRepositoryInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_db: GenericDatabaseReader<DataModel>) {}

  async findAll(): Promise<Doc<"players">[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async find(_id: Id<"players">): Promise<Doc<"players"> | null> {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findByToken(_token: string): Promise<Doc<"players"> | null> {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findByGame(_gameId: Id<"games">): Promise<Doc<"players">[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findAllByUserId(_userId: Id<"users">): Promise<Doc<"players">[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findCurrentPlayer(_gameId: Id<"games">): Promise<Doc<"players"> | null> {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findNextPlayer(_gameId: Id<"games">): Promise<Doc<"players"> | null> {
    return null;
  }
}

/**
 * Example test configuration using mock implementations
 *
 * Use this pattern in your tests to inject mock services
 */
export const testServicesConfig: ServicesConfig = {
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

  mutation: {
    // Add mock mutation repositories here
  },
};

/**
 * Usage in tests:
 *
 * ```typescript
 * import { createContainer } from "./infrastructure/ContainerFactory";
 * import { testServicesConfig } from "./infrastructure/services.config.test.example";
 *
 * // In your test
 * const container = createContainer(ctx, testServicesConfig);
 * const gamesRepo = container.get(SERVICE_IDENTIFIERS.GamesQuery);
 * // gamesRepo is now MockGamesQueryRepository
 * ```
 */
