import { chromium } from "playwright";

const BASE_URL = "http://localhost:8081";
const ADMIN_EMAIL = "megalit2578@gmail.com";

async function fetchAdmin() {
  const res = await fetch("https://api.astrotarot.date/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: "12345678" }),
  });
  const data = await res.json();
  return data.data;
}

async function run() {
  const beUser = await fetchAdmin();
  const authUser = {
    id: beUser.userId,
    name: beUser.fullName,
    full_name: beUser.fullName,
    username: beUser.username,
    email: beUser.email,
    role: "admin",
    permissions: beUser.permissions,
    avatar: beUser.avatar,
    joinedAt: new Date().toISOString(),
  };

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await page.route("**/api/v1/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: beUser.userId,
          username: beUser.username,
          email: beUser.email,
          fullName: beUser.fullName,
          role: "ADMIN",
          permissions: beUser.permissions,
          avatar: beUser.avatar,
          createdAt: new Date().toISOString(),
        },
      }),
    });
  });

  await page.addInitScript(
    ({ u, token, refresh }) => {
      localStorage.setItem("astrotarot_user_v2", JSON.stringify(u));
      localStorage.setItem("astrotarot_access_token", token);
      localStorage.setItem("astrotarot_refresh_token", refresh);
    },
    { u: authUser, token: beUser.accessToken, refresh: beUser.refreshToken }
  );

  console.log("=== VERIFY 2 POST-MERGE FIXES (admin) ===\n");

  await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  console.log("admin session url:", page.url());

  // FIX 1: /reader -> /staff
  await page.goto(`${BASE_URL}/reader`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  const readerUrl = page.url();
  console.log("/reader ->", readerUrl, readerUrl.endsWith("/staff") ? "PASS" : "FAIL");

  // FIX 2: /profile/wallet -> /admin
  await page.goto(`${BASE_URL}/profile/wallet`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  const walletUrl = page.url();
  console.log("/profile/wallet ->", walletUrl, walletUrl.endsWith("/admin") ? "PASS" : "FAIL");

  // control: /reader-hub still redirects
  await page.goto(`${BASE_URL}/reader-hub`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const hubUrl = page.url();
  console.log("/reader-hub ->", hubUrl, hubUrl.endsWith("/staff") ? "PASS" : "FAIL");

  // control: /home still redirects for admin
  await page.goto(`${BASE_URL}/home`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const homeUrl = page.url();
  console.log("/home ->", homeUrl, homeUrl.endsWith("/admin") ? "PASS" : "FAIL");

  // USER still can open wallet
  const userCtx = await browser.newContext();
  const userPage = await userCtx.newPage();
  const member = {
    id: "u1",
    name: "TV",
    full_name: "TV",
    username: "tv",
    email: "tv@x.vn",
    role: "user",
    permissions: ["USER_BASIC"],
    joinedAt: new Date().toISOString(),
  };
  await userPage.addInitScript((u) => {
    localStorage.setItem("astrotarot_user_v2", JSON.stringify(u));
    localStorage.setItem("astrotarot_access_token", "t");
    localStorage.setItem("astrotarot_refresh_token", "r");
  }, member);
  await userPage.goto(`${BASE_URL}/profile/wallet`, { waitUntil: "domcontentloaded" });
  await userPage.waitForTimeout(1800);
  const userWallet = userPage.url();
  console.log("USER /profile/wallet ->", userWallet, userWallet.includes("/profile/wallet") ? "PASS" : "FAIL");
  await userCtx.close();

  // STAFF still can open /reader -> should redirect to /staff (same as admin now)
  const staffCtx = await browser.newContext();
  const staffPage = await staffCtx.newPage();
  const staff = {
    id: "s1",
    name: "S",
    full_name: "S",
    username: "s",
    email: "s@x.vn",
    role: "staff",
    permissions: ["USER_BASIC","READER_APPLY","READER_MANAGE_PROFILE","SUPPORT_VIEW","SUPPORT_RESPOND","PAYOUT_REQUEST","BLOG_CREATE"],
    joinedAt: new Date().toISOString(),
  };
  await staffPage.addInitScript((u) => {
    localStorage.setItem("astrotarot_user_v2", JSON.stringify(u));
    localStorage.setItem("astrotarot_access_token", "t");
    localStorage.setItem("astrotarot_refresh_token", "r");
  }, staff);
  await staffPage.goto(`${BASE_URL}/reader`, { waitUntil: "domcontentloaded" });
  await staffPage.waitForTimeout(1800);
  const staffReader = staffPage.url();
  console.log("STAFF /reader ->", staffReader, staffReader.endsWith("/staff") ? "PASS" : "FAIL");
  await staffCtx.close();

  await browser.close();
  console.log("\n=== VERIFY RUN COMPLETE ===");
}

run().catch((e) => {
  console.error("Verify run failed:", e);
  process.exit(1);
});
