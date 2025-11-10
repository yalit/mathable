import { User } from "../User.ts";
import { UUID } from "./uuid.factory.ts";
import type { Doc, Id } from "../../../_generated/dataModel";
import type { SessionId } from "convex-helpers/server/sessions";

/**
 * Create a new User instance
 * Factory function for creating a user with specified parameters
 * @param id - User ID (null to generate)
 * @param sessionId - Session ID
 * @param name - User name
 * @returns User
 */
export const createUser = (
    id: Id<"users"> | null,
    sessionId: SessionId,
    name: string
): User => {
    return new User(
        id ?? UUID() as Id<"users">,
        sessionId,
        name
    );
};

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
        doc.name
    );
};
