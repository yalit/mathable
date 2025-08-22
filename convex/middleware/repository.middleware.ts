import {customMutation, customQuery} from "convex-helpers/server/customFunctions";
import {internalMutation, mutation, query} from "../_generated/server";
import {GamesQueryRepository} from "../repository/query/game.repository";
import {type DataModel} from "../_generated/dataModel";
import type {GenericDatabaseReader, GenericDatabaseWriter} from "convex/server";
import { PlayersQueryRepository} from "../repository/query/players.repository.ts";
import { TilesQueryRepository } from "../repository/query/tiles.repository.ts";
import { UsersQueryRepository } from "../repository/query/users.repository.ts";
import { UsersMutationRepository } from "../repository/mutations/users.repository.ts";
import {CellsQueryRepository} from "../repository/query/cells.repository.ts";
import { PlayersMutationRepository } from "../repository/mutations/players.repository.ts";
import {MovesQueryRepository} from "../repository/query/moves.repository.ts";

const initQueryRepositories = (db: GenericDatabaseReader<DataModel>): void => {
    GamesQueryRepository.create(db)
    PlayersQueryRepository.create(db)
    CellsQueryRepository.create(db)
    TilesQueryRepository.create(db)
    MovesQueryRepository.create(db)
    UsersQueryRepository.create(db)
}

const initMutationRepositories = (db: GenericDatabaseWriter<DataModel>): void => {
    GamesQueryRepository.create(db)
    PlayersMutationRepository.create(db)
    CellsQueryRepository.create(db)
    TilesQueryRepository.create(db)
    MovesQueryRepository.create(db)
    UsersMutationRepository.create(db)
}

export const withRepositoryQuery = customQuery(query, {
        args: {},
        input: async (ctx) => {
            initQueryRepositories(ctx.db)
            return {ctx, args: {},}
        }
    }
)

export const withRepositoryMutation = customMutation(mutation, {
        args: {},
        input: async (ctx) => {
            initQueryRepositories(ctx.db)
            initMutationRepositories(ctx.db)
            return {ctx, args: {},}
        }
    }
)

export const withRepositoryInternalMutation = customMutation(internalMutation, {
        args: {},
        input: async (ctx) => {
            initQueryRepositories(ctx.db)
            initMutationRepositories(ctx.db)
            return {ctx, args: {},}
        }
    }
)
