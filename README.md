# How to Add Your Brand to Social Frames

We welcome community contributions! You can add your own brand/community frames to this site.

## Option 1: The Easy Way (Google Form)
If you're not a developer, simply fill out our request form with your details and asset links. We will handle the code for you!

👉 **[Submit Request via Google Form](https://docs.google.com/forms/d/e/1FAIpQLSdIzp6r3iaD_6jeKO3ikiSbFnqsNDvEqt4nxImGlQvvs_jbZw/viewform)**

## Option 2: The Developer Way (GitHub)

1.  **Fork this Repository**  
    Click the "Fork" button at the top right to create your own copy.

2.  **Add Your Assets**  
    Navigate to `assets/brands/` and create a new folder (e.g., `my-community`).
    *   Add your **Logo** (SVG or PNG).
    *   Add your **Frame Templates** (PNG with transparency).

3.  **Update Configuration**  
    Open `assets/js/data.js` and add a new entry to the `window.brands` array:

    ```javascript
    {
      id: 'my-community',
      name: 'My Community',
      logo: 'assets/brands/my-community/logo.png',
      description: 'The best community ever',
      frames: [
        'assets/brands/my-community/frame1.png',
        'assets/brands/my-community/frame2.png'
      ]
    }
    ```

4.  **Submit a Pull Request**  
    Commit your changes and submit a PR to the main repository.

---

### Asset Requirements
*   **Logos**: High-quality PNG or SVG (Transparent background).
*   **Frames**: 1080x1080 PNG with transparency in the center for the user's photo.
