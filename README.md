# Reddit Puppeteer Automation

This project contains automation scripts for Reddit using Puppeteer. It includes both JavaScript and TypeScript versions of a script that navigates to the gaming subreddit, finds a post, and votes based on the title.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- A Reddit account (or use the one provided in this README file)

## Setup

1. **Clone or download** this repository.
2. **Install dependencies**:
   ```bash
   npm install
   ```
   *This will install Puppeteer, TypeScript, and ts-node.*
3. **Configure environment variables**:
   Create a `.env` file in the root directory (or update the existing one) with your Reddit credentials:
   ```env
   EMAIL=your_email@example.com
   PASSWORD=your_password
   USERNAME=your_username
   ```

   ***Test Account***:
   ```env
   EMAIL=wo78i@dollicons.com
   PASSWORD=TestPassword
   USERNAME=Loud_Somewhere_2691
   ```

## Execution

### Running the JavaScript Version
To run the JavaScript version of the script:
```bash
node oldreddit.js
```

### Running the TypeScript Version

Once dependencies are installed via `npm install`, you can run the script:

```bash
npx ts-node oldreddit.ts
```

## Customization

### Targeting a Specific Post
You can change which post the script interacts with by modifying the `TARGET_POST_NUMBER` variable at the top of the `main()` function in either `oldreddit.js` or `oldreddit.ts`.

- **Effect**: This number determines which "eligible" post (skipping pinned/ads) the script will select from the top of the subreddit.
- **Default**: `2` (targets the 2nd eligible post).
- **How to change**:
  ```typescript
  // oldreddit.ts or oldreddit.js
  const TARGET_POST_NUMBER = 2; // Change this to 3 to target 3rd post etc
  ```

## Features

- **Automated Login**: Logs into old.reddit.com using environment variables.
- **Subreddit Navigation**: Searches for `gaming` and clicks link to navigate to `r/gaming`.
- **Intelligent Voting**: 
  - Automatically skips pinned (stickied) and promoted posts.
  - Votes based on keywords (e.g., Upvotes if "Nintendo" or "nintendo" is found, Downvotes otherwise).
  - Handles cases where said post is already voted.
- **Screenshots**: Captures screenshots at every major step for debugging and verification, saved in the `./screenshots` directory.

## Improvements

There are always several room for improvement. These are some of the plans I had in mind:

- **Modularize DOM Checks**: Separate the logic for finding eligible posts (`targetEligible`) and checking voting states into dedicated functions outside of `main()`. Have these helper functions return their results (like post details or vote status) back to the `main` function to keep the primary flow clean and readable.
- **Enhanced Error Handling**: Individual functions can implement better error reporting for specific failures (e.g., distinguishing between a network error and a selector change).
- **Dynamic Keywords**: Instead of hardcoding "Nintendo", allow the search keyword and voting rules (upvote/downvote criteria) to be passed as arguments or configuration variables.
- **Retry Logic**: Implement a retry mechanism for transient network failures or slow element loading to make the script more resilient.
- **Wait for Navigation**: Replace `delay(2000)` with more robust Puppeteer wait methods like `page.waitForNavigation()` or checking for specific element state changes to improve reliability and speed. I did try this but was seeing issues with the script failing hence the use of `delay`.
- **Configurable Subreddit**: Allow the target subreddit (currently hardcoded as "gaming") to be specified via an environment variable.


