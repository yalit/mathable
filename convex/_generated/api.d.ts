/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as helpers_cell from "../helpers/cell.js";
import type * as helpers_cellImpacts from "../helpers/cellImpacts.js";
import type * as helpers_game from "../helpers/game.js";
import type * as helpers_player from "../helpers/player.js";
import type * as middleware_sessions from "../middleware/sessions.js";
import type * as mutations_internal_cell from "../mutations/internal/cell.js";
import type * as mutations_internal_player from "../mutations/internal/player.js";
import type * as mutations_internal_user from "../mutations/internal/user.js";
import type * as mutations_public_game from "../mutations/public/game.js";
import type * as queries_game from "../queries/game.js";
import type * as queries_player from "../queries/player.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "helpers/cell": typeof helpers_cell;
  "helpers/cellImpacts": typeof helpers_cellImpacts;
  "helpers/game": typeof helpers_game;
  "helpers/player": typeof helpers_player;
  "middleware/sessions": typeof middleware_sessions;
  "mutations/internal/cell": typeof mutations_internal_cell;
  "mutations/internal/player": typeof mutations_internal_player;
  "mutations/internal/user": typeof mutations_internal_user;
  "mutations/public/game": typeof mutations_public_game;
  "queries/game": typeof queries_game;
  "queries/player": typeof queries_player;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
