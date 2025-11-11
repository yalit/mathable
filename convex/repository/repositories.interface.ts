import type {Doc, Id, TableNames} from "../_generated/dataModel";

export interface QueryRepositoryInterface<T extends TableNames> {
    findAll: () => Promise<Doc<T>[]>;
    find: (id: Id<T>) => Promise<Doc<T> | null>;
}

export interface MutationRepositoryInterface<T extends TableNames> {
    // save function to be added when all the repositories will be updated
    delete: (id: Id<T>) => Promise<void>;
}