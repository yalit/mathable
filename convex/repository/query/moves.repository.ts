import type { DataModel, Doc, Id } from "../../_generated/dataModel";
import type { GenericDatabaseReader } from "convex/server";
import type { QueryRepositoryInterface } from "../../repository/repositories.interface.ts";
import type { Move } from "../../domain/models/Move.ts";
import type { Game } from "../../domain/models/Game.ts";
import { moveFromDoc } from "../../domain/models/factory/move.factory.ts";

export interface MovesQueryRepositoryInterface
  extends QueryRepositoryInterface<Move, "moves"> {
  findAllForCurrentTurn: (game: Game) => Promise<Move[]>;
  findLast: (game: Game) => Promise<Move | null>;
  findLastPlayerToCellMove: (game: Game) => Promise<Move | null>;
}

export class MovesQueryRepository implements MovesQueryRepositoryInterface {
  static instance: MovesQueryRepository;
  private db: GenericDatabaseReader<DataModel>;

  constructor(db: GenericDatabaseReader<DataModel>) {
    this.db = db;
  }

  static create(
    db: GenericDatabaseReader<DataModel>,
  ): MovesQueryRepositoryInterface {
    if (!MovesQueryRepository.instance) {
      MovesQueryRepository.instance = new MovesQueryRepository(db);
    }
    return MovesQueryRepository.instance;
  }

  async fromDocs(docs: Doc<"moves">[]): Promise<Move[]> {
    return docs.map((d: Doc<"moves">) => moveFromDoc(d));
  }
  async findAll(): Promise<Move[]> {
    return this.fromDocs(await this.db.query("moves").collect());
  }

  async find(id: Id<"moves">): Promise<Move | null> {
    const move = await this.db.get(id);

    if (!move) return null;
    return moveFromDoc(move);
  }

  async findAllForCurrentTurn(game: Game): Promise<Move[]> {
    const gameId = game.id;
    if (!gameId) return [];

    return this.fromDocs(
      await this.db
        .query("moves")
        .withIndex("by_turn", (q) =>
          q.eq("gameId", gameId).eq("turn", game.currentTurn),
        )
        .order("desc")
        .collect(),
    );
  }

  async findLast(game: Game): Promise<Move | null> {
    const gameId = game.id;
    if (!gameId) return null;

    const lastMoves = await this.fromDocs(
      await this.db
        .query("moves")
        .withIndex("by_game", (q) => q.eq("gameId", gameId))
        .order("desc")
        .take(1),
    );

    if (lastMoves.length == 0) return null;
    return lastMoves[0];
  }

  /**
   * Find the last PLAYER_TO_CELL move (actual tile placement) for a game.
   * This is used for idle detection - we only care about when players last placed tiles,
   * not other move types like CELL_TO_PLAYER (resets) or BAG_TO_PLAYER (tile draws).
   */
  async findLastPlayerToCellMove(game: Game): Promise<Move | null> {
    const gameId = game.id;
    if (!gameId) return null;

    // Get all moves for this game in descending order (newest first)
    const allMoves = await this.fromDocs(
      await this.db
        .query("moves")
        .withIndex("by_game", (q) => q.eq("gameId", gameId))
        .order("desc")
        .collect(),
    );

    // Find the first PLAYER_TO_CELL move (which is the most recent due to desc order)
    const lastPlayerToCellMove = allMoves.find((move) => move.isPlayerToCell());

    return lastPlayerToCellMove || null;
  }
}
