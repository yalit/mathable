import type { ServicesConfig } from "./ServiceConfig.types";
import { SERVICE_IDENTIFIERS } from "./ServiceRegistry";

// Import your actual repository classes
import { PlayersQueryRepository } from "../repository/query/players.repository";
import { GamesQueryRepository } from "../repository/query/games.repository";
import { PlayersMutationRepository } from "../repository/mutations/players.repository";
import { GamesMutationRepository } from "../repository/mutations/games.repository";

/**
 * Example production service configuration
 *
 * This demonstrates how to configure services with:
 * - Direct class references (no string lookups)
 * - Constructor dependency injection
 * - Type-safe configuration
 */
export const exampleServicesConfig: ServicesConfig = {
  query: {
    // Simple service with no dependencies
    [SERVICE_IDENTIFIERS.PlayersQuery]: {
      class: PlayersQueryRepository,
      arguments: [], // Only takes db, no service dependencies
    },

    // Service that could depend on other services
    [SERVICE_IDENTIFIERS.GamesQuery]: {
      class: GamesQueryRepository,
      arguments: [], // Currently no dependencies
      // Example with dependencies:
      // arguments: [SERVICE_IDENTIFIERS.PlayersQuery, SERVICE_IDENTIFIERS.TilesQuery]
    },
  },

  mutation: {
    [SERVICE_IDENTIFIERS.PlayersMutation]: {
      class: PlayersMutationRepository as any, // Cast needed for GenericDatabaseWriter
      arguments: [],
    },

    [SERVICE_IDENTIFIERS.GamesMutation]: {
      class: GamesMutationRepository as any, // Cast needed for GenericDatabaseWriter
      arguments: [],
    },
  },
};
