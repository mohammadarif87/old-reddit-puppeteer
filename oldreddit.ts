import * as dotenv from "dotenv";
import puppeteer, { Browser, Page, ElementHandle } from "puppeteer";

dotenv.config();

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const USERNAME = process.env.USERNAME;

// Error handling for missing credentials from .env
if (!EMAIL || !PASSWORD || !USERNAME) {
  console.error("Missing EMAIL, PASSWORD or USERNAME in .env. Check .env file exists with EMAIL, PASSWORD and USERNAME variable");
  process.exit(1);
}

async function main(): Promise<void> {
  const TARGET_POST_NUMBER: number = 2; // Change this to 3 for the 3rd post, etc.
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized", "--incognito"],
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  // 1) Open old.reddit.com
  await page.goto("https://old.reddit.com", { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: "./screenshots/1_Opened Old Reddit Homepage.png" });
  console.log("Step 1: Opened Old Reddit Homepage");

  // 2) Check Cookies Policy appeared
  const cookiesPolicy = await page.waitForSelector("#eu-cookie-policy", { timeout: 5000 });
  await page.screenshot({ path: "./screenshots/2_Cookies Policy Appeared.png" });
  if (cookiesPolicy) {
    await page.click("#eu-cookie-policy > div > div.infobar-btn-container > button");
    await page.screenshot({ path: "./screenshots/2_Cookies Policy Accepted.png" });
    console.log("Step 2: Cookies Policy Accepted");
  }

  // 3) Login Flow
  await page.waitForSelector("#header-bottom-right > span > a.login-required.login-link"); // Login link
  console.log("Step 3.1: Login button found");
  await page.click("#header-bottom-right > span > a.login-required.login-link");
  await page.screenshot({ path: "./screenshots/3.1_Clicked Login Button.png" });
  console.log("Step 3.2: Clicked Login Button")

  // Enter login credentials
  console.log("Step 3.3: Login page loaded");
  await page.waitForSelector("#login-username"); // Login form
  await page.screenshot({ path: "./screenshots/3.2_Login Page Loaded.png" });
  console.log("Step 3.4: Found Email input");
  await page.waitForSelector("#login-username > span"); // Email field
  await page.click("#login-username > span");
  await page.type("#login-username > span", EMAIL as string);
  await page.screenshot({ path: "./screenshots/3.3_Entered Email.png" });
  console.log("Step 3.5: Entered Email");
  await page.waitForSelector("#login-password > span"); // Password field
  console.log("Step 3.6: Found Password input");
  await page.click("#login-password > span");
  await page.type("#login-password > span", PASSWORD as string);
  await page.screenshot({ path: "./screenshots/3.4_Entered Password.png" });
  console.log("Step 3.7: Entered Password")
  await page.waitForSelector("#login > auth-flow-modal > div.w-100 > faceplate-tracker:nth-child(1) > button"); // Login button highlighted after entering email/password
  await delay(1000);
  await page.click("#login > auth-flow-modal > div.w-100 > faceplate-tracker:nth-child(1) > button > span > span");
  await page.screenshot({ path: "./screenshots/3.5_Clicked Login Button.png" });
  console.log("Step 3.8: Clicked Login Button");
  await page.waitForSelector(`::-p-text(${USERNAME}, this is your home on Reddit)`); // Welcome text checking USERNAME from .env
  await page.screenshot({ path: "./screenshots/3.9_Welcome Page.png" });


  // 4) Search and Open the gaming subreddit
  await page.waitForSelector("#search > input[type=text]:nth-child(1)"); // Search bar
  await page.screenshot({ path: "./screenshots/4.1_Search Bar Found.png" });
  console.log("Step 4.1: Search Bar Found");
  await page.click("#search > input[type=text]:nth-child(1)");
  await page.type("#search > input[type=text]:nth-child(1)", "gaming");
  await page.screenshot({ path: "./screenshots/3.9_Search Bar Typed.png" });
  console.log("Step 4.2: Search Bar 'gaming' Typed");
  await page.waitForSelector("#search > input[type=submit]:nth-child(2)"); // Search icon
  await page.click("#search > input[type=submit]:nth-child(2)");
  await page.screenshot({ path: "./screenshots/4.2_Search Icon Clicked.png" });
  console.log("Step 4.3: Search Icon Clicked");
  await delay(2000);
  await page.screenshot({ path: "./screenshots/4.3_Gaming Results Search.png" });
  await page.waitForSelector("body > div.content > div:nth-child(2) > div > div > div:nth-child(1) > header > a");
  await page.click("body > div.content > div:nth-child(2) > div > div > div:nth-child(1) > header > a");
  await delay(2000); // Wait for navigation to complete (networkidle2 and networkidle0 were failing)
  await page.screenshot({ path: "./screenshots/4.4_Gaming Subreddit Clicked.png" });
  console.log("Step 4.4: Gaming Subreddit Clicked");
  await page.waitForSelector("div.content", { timeout: 10000 });

  // Verify the current open url is r/gaming
  const currentUrl = page.url();
  if (!currentUrl.includes("old.reddit.com/r/gaming/")) {
    console.error(`URL verification failed: Expected URL to contain old.reddit.com/r/gaming/, but got ${currentUrl}`);
  } else {
    console.log(`Step 4.5: URL verified as ${currentUrl}`);
  }

  // 5) Find target eligible post (skip pinned/ads)
  const targetEligible = await page.evaluate((targetCount: number) => {
    // 'things' retrieves all post elements (div.thing)
    // 'thing' is the standard class name Reddit uses for the wrapper container of a single post/item.
    const things = Array.from(document.querySelectorAll("div.thing"));

    // We create an array from 'things' to filter them for stickied/pinned posts
    const eligible = [];
    for (const thing of things) {
      // 'cls' retrieves the class name of the post
      const cls = (thing.className || "").toLowerCase();
      // 'dataPromoted' retrieves the promoted attribute of the post so we can skip these
      const dataPromoted = (thing as HTMLElement).dataset ? (thing as HTMLElement).dataset.promoted : null;

      // Skip stickied/promoted posts
      if (cls.includes("stickied")) continue;
      if (cls.includes("promoted")) continue;
      if (dataPromoted && dataPromoted !== "false") continue;

      // If no title element is found, skip the rest of this iteration and move to the next post

      const titleEl = thing.querySelector("a.title");
      if (!titleEl) continue;

      // 'textContent' retrieves the raw text inside the element, ignoring any HTML tags (like innterHTML).
      const title = (titleEl.textContent || "").trim();
      if (!title) continue;

      // Add the post to the eligible array. eligibile refers to posts that are not stickied/promoted.
      eligible.push({
        title,
        // helpful for debugging:
        // permalink e.g. /r/gaming/comments/1r9ar60/slay_the_spire_2_early_access_trailer/
        permalink: thing.getAttribute("data-permalink") || null,
        // fullname e.g. t3_ followed by ID = t3_1r9ar60
        fullname: thing.getAttribute("data-fullname") || null,
      });

      // Break the for loop once we have found the target post
      if (eligible.length >= targetCount) break;
    }

    // Return the target eligible post
    return eligible.length >= targetCount ? eligible[targetCount - 1] : null;
  }, TARGET_POST_NUMBER);

  // If we could not find the target eligible post, throw an error
  if (!targetEligible) {
    throw new Error(`Could not find eligible post #${TARGET_POST_NUMBER} (after filtering stickied/promoted).`);
  }

  // Destructure the target eligible post
  const { title, permalink, fullname } = targetEligible;
  // Check if the title contains "Nintendo" by calling the containsNintendo function and store the result in a variable
  const decision = containsNintendo(title) ? "WOULD_UPVOTE" : "WOULD_DOWNVOTE";

  // Log the target eligible post and the decision to the console
  console.log(`Step 5.1: Target eligible post (#${TARGET_POST_NUMBER}):`);
  console.log(`- Title: ${title}`);
  if (permalink) console.log(`- Link: https://old.reddit.com${permalink}`);
  console.log(`Decision: ${decision}`);

  // Perform Voting Action within a single evaluate block for reliability
  const votingResult = await page.evaluate((fullname: any, decision: string) => {
    // Select the post element using the fullname attribute
    const thing = document.querySelector(`div.thing[data-fullname="${fullname}"]`);
    // If the post element is not found, return NOT_FOUND
    if (!thing) return { state: "NOT_FOUND" };

    // Scroll the post into view to ensure it's visible in screenshots
    thing.scrollIntoView({ behavior: "smooth", block: "center" });


    // Find the up and down arrows more flexibly by assigning it to a variable
    const upArrow = thing.querySelector(".arrow.up, .arrow[class*='up']");
    const downArrow = thing.querySelector(".arrow.down, .arrow[class*='down']");

    // Error handling: if the up and down arrows are not found, return ARROW_NOT_FOUND
    if (!upArrow || !downArrow) {
      return {
        state: "ARROW_NOT_FOUND",
        html: thing.innerHTML.substring(0, 500),
        upFound: !!upArrow,
        downFound: !!downArrow
      };
    }

    // Adding check for re-run of script (if already voted)
    // Re-check logic: in old reddit, 'upmod' means active upvote, 'downmod' means active downvote.
    const hasActiveUpvote = upArrow.classList.contains("upmod");
    const hasActiveDownvote = downArrow.classList.contains("downmod");

    // If the post has already been voted, return ALREADY_SELECTED
    if ((decision === "WOULD_UPVOTE" && hasActiveUpvote) || (decision === "WOULD_DOWNVOTE" && hasActiveDownvote)) {
      return { state: "ALREADY_SELECTED", current: hasActiveUpvote ? "UPVOTED" : "DOWNVOTED" };
    }

    // Click the target arrow based on the decision
    const targetArrow = (decision === "WOULD_UPVOTE" ? upArrow : downArrow) as HTMLElement;
    targetArrow.click();
    return { state: "CLICKED", previous: hasActiveUpvote ? "UPVOTED" : hasActiveDownvote ? "DOWNVOTED" : "NONE" };
  }, fullname, decision);

  // Log the voting result to the console including the previous states
  console.log(`Step 5.2: Voting result for ${fullname}: ${votingResult.state}`);
  await page.screenshot({ path: `./screenshots/5_Voting Result ${votingResult.state}.png` });

  // If the voting result is ALREADY_SELECTED, log the previous state
  if (votingResult.state === "ALREADY_SELECTED") {
    console.log(`Step 5.3: ${decision === "WOULD_UPVOTE" ? "Upvote" : "Downvote"} already selected for post ${fullname}`);
  } else if (votingResult.state === "CLICKED") {
    console.log(`Step 5.5: Successfully performed ${decision} on post ${fullname}`);
    await delay(1000); // Wait for animation
    await page.screenshot({ path: `./screenshots/5_Vote_${decision}.png` });
  } else if (votingResult.state === "NOT_FOUND") {
    console.error(`Step 5.4: Post ${fullname} no longer found on the page.`);
    await page.screenshot({ path: "./screenshots/error_post_not_found.png" });
  } else {
    console.error(`Step 5.6: Failed to perform vote: ${votingResult.state}`);
    if (votingResult.html) {
      console.log("Debug HTML Snippet:", votingResult.html);
      console.log(`Arrows: Up=${votingResult.upFound}, Down=${votingResult.downFound}`);
    }
    await page.screenshot({ path: "./screenshots/error_vote_failed.png" });
  }

  // 6) Logout from Reddit
  await page.waitForSelector("#header-bottom-right > form > a");
  await page.click("#header-bottom-right > form > a");
  console.log("Step 6.1: Logout Clicked");
  // Wait for the login button to be visible
  await page.waitForSelector("#header-bottom-right > span > a.login-required.login-link");
  console.log("Step 6.2: Logout Completed (Login link detected)");
  await page.screenshot({ path: "./screenshots/6_Logout_Completed.png" });

  // 7) Script completed
  console.log("Step 7: Script completed");

  await page.screenshot({ path: `./screenshots/7_Script_Completed_${decision}.png` });
  await browser.close();
}

// Helper function to check if the title contains "Nintendo"
function containsNintendo(title: string): boolean {
  return /nintendo/i.test(title); // The i makes this case-insensitive
}

// Helper function to delay execution
function delay(time: number): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  });
}

// Main function to run the this script with error handling
main().catch((err) => {
  console.error("Run failed:", err);
  process.exit(1);
});