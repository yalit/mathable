import { User } from "../User.ts";
import type { Doc } from "../../../_generated/dataModel";

/**
 * Create a User domain model from a database document
 * Factory function that creates a User from a database doc
 * @param doc - Database document for a user
 * @returns User
 */
export const userFromDoc = (doc: Doc<"users">): User => {
    return new User(
        doc._id,
        doc.sessionId,
    );
};
