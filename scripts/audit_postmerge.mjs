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
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(beUser),
    });
  });
  await page.route("**/api/v1/user-wallet**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { balance: 0 } }),
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

  console.log("=== POST-MERGE BROWSER AUDIT (admin: megalit2578@gmail.com) ===\n");

  // Header + workspace
  await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
  const navText = await page.locator("header nav.hidden.lg\\:flex").innerText().catch(() => "");
  const walletBtn = await page.locator('button[title*="Ví ASTROTAROT"]').count();
  const badge = await page.locator('header span:has-text("Admin")').count();
  console.log("HEADER desktop nav:", JSON.stringify(navText));
  console.log("HEADER admin badge:", badge > 0 ? "PASS" : "FAIL");
  console.log("HEADER wallet button (expect 0):", walletBtn, walletBtn === 0 ? "PASS" : "FAIL");
  const forbidden = ["Trang chủ", "Tarot AI", "Gói cước AI", "Reader", "Shop", "Blog", "Bàn làm việc", "Quản lý"];
  const found = forbidden.filter((i) => navText.includes(i));
  console.log("HEADER forbidden items:", found.length === 0 ? "PASS" : `FAIL ${JSON.stringify(found)}`);

  // Dropdown
  await page.locator("header button:has(span.overflow-hidden)").first().click();
  await page.waitForTimeout(400);
  const dd = await page.locator("header div.absolute.right-0").innerText().catch(() => "");
  console.log("DROPDOWN:\n" + dd);
  const ddForbidden = ["Không gian của tôi", "Lịch hẹn", "Ví ASTROTAROT", "Bản đồ sao", "Gói cước", "Lịch sử trải bài", "Hỗ trợ"].filter((i) => dd.includes(i));
  const ddOk = ["Hồ sơ cá nhân", "Đăng xuất"].every((i) => dd.includes(i));
  console.log("DROPDOWN admin-only:", ddOk && ddForbidden.length === 0 ? "PASS" : `FAIL forbidden=${JSON.stringify(ddForbidden)}`);
  await page.mouse.click(5, 5);
  await page.waitForTimeout(200);

  // Workspace tabs
  const tabs = await page.locator('nav[role="tablist"] button').allInnerTexts();
  console.log("WORKSPACE tabs (" + tabs.length + "):", tabs);
  const expected = ["Tổng quan","Quản lý Blog","Tài khoản","Hồ sơ Reader","Gói AI","Thanh toán","Rút tiền","Báo cáo vi phạm","Nhật ký hệ thống","Bảng phân quyền","Sản phẩm liên kết"];
  const tabsOk = tabs.length === 11 && expected.every((t) => tabs.includes(t)) && !tabs.includes("Bài viết của tôi");
  console.log("WORKSPACE 11 tabs / no MyBlogList:", tabsOk ? "PASS" : "FAIL");

  // Member route redirects (spec: admin -> /admin)
  const memberRoutes = ["/home","/profile/astrology","/profile/wallet","/profile/subscription","/bookings","/tarot-history","/support","/profile"];
  console.log("\nMEMBER ROUTE REDIRECTS:");
  for (const r of memberRoutes) {
    await page.goto(`${BASE_URL}${r}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const url = page.url();
    // /profile is allowed for admin (dropdown links there)
    const expectAdmin = r === "/profile" ? url.endsWith("/profile") || url.endsWith("/profile/") : url.endsWith("/admin");
    console.log(`  ${r} -> ${url} ${expectAdmin ? "PASS" : "FAIL"}`);
  }

  // Deprecated reader routes
  console.log("\nLEGACY READER ROUTES:");
  for (const r of ["/reader", "/reader-hub"]) {
    await page.goto(`${BASE_URL}${r}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const url = page.url();
    const ok = url.endsWith("/staff");
    console.log(`  ${r} -> ${url} ${ok ? "PASS" : "FAIL (spec: redirect to /staff)"}`);
  }

  // Widgets
  await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
  const fb = await page.locator('button:has-text("Góp ý")').count();
  const chat = await page.locator('button[title*="chat"], [aria-label*="chat" i]').count();
  console.log("\nWIDGETS admin: FeedbackPrompt count:", fb, "| chat-like count:", chat, fb === 0 ? "PASS" : "FAIL");

  // USER regression
  console.log("\nUSER REGRESSION (role=user, USER_BASIC):");
  const userCtx = await browser.newContext();
  const userPage = await userCtx.newPage();
  const member = { id: "u1", name: "TV", full_name: "TV", username: "tv", email: "tv@x.vn", role: "user", permissions: ["USER_BASIC"], joinedAt: new Date().toISOString() };
  await userPage.addInitScript((u) => {
    localStorage.setItem("astrotarot_user_v2", JSON.stringify(u));
    localStorage.setItem("astrotarot_access_token", "t");
    localStorage.setItem("astrotarot_refresh_token", "r");
  }, member);
  for (const r of ["/home", "/bookings", "/support", "/profile/wallet", "/reader-hub", "/tarot", "/shop"]) {
    await userPage.goto(`${BASE_URL}${r}`, { waitUntil: "domcontentloaded" });
    await userPage.waitForTimeout(1200);
    const url = userPage.url();
    let ok;
    if (r === "/reader-hub") ok = url.endsWith("/staff");
    else if (r === "/profile/wallet") ok = url.includes("/profile/wallet") || url.endsWith("/wallet");
    else ok = url.includes(r);
    console.log(`  ${r} -> ${url} ${ok ? "PASS" : "FAIL"}`);
  }
  const userNav = await userPage.locator("header nav.hidden.lg\\:flex").innerText().catch(() => "");
  console.log("  USER desktop nav:", JSON.stringify(userNav), userNav.includes("Trang chủ") ? "PASS" : "FAIL");
  await userCtx.close();

  // STAFF regression
  console.log("\nSTAFF REGRESSION (role=staff):");
  const staffCtx = await browser.newContext();
  const staffPage = await staffCtx.newPage();
  const staff = { id: "s1", name: "S", full_name: "S", username: "s", email: "s@x.vn", role: "staff", permissions: ["USER_BASIC","READER_APPLY","READER_MANAGE_PROFILE","SUPPORT_VIEW","SUPPORT_RESPOND","PAYOUT_REQUEST","BLOG_CREATE"], joinedAt: new Date().toISOString() };
  await staffPage.addInitScript((u) => {
    localStorage.setItem("astrotarot_user_v2", JSON.stringify(u));
    localStorage.setItem("astrotarot_access_token", "t");
    localStorage.setItem("astrotarot_refresh_token", "r");
  }, staff);
  await staffPage.goto(`${BASE_URL}/staff`, { waitUntil: "networkidle" });
  console.log("  /staff ->", staffPage.url(), staffPage.url().endsWith("/staff") ? "PASS" : "FAIL");
  const staffTabs = await staffPage.locator('nav[role="tablist"] button').allInnerTexts().catch(() => []);
  console.log("  STAFF tabs:", staffTabs);
  const staffHasMyBlog = staffTabs.some((t) => t.includes("Bài viết"));
  console.log("  STAFF MyBlogList tab present:", staffHasMyBlog ? "PASS" : "FAIL");
  await staffPage.goto(`${BASE_URL}/reader`, { waitUntil: "domcontentloaded" });
  await staffPage.waitForTimeout(1500);
  console.log("  /reader ->", staffPage.url(), staffPage.url().endsWith("/staff") ? "PASS" : "FAIL (spec: redirect /staff)");
  await staffCtx.close();

  // MANAGER regression
  console.log("\nMANAGER REGRESSION (role=manager):");
  const mgrCtx = await browser.newContext();
  const mgrPage = await mgrCtx.newPage();
  const mgr = { id: "m1", name: "M", full_name: "M", username: "m", email: "m@x.vn", role: "manager", permissions: ["USER_BASIC","SUPPORT_VIEW","STAFF_VIEW","STAFF_MANAGE","ADMIN_READERS_VIEW","ADMIN_READERS_REVIEW","REPORT_REVIEW","BLOG_CREATE","BLOG_REVIEW","CATALOG_MANAGE"], joinedAt: new Date().toISOString() };
  await mgrPage.addInitScript((u) => {
    localStorage.setItem("astrotarot_user_v2", JSON.stringify(u));
    localStorage.setItem("astrotarot_access_token", "t");
    localStorage.setItem("astrotarot_refresh_token", "r");
  }, mgr);
  await mgrPage.goto(`${BASE_URL}/manager`, { waitUntil: "networkidle" });
  console.log("  /manager ->", mgrPage.url(), mgrPage.url().endsWith("/manager") ? "PASS" : "FAIL");
  const mgrTabs = await mgrPage.locator('nav[role="tablist"] button').allInnerTexts().catch(() => []);
  console.log("  MANAGER tabs:", mgrTabs);
  const mgrHasBlog = mgrTabs.some((t) => t.includes("Bài viết"));
  console.log("  MANAGER MyBlogList tab present:", mgrHasBlog ? "PASS" : "FAIL");
  const mgrNav = await mgrPage.locator("header nav.hidden.lg\\:flex").innerText().catch(() => "");
  console.log("  MANAGER desktop nav:", JSON.stringify(mgrNav), mgrNav.includes("Quản lý") && !mgrNav.includes("Khu vực Quản trị") ? "PASS" : "FAIL");
  await mgrCtx.close();

  await browser.close();
  console.log("\n=== AUDIT BROWSER RUN COMPLETE ===");
}

run().catch((e) => {
  console.error("Audit run failed:", e);
  process.exit(1);
});
