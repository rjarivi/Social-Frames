import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    brands: defineTable({
        name: v.string(),
        description: v.string(),
        logo: v.string(), // URL to logo
        frames: v.array(v.string()), // Array of frame URLs
        status: v.union(v.literal("pending"), v.literal("approved")), // For moderation
        submittedAt: v.number(),
    }),
});
