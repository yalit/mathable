import type { Game } from "../../models/Game.ts";
import type { MovesQueryRepositoryInterface } from "../../../repository/query/moves.repository.ts";
import type { Cell } from "../../models/Cell.ts";
import type { Tile } from "../../models/Tile.ts";
import { countItems } from "../../../lib/array.ts";

export interface ScoreServiceInterface {
  getCurrentTurnScore: (game: Game) => Promise<number>;
  computeMoveScore: (cell: Cell, tile: Tile) => number;
}

export class ScoreService implements ScoreServiceInterface {
  private static instance: ScoreServiceInterface;
  private readonly movesQuery: MovesQueryRepositoryInterface;

  constructor(movesQuery: MovesQueryRepositoryInterface) {
    this.movesQuery = movesQuery;
  }

  static create(movesQuery: MovesQueryRepositoryInterface) {
    if (!ScoreService.instance) {
      ScoreService.instance = new ScoreService(movesQuery);
    }

    return ScoreService.instance;
  }

  async getCurrentTurnScore(game: Game): Promise<number> {
    const moves = await this.movesQuery.findAllForCurrentTurn(game);
    return moves.reduce((score, m) => score + m.score, 0);
  }

  computeMoveScore(cell: Cell, tile: Tile): number {
    const tileValue = tile.value;
    const occurrenceCount = countItems(
      cell.allowedValues as number[],
      tileValue,
    );
    const baseScore = tileValue * occurrenceCount;

    // Apply multiplier if cell is a MultiplierCell
    if (cell.isMultiplierCell()) {
      return baseScore * cell.multiplier;
    }

    return baseScore;
  }
}

