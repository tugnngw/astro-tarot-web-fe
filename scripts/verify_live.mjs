import { chromium } from "playwright";

const LIVE_URL = "https://astro-tarot-web-fe.vercel.app";

async function testLiveDeploy() {
  console.log(`Connecting to ${LIVE_URL}...`);
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on("console", (msg) => {
    console.log(`[Browser Console ${msg.type()}]:`, msg.text());
  });

  await page.goto(LIVE_URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const buttons = await page.locator("button").allInnerTexts();
  console.log("Buttons on live page:", buttons);

  const loginBtn = page.locator('header button:has-text("Đăng nhập")').first();
  const count = await loginBtn.count();
  console.log("Login buttons found in header:", count);

  if (count > 0) {
    await loginBtn.click();
    await page.waitForTimeout(2000);
    const inputs = await page.locator("input").evaluateAll((els) =>
      els.map((e) => ({ type: e.type, placeholder: e.placeholder, name: e.name }))
    );
    console.log("Inputs found after clicking login:", inputs);

    const emailInput = page.locator('input[type="email"], input[placeholder*="mail" i], input[placeholder*="Email"]').first();
    const passInput = page.locator('input[type="password"]').first();

    await emailInput.fill("megalit2578@gmail.com");
    await passInput.fill("12345678");

    const submitBtn = page.locator('div[role="dialog"] button:has-text("Đăng nhập"), button[type="submit"]').first();
    await submitBtn.click();

    console.log("Clicked submit. Waiting for login...");
    await page.waitForTimeout(6000);

    console.log("URL after login:", page.url());
    const headerText = await page.locator("header").innerText().catch(() => "");
    console.log("Header text on live:\n", headerText);
  }

  await browser.close();
}

testLiveDeploy().catch((err) => {
  console.error("Live test error:", err);
  process.exit(1);
});
