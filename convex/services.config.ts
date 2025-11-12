import type { ServicesConfig } from "./infrastructure/ServiceConfig.types";
import { SERVICE_IDENTIFIERS } from "./infrastructure/ServiceRegistry";

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

/**
 * Production service configuration
 *
 * Maps service interface names to their implementations with constructor dependencies.
 * The container will resolve dependencies and instantiate services as needed.
 *
 * Structure:
 * - key: Interface name (use SERVICE_IDENTIFIERS constants)
 * - value: { class: ClassConstructor, arguments?: [dependency interface names] }
 *
 * The 'arguments' array specifies other services that should be injected into the constructor.
 * Services are resolved recursively from the container.
 */
export const servicesConfig: ServicesConfig = {
  query: {
    [SERVICE_IDENTIFIERS.PlayersQuery]: {
      class: PlayersQueryRepository,
      arguments: [], // No service dependencies, only db
    },
    [SERVICE_IDENTIFIERS.GamesQuery]: {
      class: GamesQueryRepository,
      arguments: [], // No service dependencies, only db
    },
    [SERVICE_IDENTIFIERS.TilesQuery]: {
      class: TilesQueryRepository,
      arguments: [], // No service dependencies, only db
    },
    [SERVICE_IDENTIFIERS.MovesQuery]: {
      class: MovesQueryRepository,
      arguments: [], // No service dependencies, only db
    },
    [SERVICE_IDENTIFIERS.CellsQuery]: {
      class: CellsQueryRepository,
      arguments: [], // No service dependencies, only db
    },
    [SERVICE_IDENTIFIERS.UsersQuery]: {
      class: UsersQueryRepository,
      arguments: [], // No service dependencies, only db
    },
  },

  mutation: {
    [SERVICE_IDENTIFIERS.PlayersMutation]: {
      class: PlayersMutationRepository as any, // Type assertion needed for GenericDatabaseWriter
      arguments: [], // No service dependencies, only db
    },
    [SERVICE_IDENTIFIERS.GamesMutation]: {
      class: GamesMutationRepository as any, // Type assertion needed for GenericDatabaseWriter
      arguments: [], // No service dependencies, only db
    },
    [SERVICE_IDENTIFIERS.TilesMutation]: {
      class: TilesMutationRepository as any, // Type assertion needed for GenericDatabaseWriter
      arguments: [], // No service dependencies, only db
    },
    [SERVICE_IDENTIFIERS.MovesMutation]: {
      class: MovesMutationRepository as any, // Type assertion needed for GenericDatabaseWriter
      arguments: [], // No service dependencies, only db
    },
    [SERVICE_IDENTIFIERS.CellsMutation]: {
      class: CellsMutationRepository as any, // Type assertion needed for GenericDatabaseWriter
      arguments: [], // No service dependencies, only db
    },
    [SERVICE_IDENTIFIERS.UsersMutation]: {
      class: UsersMutationRepository as any, // Type assertion needed for GenericDatabaseWriter
      arguments: [], // No service dependencies, only db
    },
  },
};
