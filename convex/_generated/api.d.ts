/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as controllers_cell_queries from "../controllers/cell/queries.js";
import type * as controllers_game_mutations from "../controllers/game/mutations.js";
import type * as controllers_game_queries from "../controllers/game/queries.js";
import type * as controllers_play_mutations from "../controllers/play/mutations.js";
import type * as controllers_player_queries from "../controllers/player/queries.js";
import type * as controllers_tile_queries from "../controllers/tile/queries.js";
import type * as controllers_user_queries from "../controllers/user/queries.js";
import type * as domain_models_Cell from "../domain/models/Cell.js";
import type * as domain_models_Game from "../domain/models/Game.js";
import type * as domain_models_Move from "../domain/models/Move.js";
import type * as domain_models_Player from "../domain/models/Player.js";
import type * as domain_models_Tile from "../domain/models/Tile.js";
import type * as domain_models_User from "../domain/models/User.js";
import type * as helpers_array from "../helpers/array.js";
import type * as infrastructure_ContainerFactory from "../infrastructure/ContainerFactory.js";
import type * as infrastructure_ServiceConfiguration from "../infrastructure/ServiceConfiguration.js";
import type * as infrastructure_ServiceContainer from "../infrastructure/ServiceContainer.js";
import type * as infrastructure_ServiceRegistry from "../infrastructure/ServiceRegistry.js";
import type * as mutations_public_tile from "../mutations/public/tile.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "controllers/cell/queries": typeof controllers_cell_queries;
  "controllers/game/mutations": typeof controllers_game_mutations;
  "controllers/game/queries": typeof controllers_game_queries;
  "controllers/play/mutations": typeof controllers_play_mutations;
  "controllers/player/queries": typeof controllers_player_queries;
  "controllers/tile/queries": typeof controllers_tile_queries;
  "controllers/user/queries": typeof controllers_user_queries;
  "domain/models/Cell": typeof domain_models_Cell;
  "domain/models/Game": typeof domain_models_Game;
  "domain/models/Move": typeof domain_models_Move;
  "domain/models/Player": typeof domain_models_Player;
  "domain/models/Tile": typeof domain_models_Tile;
  "domain/models/User": typeof domain_models_User;
  "helpers/array": typeof helpers_array;
  "infrastructure/ContainerFactory": typeof infrastructure_ContainerFactory;
  "infrastructure/ServiceConfiguration": typeof infrastructure_ServiceConfiguration;
  "infrastructure/ServiceContainer": typeof infrastructure_ServiceContainer;
  "infrastructure/ServiceRegistry": typeof infrastructure_ServiceRegistry;
  "mutations/public/tile": typeof mutations_public_tile;
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
