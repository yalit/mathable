import { ServiceRegistry } from "./ServiceRegistry";
import type { ServicesConfig } from "./ServiceConfig.types";

/**
 * Load service configuration and create a ServiceRegistry
 *
 * Takes a TypeScript configuration object with class references and dependency definitions.
 * Registers all services with the registry for later instantiation by the container.
 *
 * @param config - TypeScript configuration object with service definitions
 * @returns Configured ServiceRegistry
 *
 * @example
 * ```typescript
 * const config: ServicesConfig = {
 *   query: {
 *     "GamesQueryRepositoryInterface": {
 *       class: GamesQueryRepository,
 *       arguments: [] // No service dependencies
 *     }
 *   },
 *   mutation: {
 *     "GamesMutationRepositoryInterface": {
 *       class: GamesMutationRepository,
 *       arguments: []
 *     }
 *   }
 * };
 * const registry = loadServiceConfiguration(config);
 * ```
 */
export function loadServiceConfiguration(config: ServicesConfig): ServiceRegistry {
  const registry = new ServiceRegistry();

  // Register query services
  for (const [interfaceName, definition] of Object.entries(config.query)) {
    registry.register(interfaceName, definition, "query");
  }

  // Register mutation services
  for (const [interfaceName, definition] of Object.entries(config.mutation)) {
    registry.register(interfaceName, definition, "mutation");
  }

  return registry;
}
