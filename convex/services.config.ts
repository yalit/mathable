import type { ServicesConfig } from "./infrastructure/config/ServiceConfig.types.ts";

// Query Repository Imports
import { PlayersQueryRepository } from "./repository/query/players.repository";
import { GamesQueryRepository } from "./repository/query/games.repository";
import { TilesQueryRepository } from "./repository/query/tiles.repository";
import { MovesQueryRepository } from "./repository/query/moves.repository";
import { CellsQueryRepository } from "./repository/query/cells.repository";
import { UsersQueryRepository } from "./repository/query/users.repository";

// Mutation Repository Imports
import { PlayersMutationRepository } from "./repository/mutations/players.repository";
import { GamesMutationRepository } from "./repository/mutations/games.repository";
import { TilesMutationRepository } from "./repository/mutations/tiles.repository";
import { MovesMutationRepository } from "./repository/mutations/moves.repository";
import { CellsMutationRepository } from "./repository/mutations/cells.repository";
import { UsersMutationRepository } from "./repository/mutations/users.repository";
import {DB_ARGUMENT} from "./infrastructure/config/ServiceContainer.ts";

/**
 * Production service configuration
 *
 * Maps service interface names to their implementations with constructor dependencies.
 * The container will resolve dependencies and instantiate services as needed.
 *
 * Structure:
 * - key: Interface name (string identifier for the service)
 * - value: { class: ClassConstructor, arguments?: [dependency interface names] }
 *
 * The 'arguments' array specifies other services that should be injected into the constructor.
 * Services are resolved recursively from the container.
 */
export const servicesConfig: ServicesConfig = {
  query: {
    "PlayersQueryRepositoryInterface": {
      class: PlayersQueryRepository,
      arguments: [DB_ARGUMENT],
    },
    "GamesQueryRepositoryInterface": {
      class: GamesQueryRepository,
      arguments: [DB_ARGUMENT],
    },
    "TilesQueryRepositoryInterface": {
      class: TilesQueryRepository,
      arguments: [DB_ARGUMENT],
    },
    "MovesQueryRepositoryInterface": {
      class: MovesQueryRepository,
      arguments: [DB_ARGUMENT],
    },
    "CellsQueryRepositoryInterface": {
      class: CellsQueryRepository,
      arguments: [DB_ARGUMENT, "TilesQueryRepositoryInterface"],
    },
    "UsersQueryRepositoryInterface": {
      class: UsersQueryRepository,
      arguments: [DB_ARGUMENT],
    },
  },

  mutation: {
    "PlayersMutationRepositoryInterface": {
      class: PlayersMutationRepository.create, // Type assertion needed for GenericDatabaseWriter
      arguments: [DB_ARGUMENT],
    },
    "GamesMutationRepositoryInterface": {
      class: GamesMutationRepository.create, // Type assertion needed for GenericDatabaseWriter
      arguments: [DB_ARGUMENT],
    },
    "TilesMutationRepositoryInterface": {
      class: TilesMutationRepository.create, // Type assertion needed for GenericDatabaseWriter
      arguments: [DB_ARGUMENT],
    },
    "MovesMutationRepositoryInterface": {
      class: MovesMutationRepository.create, // Type assertion needed for GenericDatabaseWriter
      arguments: [DB_ARGUMENT],
    },
    "CellsMutationRepositoryInterface": {
      class: CellsMutationRepository.create, // Type assertion needed for GenericDatabaseWriter
      arguments: [DB_ARGUMENT],
    },
    "UsersMutationRepositoryInterface": {
      class: UsersMutationRepository.create, // Type assertion needed for GenericDatabaseWriter
      arguments: [DB_ARGUMENT]
    },
  },
};
