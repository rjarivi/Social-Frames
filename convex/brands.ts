import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to check if string is a storage ID
const isStorageId = (str: string) => str.length > 15 && !str.startsWith("http");

// 1. Get only APPROVED brands for the public site
export const getBrands = query({
    args: {},
    handler: async (ctx) => {
        const brands = await ctx.db
            .query("brands")
            .filter((q) => q.eq(q.field("status"), "approved"))
            .order("desc")
            .collect();

        // Map storage IDs to URLs
        return await Promise.all(
            brands.map(async (b) => ({
                ...b,
                logo: isStorageId(b.logo) ? (await ctx.storage.getUrl(b.logo)) || b.logo : b.logo,
                frames: await Promise.all(
                    b.frames.map(async (f) =>
                        isStorageId(f) ? (await ctx.storage.getUrl(f)) || f : f
                    )
                ),
            }))
        );
    },
});

// 2. Generate Upload URL (for file uploads)
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

// 3. Submit a new brand
export const submitBrand = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        logo: v.string(), // Can be URL or Storage ID
        frames: v.array(v.string()), // Can be URL or Storage IDs
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("brands", {
            name: args.name,
            description: args.description,
            logo: args.logo,
            frames: args.frames,
            status: "pending", // Must be approved by you later
            submittedAt: Date.now(),
        });
    },
});
