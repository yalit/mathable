import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { internalMutation, mutation, query } from "../_generated/server";
import { GamesQueryRepository } from "../repository/query/games.repository";
import { type DataModel } from "../_generated/dataModel";
import type {
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from "convex/server";
import { PlayersQueryRepository } from "../repository/query/players.repository.ts";
import { TilesQueryRepository } from "../repository/query/tiles.repository.ts";
import { UsersQueryRepository } from "../repository/query/users.repository.ts";
import { UsersMutationRepository } from "../repository/mutations/users.repository.ts";
import { CellsQueryRepository } from "../repository/query/cells.repository.ts";
import { PlayersMutationRepository } from "../repository/mutations/players.repository.ts";
import { MovesQueryRepository } from "../repository/query/moves.repository.ts";
import { GamesMutationRepository } from "../repository/mutations/games.repository.ts";
import { CellsMutationRepository } from "../repository/mutations/cells.repository.ts";
import { TilesMutationRepository } from "../repository/mutations/tiles.repository.ts";
import { MovesMutationRepository } from "../repository/mutations/moves.repository.ts";

const initQueryRepositories = async (
  db: GenericDatabaseReader<DataModel>,
): Promise<void> => {
  GamesQueryRepository.create(db);
  PlayersQueryRepository.create(db);
  CellsQueryRepository.create(db);
  TilesQueryRepository.create(db);
  MovesQueryRepository.create(db);
  UsersQueryRepository.create(db);
};

const initMutationRepositories = async (
  db: GenericDatabaseWriter<DataModel>,
): Promise<void> => {
  GamesMutationRepository.create(db);
  PlayersMutationRepository.create(db);
  CellsMutationRepository.create(db);
  TilesMutationRepository.create(db);
  MovesMutationRepository.create(db);
  UsersMutationRepository.create(db);
};

export const withRepositoryQuery = customQuery(query, {
  args: {},
  input: async (ctx) => {
    await initQueryRepositories(ctx.db);
    return { ctx, args: {} };
  },
});

export const withRepositoryMutation = customMutation(mutation, {
  args: {},
  input: async (ctx) => {
    await initQueryRepositories(ctx.db);
    await initMutationRepositories(ctx.db);
    return { ctx, args: {} };
  },
});

export const withRepositoryInternalMutation = customMutation(internalMutation, {
  args: {},
  input: async (ctx) => {
    await initQueryRepositories(ctx.db);
    await initMutationRepositories(ctx.db);
    return { ctx, args: {} };
  },
});
