import type { ServiceDefinition } from "./ServiceConfig.types";

export type ServiceRegistrationScope = "query" | "mutation" | "any"
 /**
 * Service registration entry
 * Contains the service definition and metadata
 */
export interface ServiceRegistration<T = any> {
  identifier: string;
  definition: ServiceDefinition<T>;
  scope: ServiceRegistrationScope;
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
   * @param scope - Service scope (query or mutation or any)
   */
  register<T>(
    identifier: string,
    definition: ServiceDefinition<T>,
    scope:ServiceRegistrationScope
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
  getByScope(scope: ServiceRegistrationScope): ServiceRegistration[] {
    return Array.from(this.services.values()).filter(s => s.scope === scope);
  }
}
