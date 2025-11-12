import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ServiceContainer } from "./ServiceContainer";
import { loadServiceConfiguration } from "./ServiceConfiguration";
import type { ServiceRegistry } from "./ServiceRegistry";
import type { ServicesConfig } from "./ServiceConfig.types";
import { servicesConfig } from "../services.config";

/**
 * Global service registry cache
 * Registries are stateless and can be reused across requests
 */
let cachedRegistry: ServiceRegistry | null = null;

/**
 * Load the service registry from convex/services.config.ts
 * Configuration is loaded once and cached for the lifetime of the process
 */
function loadDefaultRegistry(): ServiceRegistry {
  if (!cachedRegistry) {
    cachedRegistry = loadServiceConfiguration(servicesConfig);
  }
  return cachedRegistry;
}

/**
 * Create a ServiceContainer from Convex context
 *
 * This is the primary entry point for accessing repositories and services.
 * Creates a request-scoped container with all dependencies properly initialized.
 *
 * By default, loads configuration from convex/services.config.ts.
 * For testing, you can provide a custom configuration object.
 *
 * @param ctx - Convex MutationCtx or QueryCtx
 * @param config - Optional custom service configuration (useful for testing)
 * @returns ServiceContainer with all services initialized according to configuration
 *
 * @example
 * // In a mutation (production) - loads from convex/services.config.ts
 * const container = createContainer(ctx);
 * const gamesRepo = container.get(SERVICE_IDENTIFIERS.GamesQuery);
 * const game = await gamesRepo.find(gameId);
 *
 * @example
 * // In tests with custom configuration
 * import { MockGamesQueryRepository } from "./mocks/MockGamesQueryRepository";
 *
 * const testConfig: ServicesConfig = {
 *   query: {
 *     [SERVICE_IDENTIFIERS.GamesQuery]: {
 *       class: MockGamesQueryRepository,
 *       arguments: []
 *     }
 *   },
 *   mutation: {}
 * };
 * const container = createContainer(ctx, testConfig);
 */
export function createContainer(
  ctx: MutationCtx | QueryCtx,
  config?: ServicesConfig
): ServiceContainer {
  const registry = config
    ? loadServiceConfiguration(config)
    : loadDefaultRegistry();

  return new ServiceContainer(ctx, registry);
}

/**
 * Create a ServiceContainer with a custom registry
 * Useful for advanced testing scenarios
 *
 * @param ctx - Convex MutationCtx or QueryCtx
 * @param registry - Pre-configured ServiceRegistry
 * @returns ServiceContainer with services from custom registry
 */
export function createContainerWithRegistry(
  ctx: MutationCtx | QueryCtx,
  registry: ServiceRegistry
): ServiceContainer {
  return new ServiceContainer(ctx, registry);
}

/**
 * Reset the cached registry
 * Useful for testing to ensure clean state or to reload configuration
 */
export function resetCachedRegistry(): void {
  cachedRegistry = null;
}
