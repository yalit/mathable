import { ServiceRegistry } from "./ServiceRegistry";
import { PlayersQueryRepository } from "../repository/query/players.repository";
import { GamesQueryRepository } from "../repository/query/games.repository";
import { TilesQueryRepository } from "../repository/query/tiles.repository";
import { MovesQueryRepository } from "../repository/query/moves.repository";
import { CellsQueryRepository } from "../repository/query/cells.repository";
import { UsersQueryRepository } from "../repository/query/users.repository";
import { PlayersMutationRepository } from "../repository/mutations/players.repository";
import { GamesMutationRepository } from "../repository/mutations/games.repository";
import { TilesMutationRepository } from "../repository/mutations/tiles.repository";
import { MovesMutationRepository } from "../repository/mutations/moves.repository";
import { CellsMutationRepository } from "../repository/mutations/cells.repository";
import { UsersMutationRepository } from "../repository/mutations/users.repository";

/**
 * Configuration format for service mappings
 * Can be loaded from JSON/YAML files
 */
export interface ServiceConfigurationData {
  query: Record<string, string>;
  mutation: Record<string, string>;
}

/**
 * Registry of available implementation classes
 * Maps class names to their actual constructors
 */
const IMPLEMENTATION_REGISTRY = {
  // Query Repositories
  PlayersQueryRepository,
  GamesQueryRepository,
  TilesQueryRepository,
  MovesQueryRepository,
  CellsQueryRepository,
  UsersQueryRepository,

  // Mutation Repositories
  PlayersMutationRepository,
  GamesMutationRepository,
  TilesMutationRepository,
  MovesMutationRepository,
  CellsMutationRepository,
  UsersMutationRepository,
};

/**
 * Load service configuration and create a ServiceRegistry
 * @param config - Configuration data (from JSON/YAML or object)
 * @returns Configured ServiceRegistry
 */
export function loadServiceConfiguration(
  config: ServiceConfigurationData
): ServiceRegistry {
  const registry = new ServiceRegistry();

  // Register query services
  for (const [interfaceName, className] of Object.entries(config.query)) {
    const implementationClass = IMPLEMENTATION_REGISTRY[className as keyof typeof IMPLEMENTATION_REGISTRY];

    if (!implementationClass) {
      throw new Error(`Implementation class '${className}' not found in registry`);
    }

    registry.register(
      interfaceName,
      (db) => implementationClass.create(db as any),
      "query"
    );
  }

  // Register mutation services
  for (const [interfaceName, className] of Object.entries(config.mutation)) {
    const implementationClass = IMPLEMENTATION_REGISTRY[className as keyof typeof IMPLEMENTATION_REGISTRY];

    if (!implementationClass) {
      throw new Error(`Implementation class '${className}' not found in registry`);
    }

    registry.register(
      interfaceName,
      (db) => implementationClass.create(db as any),
      "mutation"
    );
  }

  return registry;
}

/**
 * Load service configuration from JSON string
 * Useful for loading from external files or environment variables
 */
export function loadServiceConfigurationFromJSON(json: string): ServiceRegistry {
  const config = JSON.parse(json) as ServiceConfigurationData;
  return loadServiceConfiguration(config);
}
