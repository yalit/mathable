import type { ServicesConfig } from "./ServiceConfig.types.ts";

// Import your actual repository classes
import { PlayersQueryRepository } from "../../repository/query/players.repository.ts";
import { GamesQueryRepository } from "../../repository/query/games.repository.ts";
import { PlayersMutationRepository } from "../../repository/mutations/players.repository.ts";
import {DB_ARGUMENT} from "./ServiceContainer.ts";

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
    "PlayersQueryRepositoryInterface": {
      class: PlayersQueryRepository,
      arguments: [DB_ARGUMENT], // Only takes db, no other service dependencies
    },

    // Service that could depend on other services
    "GamesQueryRepositoryInterface": {
      class: GamesQueryRepository,
      arguments: [], // Currently no dependencies
      // Example with dependencies:
      // arguments: ["PlayersQueryRepositoryInterface", "TilesQueryRepositoryInterface"]
    },
  },

  mutation: {
    "PlayersMutationRepositoryInterface": {
      class: PlayersMutationRepository.create, // can also be a static or a factory method
      arguments: [],
    },
  },
};
