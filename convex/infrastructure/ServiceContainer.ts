import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { GenericDatabaseReader, GenericDatabaseWriter } from "convex/server";
import type { DataModel } from "../_generated/dataModel";
import { ServiceRegistry, type ServiceTypeMap, type ServiceKey } from "./ServiceRegistry";

/**
 * ServiceContainer - Generic Dependency Injection Container
 *
 * Manages all service instances (repositories, future services) with:
 * - Generic get<T>() method for type-safe service resolution
 * - Configuration-based service loading (JSON/YAML support)
 * - Interface-based dependency injection
 * - Request-scoped lifecycle (not singleton)
 * - Easy to mock/test with alternative implementations
 *
 * Usage:
 * ```typescript
 * const container = createContainer(ctx);
 * const gamesRepo = container.get(SERVICE_IDENTIFIERS.GamesQuery);
 * const game = await gamesRepo.find(gameId);
 * ```
 */
export class ServiceContainer {
  private registry: ServiceRegistry;
  private instances = new Map<string, any>();
  private db: GenericDatabaseReader<DataModel> | GenericDatabaseWriter<DataModel>;
  private isMutationContext: boolean;

  /**
   * Create container from Convex context and service registry
   * @param ctx - MutationCtx or QueryCtx
   * @param registry - Service registry with configured mappings
   */
  constructor(ctx: MutationCtx | QueryCtx, registry: ServiceRegistry) {
    this.registry = registry;
    this.db = ctx.db;
    // Check if we're in a mutation context by checking for mutation-specific methods
    this.isMutationContext = typeof (ctx.db as any).insert === "function";
  }

  /**
   * Get a service instance by its identifier
   * Services are lazily instantiated and cached per request
   *
   * @param identifier - Service identifier (use SERVICE_IDENTIFIERS constants)
   * @returns The service instance
   *
   * @example
   * ```typescript
   * const gamesRepo = container.get(SERVICE_IDENTIFIERS.GamesQuery);
   * const game = await gamesRepo.find(gameId);
   * ```
   */
  get<K extends ServiceKey>(identifier: K): ServiceTypeMap[K] {
    // Return cached instance if available
    if (this.instances.has(identifier)) {
      return this.instances.get(identifier);
    }

    // Get service registration
    const registration = this.registry.get(identifier);
    if (!registration) {
      throw new Error(`Service '${identifier}' is not registered in the container`);
    }

    // Check if mutation service is requested in query context
    if (registration.scope === "mutation" && !this.isMutationContext) {
      throw new Error(
        `Service '${identifier}' is a mutation service and can only be resolved in a mutation context`
      );
    }

    // Create instance using factory
    const instance = registration.factory(this.db);

    // Cache for this request
    this.instances.set(identifier, instance);

    return instance;
  }

  /**
   * Check if a service is available in this context
   */
  has(identifier: ServiceKey): boolean {
    const registration = this.registry.get(identifier);
    if (!registration) {
      return false;
    }

    // Mutation services are only available in mutation context
    if (registration.scope === "mutation" && !this.isMutationContext) {
      return false;
    }

    return true;
  }

  /**
   * Clear all cached instances
   * Generally not needed as containers are request-scoped
   */
  clear(): void {
    this.instances.clear();
  }
}
