/// <reference types="vite/client" />

// Declare global for Lucide if loaded via script tag
declare const lucide: any;

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// Hardcode fallback because .env is struggling
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://greedy-puffin-630.convex.cloud";
const convex = new ConvexHttpClient(convexUrl);

console.log("🚀 Submit script initialized");
window.addEventListener('error', (e) => console.error("Script Error:", e.message));

const form = document.getElementById('submission-form') as HTMLFormElement;
console.log("Form Element found:", !!form);
console.log("Convex Client initialized:", !!convex);

if (!form) alert("Critical Error: Form not found in DOM");

// Helper to upload file
async function uploadFile(file: File) {
    if (!file) return null;

    if (!convex) throw new Error("Convex client not initialized");

    // 1. Get URL
    const postUrl = await convex.mutation(api.brands.generateUploadUrl);

    // 2. Upload
    const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
    });

    if (!result.ok) throw new Error(`Upload failed: ${result.statusText}`);

    // 3. Return Storage ID
    const { storageId } = await result.json();
    return storageId;
}

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("🟢 Submit button clicked / Form submitted");

        if (!convex) {
            console.error("❌ No Convex Client");
            alert("Error: Database connection not configured.");
            return;
        }

        const submitBtn = form.querySelector('button') as HTMLButtonElement;
        const originalText = submitBtn.textContent || "Submit";
        submitBtn.textContent = "Uploading...";
        submitBtn.disabled = true;

        try {
            const nameInput = document.getElementById('name') as HTMLInputElement;
            const descInput = document.getElementById('desc') as HTMLInputElement;
            const logoInput = document.getElementById('logo') as HTMLInputElement;
            const frameInput = document.getElementById('frame') as HTMLInputElement;

            const name = nameInput.value;
            const description = descInput.value;
            const logoFile = logoInput.files ? logoInput.files[0] : null;
            const frameFile = frameInput.files ? frameInput.files[0] : null;

            if (!logoFile || !frameFile) {
                alert("Please select both a logo and a frame.");
                throw new Error("Missing files");
            }

            // Upload files FIRST
            submitBtn.textContent = "Uploading Logo...";
            const logoId = await uploadFile(logoFile);

            submitBtn.textContent = "Uploading Frame...";
            const frameId = await uploadFile(frameFile);

            submitBtn.textContent = "Submitting...";

            // Call the mutation with IDs
            await convex.mutation(api.brands.submitBrand, {
                name,
                description,
                logo: logoId,
                frames: [frameId]
            });

            // Show Custom Modal
            const successModal = document.getElementById('success-modal');
            if (successModal) {
                successModal.classList.add('open');
                lucide.createIcons();
            }
            form.reset();

        } catch (error) {
            console.error(error);
            alert("Something went wrong during upload. Check console.");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}
