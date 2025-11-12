import type { ServiceDefinition } from "./ServiceConfig.types";
import type { PlayersQueryRepositoryInterface } from "../repository/query/players.repository";
import type { GameQueryRepositoryInterface } from "../repository/query/games.repository";
import type { TilesQueryRepositoryInterface } from "../repository/query/tiles.repository";
import type { MovesQueryRepositoryInterface } from "../repository/query/moves.repository";
import type { CellsQueryRepositoryInterface } from "../repository/query/cells.repository";
import type { UsersQueryRepositoryInterface } from "../repository/query/users.repository";
import type { PlayersMutationRepositoryInterface } from "../repository/mutations/players.repository";
import type { GamesMutationRepositoryInterface } from "../repository/mutations/games.repository";
import type { TilesMutationRepositoryInterface } from "../repository/mutations/tiles.repository";
import type { MovesMutationRepositoryInterface } from "../repository/mutations/moves.repository";
import type { CellsMutationRepositoryInterface } from "../repository/mutations/cells.repository";
import type { UsersMutationRepositoryInterface } from "../repository/mutations/users.repository";

/**
 * Service registration entry
 * Contains the service definition and metadata
 */
export interface ServiceRegistration<T = any> {
  identifier: string;
  definition: ServiceDefinition<T>;
  scope: "query" | "mutation";
}

/**
 * Service registry configuration
 * Maps service identifiers (interface names) to their service definitions
 */
export class ServiceRegistry {
  private services = new Map<string, ServiceRegistration>();

  /**
   * Register a service with its definition
   * @param identifier - Service interface name
   * @param definition - Service definition with class and dependencies
   * @param scope - Service scope (query or mutation)
   */
  register<T>(
    identifier: string,
    definition: ServiceDefinition<T>,
    scope: "query" | "mutation" = "query"
  ): void {
    this.services.set(identifier, { identifier, definition, scope });
  }

  /**
   * Get a service registration by identifier
   */
  get(identifier: string): ServiceRegistration | undefined {
    return this.services.get(identifier);
  }

  /**
   * Check if a service is registered
   */
  has(identifier: string): boolean {
    return this.services.has(identifier);
  }

  /**
   * Get all registered service identifiers
   */
  getAll(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get services by scope
   */
  getByScope(scope: "query" | "mutation"): ServiceRegistration[] {
    return Array.from(this.services.values()).filter(s => s.scope === scope);
  }
}

/**
 * Service identifier constants for type-safe resolution
 * These act as tokens for the DI container
 */
export const SERVICE_IDENTIFIERS = {
  // Query Repositories
  PlayersQuery: "PlayersQueryRepositoryInterface" as const,
  GamesQuery: "GamesQueryRepositoryInterface" as const,
  TilesQuery: "TilesQueryRepositoryInterface" as const,
  MovesQuery: "MovesQueryRepositoryInterface" as const,
  CellsQuery: "CellsQueryRepositoryInterface" as const,
  UsersQuery: "UsersQueryRepositoryInterface" as const,

  // Mutation Repositories
  PlayersMutation: "PlayersMutationRepositoryInterface" as const,
  GamesMutation: "GamesMutationRepositoryInterface" as const,
  TilesMutation: "TilesMutationRepositoryInterface" as const,
  MovesMutation: "MovesMutationRepositoryInterface" as const,
  CellsMutation: "CellsMutationRepositoryInterface" as const,
  UsersMutation: "UsersMutationRepositoryInterface" as const,
} as const;

/**
 * Type mapping for service identifiers to their interfaces
 * This enables type-safe container.get<T>() calls
 */
export interface ServiceTypeMap {
  [SERVICE_IDENTIFIERS.PlayersQuery]: PlayersQueryRepositoryInterface;
  [SERVICE_IDENTIFIERS.GamesQuery]: GameQueryRepositoryInterface;
  [SERVICE_IDENTIFIERS.TilesQuery]: TilesQueryRepositoryInterface;
  [SERVICE_IDENTIFIERS.MovesQuery]: MovesQueryRepositoryInterface;
  [SERVICE_IDENTIFIERS.CellsQuery]: CellsQueryRepositoryInterface;
  [SERVICE_IDENTIFIERS.UsersQuery]: UsersQueryRepositoryInterface;
  [SERVICE_IDENTIFIERS.PlayersMutation]: PlayersMutationRepositoryInterface;
  [SERVICE_IDENTIFIERS.GamesMutation]: GamesMutationRepositoryInterface;
  [SERVICE_IDENTIFIERS.TilesMutation]: TilesMutationRepositoryInterface;
  [SERVICE_IDENTIFIERS.MovesMutation]: MovesMutationRepositoryInterface;
  [SERVICE_IDENTIFIERS.CellsMutation]: CellsMutationRepositoryInterface;
  [SERVICE_IDENTIFIERS.UsersMutation]: UsersMutationRepositoryInterface;
}

/**
 * Valid service identifier type
 */
export type ServiceKey = keyof ServiceTypeMap;
