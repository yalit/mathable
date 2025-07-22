import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  game: defineTable({
    name: v.string(),
    token: v.string(),
    status: v.string(),
  }),
});
