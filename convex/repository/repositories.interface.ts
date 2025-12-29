import type {Doc, Id, TableNames} from "../_generated/dataModel";

export interface QueryRepositoryInterface<T, D extends TableNames> {
    findAll: () => Promise<T[]>;
    find: (id: Id<D>) => Promise<T | null>;
}

export type DocData<T extends TableNames> = Omit<Doc<T>, "_id"|"_creationTime">

export interface MutationRepositoryInterface<T, D extends TableNames> {
    // save function to be added when all the repositories will be updated
    new: (data: DocData<D>) => Promise<T>;
    delete: (t: T) => Promise<void>;
    save: (t: T) => Promise<T>
}