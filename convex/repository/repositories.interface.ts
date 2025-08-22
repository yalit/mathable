import type {Doc, Id, TableNames} from "../_generated/dataModel";

export interface QueryRepositoryInterface<T extends TableNames> {
    findAll: () => Promise<Doc<T>[]>;
    find: (id: Id<T>) => Promise<Doc<T> | null>;
}

export interface MutationRepositoryInterface<T extends TableNames> {
    new: (data: Partial<Doc<T>>) => Promise<Id<T>>;
    patch: (doc: Doc<T>, data: Partial<Doc<T>>) => Promise<void>;
    delete: (id: Id<T>) => Promise<void>;
}