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
To run the TypeScript version directly using `ts-node`:
```bash
npx ts-node oldreddit.ts
```

Alternatively, you can compile it first:
```bash
npx tsc
npx ts-node oldreddit.js
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
- **Subreddit Navigation**: Searches for and navigates to `r/gaming`.
- **Intelligent Voting**: 
  - Automatically skips pinned (stickied) and promoted posts.
  - Votes based on keywords (e.g., Upvotes if "Nintendo" or "nintendo" is found, Downvotes otherwise).
  - Handles cases where a post is already voted.
- **Screenshots**: Captures screenshots at every major step for debugging and verification, saved in the `./screenshots` directory.
