# Social Frames Automation: Google Form to GitHub

Follow this guide to automatically add new brands to your `data.json` whenever someone submits your Google Form.

## Prerequisites
1.  **GitHub Repo**: You already have this (`rjarivi/Social-Frames`).
2.  **Google Sheet**: Linked to your submission form.
3.  **GitHub Token**: A Personal Access Token (PAT) to allow the script to write to your repo.

---

## Step 1: Get GitHub Access Token
1.  Go to [GitHub Settings > Developer Settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens).
2.  Click **Generate new token (classic)**.
3.  **Note:** "Social Frames Auto Updater".
4.  **Scopes:** Check `repo` (this allows read/write access to your repo).
5.  Click **Generate token**.
6.  **COPY THIS TOKEN IMMEDIATELY**. You won't see it again.

---

## Step 2: Setup Google Apps Script
1.  Open your **Google Sheet** (where form responses go).
2.  Go to top menu: `Extensions` > `Apps Script`.
3.  Delete any code in `Code.gs` and paste the script below.
4.  Update the **CONFIG** section at the top with your details.

```javascript
// --- CONFIGURATION ---
const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN_HERE'; 
const REPO_OWNER = 'rjarivi';
const REPO_NAME = 'Social-Frames';
const FILE_PATH = 'assets/js/data.js'; // Changed to JS file
const BRANCH = 'main';

// Function triggered on Form Submit
function onFormSubmit(e) {
  // 1. Get Data from Form
  const responses = e.namedValues;
  
  const brandName = responses['Community Name'][0]; 
  const brandDesc = responses['Short Description / Slogan'][0];
  const logoUrl = responses['Community Logo URL'][0];
  const framesText = responses['Frame Template URLs'][0];
  const contact = responses['Your Email / Discord Handle'][0]; 

  const brandId = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const frameUrls = framesText.split(/\r?\n/).map(url => url.trim()).filter(url => url.length > 0);

  const newEntry = {
    id: brandId,
    name: brandName,
    logo: logoUrl,
    description: brandDesc,
    frames: frameUrls
  };

  try {
    updateGitHubFile(newEntry);
    console.log(`Successfully added: ${brandName}`);
  } catch (err) {
    console.error(`Error adding ${brandName}: ${err.toString()}`);
  }
}

function updateGitHubFile(newEntry) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  const options = {
    method: "get",
    headers: {
      "Authorization": "token " + GITHUB_TOKEN,
      "Accept": "application/vnd.github.v3+json"
    }
  };

  // A. Get current file
  const response = UrlFetchApp.fetch(url, options);
  const fileData = JSON.parse(response.getContentText());
  const blob = Utilities.newBlob(Utilities.base64Decode(fileData.content));
  let fileContent = blob.getDataAsString();
  const sha = fileData.sha;

  // B. Extract JSON from JS "window.brands = [...];"
  // Remove "window.brands =" from start and ";" from end
  const jsonString = fileContent.replace('window.brands =', '').replace(';', '').trim();
  
  let brands = JSON.parse(jsonString);
  
  // Update or Append
  const existingIndex = brands.findIndex(b => b.id === newEntry.id);
  if (existingIndex > -1) {
    brands[existingIndex] = newEntry; 
  } else {
    brands.push(newEntry); 
  }

  // C. Reconstruct JS Content
  const newJson = JSON.stringify(brands, null, 4);
  const newFileContent = `window.brands = ${newJson};`;
  const encodedContent = Utilities.base64Encode(newFileContent);

  // D. Commit
  const payload = {
    message: `Auto-add brand: ${newEntry.name}`,
    content: encodedContent,
    sha: sha,
    branch: BRANCH
  };
  
  const updateOptions = {
    method: "put",
    headers: {
      "Authorization": "token " + GITHUB_TOKEN,
      "Accept": "application/vnd.github.v3+json"
    },
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch(url, updateOptions);
}
```

---

## Step 3: Activate Trigger
1.  In the Apps Script editor, click the **Triggers** icon (alarm clock) on the left sidebar.
2.  Click **+ Add Trigger** (bottom right).
3.  Settings:
    *   Choose function: `onFormSubmit`
    *   Select event source: `From spreadsheet`
    *   Select event type: `On form submit`
4.  Click **Save**. You will need to authorize the script with your Google Account.

## Done! 
Now, whenever someone fills your form:
1.  The script runs automatically.
2.  It reads the image URLs.
3.  It updates `assets/data.json` in your GitHub repo.
4.  GitHub Pages (if active) will rebuild your site within a minute or two with the new brand!
