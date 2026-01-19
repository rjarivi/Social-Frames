# Automation Guide: Transition to Convex

This guide outlines the steps to move from a static `data.js` file to a dynamic, automated database using **Convex**. This will allow real-time updates and automated submissions.

## Prerequisites
- [x] Node.js installed
- [ ] Convex account (sign up at [console.convex.dev](https://console.convex.dev))

## Step 1: Initialize Convex
1.  **Install the Convex package**:
    ```bash
    npm install convex
    ```
2.  **Initialize the project**:
    ```bash
    npx convex dev
    ```
    *   Follow the prompts to log in and create a new project.
    *   This will create a `convex/` folder in your directory.

## Step 2: Define Schema & Functions
You need to define what your data looks like and how to access it.

1.  **Create Schema** (`convex/schema.ts`):
    Define a simple table for `brands` with a status field for moderation.
    ```typescript
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
    ```

2.  **Create Functions** (`convex/brands.ts`):
    Create functions to Fetch (read) and Submit (write).

    ```typescript
    import { query, mutation } from "./_generated/server";
    import { v } from "convex/values";

    // 1. Get only APPROVED brands for the public site
    export const getBrands = query({
      args: {},
      handler: async (ctx) => {
        return await ctx.db
          .query("brands")
          .filter((q) => q.eq(q.field("status"), "approved"))
          .order("desc")
          .collect();
      },
    });

    // 2. Submit a new brand (defaults to pending)
    export const submitBrand = mutation({
      args: {
        name: v.string(),
        description: v.string(),
        logo: v.string(),
        frames: v.array(v.string()),
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
    ```

## Step 3: Frontend Integration
To use Convex in your browser, you need to bundle your JavaScript. We'll use **Vite** (since you already have a `package.json`, this is easy).

1.  **Install Vite** (if not done):
    ```bash
    npm install -D vite
    ```

2.  **Update `package.json` scripts**:
    ```json
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview",
      "convex": "convex dev"
    }
    ```

3.  **Update `assets/js/home.js`**:
    Import the Convex client and replace the static data loading.

    ```javascript
    import { ConvexHttpClient } from "convex/browser";
    import { api } from "../convex/_generated/api";

    // Initialize Client (get URL from .env.local created by npx convex dev)
    const convex = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);

    async function loadBrands() {
        // Fetch from Convex instead of window.brands
        const brands = await convex.query(api.brands.getBrands);
        window.brands = brands; // Keep compatibility with your render logic
        renderCards(); // Call your existing render function
    }

    loadBrands();
    ```

4.  **Create `.env` file** (Vite requires `VITE_` prefix):
    When you run `npx convex dev`, it puts the URL in `.env.local`. Ensure your code uses `import.meta.env.VITE_CONVEX_URL`. You might need to manually copy `CONVEX_URL` to `VITE_CONVEX_URL` in your `.env` file.

## Step 4: Automating Submissions
You have two options for the "Form":

### Option A: Build a Submission Page (Recommended)
Create a `submit.html` where users enter Name, Logo URL, and Frame URLs.

1.  Create `submit.html` with a form.
2.  Create `assets/js/submit.js` that imports `convex` and calls `submitBrand`:
    ```javascript
    // ... setup client ...
    document.getElementById('submit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await convex.mutation(api.brands.submitBrand, {
             name: form.name.value,
             // ...
        });
        alert("Submitted for review!");
    });
    ```

### Option B: Keep Google Forms (Zapier Style)
If you want to keep Google Forms:
1.  Use a service like Zapier or Make.com.
2.  Trigger: New Row in Google Sheets.
3.  Action: HTTP Request (POST) to a Convex HTTP Action (you'd need to write an `httpAction` in Convex to accept webhooks).

**Recommendation**: Build the **Submission Page** (Option A). It keeps everything in one app and is free.

## Step 5: Administration
How do you approve brands?
1.  Go to your **Convex Dashboard** (web UI).
2.  Go to "Data" -> "brands".
3.  Find "pending" rows and edit them to "approved".
4.  The site updates **instantly** for everyone.

