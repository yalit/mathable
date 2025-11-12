import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ServiceContainer } from "./ServiceContainer";

/**
 * Create a ServiceContainer from Convex context
 *
 * This is the primary entry point for accessing repositories and services.
 * Creates a request-scoped container with all dependencies properly initialized.
 *
 * @param ctx - Convex MutationCtx or QueryCtx
 * @returns ServiceContainer with all repositories initialized
 *
 * @example
 * // In a mutation
 * const container = createContainer(ctx);
 * const game = await container.gamesQuery.find(gameId);
 * await container.gamesMutation.save(game);
 *
 * @example
 * // In a query
 * const container = createContainer(ctx);
 * const players = await container.playersQuery.findByGame(gameId);
 */
export function createContainer(ctx: MutationCtx | QueryCtx): ServiceContainer {
  return new ServiceContainer(ctx);
}
