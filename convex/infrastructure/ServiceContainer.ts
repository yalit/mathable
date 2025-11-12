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
   * Dependencies are resolved recursively from the container before instantiation.
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

    // Resolve dependencies
    const dependencies = this.resolveDependencies(
      identifier,
      registration.definition.arguments || []
    );

    // Create instance using constructor with db and resolved dependencies
    const ServiceClass = registration.definition.class;
    const instance = new ServiceClass(this.db, ...dependencies);

    // Cache for this request
    this.instances.set(identifier, instance);

    return instance;
  }

  /**
   * Resolve service dependencies recursively
   * @param requestingService - The service that is requesting dependencies (for circular detection)
   * @param dependencyIdentifiers - Array of service identifiers to resolve
   * @returns Array of resolved service instances
   */
  private resolveDependencies(
    requestingService: string,
    dependencyIdentifiers: string[]
  ): any[] {
    const dependencies: any[] = [];

    for (const depIdentifier of dependencyIdentifiers) {
      // Check for circular dependencies
      if (depIdentifier === requestingService) {
        throw new Error(
          `Circular dependency detected: Service '${requestingService}' depends on itself`
        );
      }

      // Resolve the dependency (this will recursively resolve its dependencies)
      const dependency = this.get(depIdentifier as ServiceKey);
      dependencies.push(dependency);
    }

    return dependencies;
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
