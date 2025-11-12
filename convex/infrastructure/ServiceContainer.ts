import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { PlayersQueryRepositoryInterface } from "../repository/query/players.repository";
import type { GamesQueryRepositoryInterface } from "../repository/query/games.repository";
import type { TilesQueryRepositoryInterface } from "../repository/query/tiles.repository";
import type { MovesQueryRepositoryInterface } from "../repository/query/moves.repository";
import type { CellsQueryRepositoryInterface } from "../repository/query/cells.repository";
import type { UsersQueryRepositoryInterface } from "../repository/query/users.repository";
import type { PlayersMutationRepositoryInterface } from "../repository/mutations/players.repository";
import type { GamesMutationRepositoryInterface } from "../repository/mutations/games.repository";
import type { TilesMutationRepositoryInterface } from "../repository/mutations/tiles.repository";
import type { MovesMutationRepositoryInterface } from "../repository/mutations/moves.repository";
import type { CellsMutationRepositoryInterface } from "../repository/mutations/cells.repository";
import type { UsersMutationRepositoryInterface } from "../repository/mutations/users.repository";
import { PlayersQueryRepository } from "../repository/query/players.repository";
import { GamesQueryRepository } from "../repository/query/games.repository";
import { TilesQueryRepository } from "../repository/query/tiles.repository";
import { MovesQueryRepository } from "../repository/query/moves.repository";
import { CellsQueryRepository } from "../repository/query/cells.repository";
import { UsersQueryRepository } from "../repository/query/users.repository";
import { PlayersMutationRepository } from "../repository/mutations/players.repository";
import { GamesMutationRepository } from "../repository/mutations/games.repository";
import { TilesMutationRepository } from "../repository/mutations/tiles.repository";
import { MovesMutationRepository } from "../repository/mutations/moves.repository";
import { CellsMutationRepository } from "../repository/mutations/cells.repository";
import { UsersMutationRepository } from "../repository/mutations/users.repository";

/**
 * ServiceContainer - Dependency Injection Container
 *
 * Manages all service instances (repositories, future services) with:
 * - Interface-based dependency injection
 * - Type-safe service resolution
 * - Request-scoped lifecycle (not singleton)
 * - Centralized service creation
 *
 * Usage:
 * const container = createContainer(ctx);
 * const game = await container.gamesQuery.find(gameId);
 */
export class ServiceContainer {
  // Query Repositories
  private _playersQuery: PlayersQueryRepositoryInterface;
  private _gamesQuery: GamesQueryRepositoryInterface;
  private _tilesQuery: TilesQueryRepositoryInterface;
  private _movesQuery: MovesQueryRepositoryInterface;
  private _cellsQuery: CellsQueryRepositoryInterface;
  private _usersQuery: UsersQueryRepositoryInterface;

  // Mutation Repositories (only available in mutation context)
  private _playersMutation?: PlayersMutationRepositoryInterface;
  private _gamesMutation?: GamesMutationRepositoryInterface;
  private _tilesMutation?: TilesMutationRepositoryInterface;
  private _movesMutation?: MovesMutationRepositoryInterface;
  private _cellsMutation?: CellsMutationRepositoryInterface;
  private _usersMutation?: UsersMutationRepositoryInterface;

  /**
   * Create container from Convex context
   * @param ctx - MutationCtx or QueryCtx
   */
  constructor(ctx: MutationCtx | QueryCtx) {
    // Initialize Query Repositories (available in both query and mutation contexts)
    this._playersQuery = PlayersQueryRepository.create(ctx.db);
    this._gamesQuery = GamesQueryRepository.create(ctx.db);
    this._tilesQuery = TilesQueryRepository.create(ctx.db);
    this._movesQuery = MovesQueryRepository.create(ctx.db);
    this._cellsQuery = CellsQueryRepository.create(ctx.db);
    this._usersQuery = UsersQueryRepository.create(ctx.db);

    // Initialize Mutation Repositories (only in mutation context)
    if ("db" in ctx && typeof ctx.db.insert === "function") {
      const mutationCtx = ctx as MutationCtx;
      this._playersMutation = PlayersMutationRepository.create(mutationCtx.db);
      this._gamesMutation = GamesMutationRepository.create(mutationCtx.db);
      this._tilesMutation = TilesMutationRepository.create(mutationCtx.db);
      this._movesMutation = MovesMutationRepository.create(mutationCtx.db);
      this._cellsMutation = CellsMutationRepository.create(mutationCtx.db);
      this._usersMutation = UsersMutationRepository.create(mutationCtx.db);
    }
  }

  // ========================================
  // Query Repository Getters
  // ========================================

  get playersQuery(): PlayersQueryRepositoryInterface {
    return this._playersQuery;
  }

  get gamesQuery(): GamesQueryRepositoryInterface {
    return this._gamesQuery;
  }

  get tilesQuery(): TilesQueryRepositoryInterface {
    return this._tilesQuery;
  }

  get movesQuery(): MovesQueryRepositoryInterface {
    return this._movesQuery;
  }

  get cellsQuery(): CellsQueryRepositoryInterface {
    return this._cellsQuery;
  }

  get usersQuery(): UsersQueryRepositoryInterface {
    return this._usersQuery;
  }

  // ========================================
  // Mutation Repository Getters
  // ========================================

  get playersMutation(): PlayersMutationRepositoryInterface {
    if (!this._playersMutation) {
      throw new Error("Mutation repositories are only available in mutation context");
    }
    return this._playersMutation;
  }

  get gamesMutation(): GamesMutationRepositoryInterface {
    if (!this._gamesMutation) {
      throw new Error("Mutation repositories are only available in mutation context");
    }
    return this._gamesMutation;
  }

  get tilesMutation(): TilesMutationRepositoryInterface {
    if (!this._tilesMutation) {
      throw new Error("Mutation repositories are only available in mutation context");
    }
    return this._tilesMutation;
  }

  get movesMutation(): MovesMutationRepositoryInterface {
    if (!this._movesMutation) {
      throw new Error("Mutation repositories are only available in mutation context");
    }
    return this._movesMutation;
  }

  get cellsMutation(): CellsMutationRepositoryInterface {
    if (!this._cellsMutation) {
      throw new Error("Mutation repositories are only available in mutation context");
    }
    return this._cellsMutation;
  }

  get usersMutation(): UsersMutationRepositoryInterface {
    if (!this._usersMutation) {
      throw new Error("Mutation repositories are only available in mutation context");
    }
    return this._usersMutation;
  }
}
