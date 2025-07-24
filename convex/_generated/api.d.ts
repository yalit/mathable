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
import type * as game_actions_internal_computeAllowedValues from "../game/actions/internal/computeAllowedValues.js";
import type * as game_actions_internal_createPlayer from "../game/actions/internal/createPlayer.js";
import type * as game_actions_public_createGame from "../game/actions/public/createGame.js";
import type * as game_actions_public_joinGame from "../game/actions/public/joinGame.js";
import type * as game_queries_getGame from "../game/queries/getGame.js";
import type * as game_queries_getPlayer from "../game/queries/getPlayer.js";
import type * as helpers_cell from "../helpers/cell.js";
import type * as helpers_cellImpacts from "../helpers/cellImpacts.js";
import type * as helpers_game from "../helpers/game.js";
import type * as helpers_player from "../helpers/player.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "game/actions/internal/computeAllowedValues": typeof game_actions_internal_computeAllowedValues;
  "game/actions/internal/createPlayer": typeof game_actions_internal_createPlayer;
  "game/actions/public/createGame": typeof game_actions_public_createGame;
  "game/actions/public/joinGame": typeof game_actions_public_joinGame;
  "game/queries/getGame": typeof game_queries_getGame;
  "game/queries/getPlayer": typeof game_queries_getPlayer;
  "helpers/cell": typeof helpers_cell;
  "helpers/cellImpacts": typeof helpers_cellImpacts;
  "helpers/game": typeof helpers_game;
  "helpers/player": typeof helpers_player;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
