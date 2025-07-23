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
import type * as game_actions_computeAllowedValues from "../game/actions/computeAllowedValues.js";
import type * as game_actions_createGame from "../game/actions/createGame.js";
import type * as helpers_cell from "../helpers/cell.js";
import type * as helpers_cellImpacts from "../helpers/cellImpacts.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "game/actions/computeAllowedValues": typeof game_actions_computeAllowedValues;
  "game/actions/createGame": typeof game_actions_createGame;
  "helpers/cell": typeof helpers_cell;
  "helpers/cellImpacts": typeof helpers_cellImpacts;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
