/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as domain_models_Cell from "../domain/models/Cell.js";
import type * as domain_models_Game from "../domain/models/Game.js";
import type * as domain_models_Move from "../domain/models/Move.js";
import type * as domain_models_Player from "../domain/models/Player.js";
import type * as domain_models_Tile from "../domain/models/Tile.js";
import type * as domain_models_User from "../domain/models/User.js";
import type * as helpers_array from "../helpers/array.js";
import type * as helpers_cell from "../helpers/cell.js";
import type * as infrastructure_ContainerFactory from "../infrastructure/ContainerFactory.js";
import type * as infrastructure_ServiceConfiguration from "../infrastructure/ServiceConfiguration.js";
import type * as infrastructure_ServiceContainer from "../infrastructure/ServiceContainer.js";
import type * as infrastructure_ServiceRegistry from "../infrastructure/ServiceRegistry.js";
import type * as mutations_internal_cell from "../mutations/internal/cell.js";
import type * as mutations_internal_game from "../mutations/internal/game.js";
import type * as mutations_internal_move from "../mutations/internal/move.js";
import type * as mutations_internal_player from "../mutations/internal/player.js";
import type * as mutations_internal_tile from "../mutations/internal/tile.js";
import type * as mutations_internal_user from "../mutations/internal/user.js";
import type * as mutations_public_game from "../mutations/public/game.js";
import type * as mutations_public_play from "../mutations/public/play.js";
import type * as mutations_public_tile from "../mutations/public/tile.js";
import type * as queries_game from "../queries/game.js";
import type * as queries_play from "../queries/play.js";
import type * as queries_player from "../queries/player.js";
import type * as queries_user from "../queries/user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "domain/models/Cell": typeof domain_models_Cell;
  "domain/models/Game": typeof domain_models_Game;
  "domain/models/Move": typeof domain_models_Move;
  "domain/models/Player": typeof domain_models_Player;
  "domain/models/Tile": typeof domain_models_Tile;
  "domain/models/User": typeof domain_models_User;
  "helpers/array": typeof helpers_array;
  "helpers/cell": typeof helpers_cell;
  "infrastructure/ContainerFactory": typeof infrastructure_ContainerFactory;
  "infrastructure/ServiceConfiguration": typeof infrastructure_ServiceConfiguration;
  "infrastructure/ServiceContainer": typeof infrastructure_ServiceContainer;
  "infrastructure/ServiceRegistry": typeof infrastructure_ServiceRegistry;
  "mutations/internal/cell": typeof mutations_internal_cell;
  "mutations/internal/game": typeof mutations_internal_game;
  "mutations/internal/move": typeof mutations_internal_move;
  "mutations/internal/player": typeof mutations_internal_player;
  "mutations/internal/tile": typeof mutations_internal_tile;
  "mutations/internal/user": typeof mutations_internal_user;
  "mutations/public/game": typeof mutations_public_game;
  "mutations/public/play": typeof mutations_public_play;
  "mutations/public/tile": typeof mutations_public_tile;
  "queries/game": typeof queries_game;
  "queries/play": typeof queries_play;
  "queries/player": typeof queries_player;
  "queries/user": typeof queries_user;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
