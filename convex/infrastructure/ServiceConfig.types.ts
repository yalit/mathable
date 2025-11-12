/**
 * Constructor type for services that require database access
 */
export type ServiceConstructor<T = any> = (new (
  ...dependencies: any[]
) => T) | ((...dependencies: any[]) => T);

/**
 * Service definition entry
 * Defines the class to instantiate and its dependencies
 */
export interface ServiceDefinition<T = any> {
  /**
   * The class constructor to instantiate
   */
  class: ServiceConstructor<T>;

  /**
   * List of service identifiers that should be injected as constructor arguments
   * These dependencies will be resolved from the container before instantiation
   *
   * @example
   * ```typescript
   * {
   *   class: SomeService,
   *   arguments: ["GamesQueryRepositoryInterface", "PlayersQueryRepositoryInterface"]
   * }
   * ```
   */
  arguments?: string[];
}

/**
 * Service configuration for a specific scope (query or mutation)
 * Maps interface names to their service definitions
 */
export type ScopeServiceConfig = Record<string, ServiceDefinition>;

/**
 * Complete service configuration structure
 * Separates query and mutation scope services
 */
export interface ServicesConfig {
  query: ScopeServiceConfig;
  mutation: ScopeServiceConfig;
  any?: ScopeServiceConfig
}
