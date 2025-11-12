import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ServiceContainer } from "./ServiceContainer";
import { loadServiceConfiguration, type ServiceConfigurationData, DEFAULT_SERVICE_CONFIG } from "./ServiceConfiguration";
import type { ServiceRegistry } from "./ServiceRegistry";

/**
 * Global service registry cache
 * Registries are stateless and can be reused across requests
 */
let defaultRegistry: ServiceRegistry | null = null;

/**
 * Get or create the default service registry
 * Lazy initialization with caching
 */
function getDefaultRegistry(): ServiceRegistry {
  if (!defaultRegistry) {
    defaultRegistry = loadServiceConfiguration(DEFAULT_SERVICE_CONFIG);
  }
  return defaultRegistry;
}

/**
 * Create a ServiceContainer from Convex context
 *
 * This is the primary entry point for accessing repositories and services.
 * Creates a request-scoped container with all dependencies properly initialized.
 *
 * @param ctx - Convex MutationCtx or QueryCtx
 * @param config - Optional custom service configuration (useful for testing)
 * @returns ServiceContainer with all services initialized according to configuration
 *
 * @example
 * // In a mutation (production)
 * const container = createContainer(ctx);
 * const gamesRepo = container.get(SERVICE_IDENTIFIERS.GamesQuery);
 * const game = await gamesRepo.find(gameId);
 *
 * @example
 * // In tests with custom configuration
 * const testConfig = {
 *   query: {
 *     [SERVICE_IDENTIFIERS.GamesQuery]: "MockGamesQueryRepository"
 *   },
 *   mutation: {
 *     [SERVICE_IDENTIFIERS.GamesMutation]: "MockGamesMutationRepository"
 *   }
 * };
 * const container = createContainer(ctx, testConfig);
 */
export function createContainer(
  ctx: MutationCtx | QueryCtx,
  config?: ServiceConfigurationData
): ServiceContainer {
  const registry = config
    ? loadServiceConfiguration(config)
    : getDefaultRegistry();

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
 * Reset the default registry cache
 * Useful for testing to ensure clean state
 */
export function resetDefaultRegistry(): void {
  defaultRegistry = null;
}
