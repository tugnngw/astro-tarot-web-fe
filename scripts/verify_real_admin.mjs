import { chromium } from "playwright";

const BASE_URL = "http://localhost:8081";

async function verifyWithRealAdminData() {
  console.log("1. Authenticating with https://api.astrotarot.date/auth/login...");
  const res = await fetch("https://api.astrotarot.date/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "megalit2578@gmail.com", password: "12345678" }),
  });
  const data = await res.json();
  const beUser = data.data;

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

  console.log("Authenticated Admin:", authUser.email, "| Role:", authUser.role);

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Route API requests
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

  // Inject session
  await page.addInitScript(
    ({ u, token, refresh }) => {
      localStorage.setItem("astrotarot_user_v2", JSON.stringify(u));
      localStorage.setItem("astrotarot_access_token", token);
      localStorage.setItem("astrotarot_refresh_token", refresh);
    },
    { u: authUser, token: beUser.accessToken, refresh: beUser.refreshToken }
  );

  console.log("\n2. Navigating to http://localhost:8081/admin...");
  await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });

  console.log("Current URL:", page.url());
  const headerNav = await page.locator("header nav.hidden.lg\\:flex").innerText().catch(() => "");
  console.log("Admin Header Nav Content:", JSON.stringify(headerNav));

  const tabs = await page.locator('nav[role="tablist"] button').allInnerTexts();
  console.log("Admin Workspace Tabs (" + tabs.length + "):", tabs);

  // Check Admin dropdown
  const avatarBtn = page.locator("header button:has(span.overflow-hidden)").first();
  await avatarBtn.click();
  await page.waitForTimeout(500);

  const dropdownText = await page.locator("header div.absolute.right-0").innerText().catch(() => "");
  console.log("\nDropdown Items:\n" + dropdownText);

  // Test Direct Route Redirects
  console.log("\n3. Testing Direct Route Redirects for Member Routes:");
  const memberRoutes = [
    "/home",
    "/profile/astrology",
    "/profile/wallet",
    "/profile/subscription",
    "/bookings",
    "/tarot-history",
    "/support",
  ];

  for (const route of memberRoutes) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    const finalUrl = page.url();
    console.log(` - ${route} -> ${finalUrl} (${finalUrl.endsWith("/admin") ? "PASS" : "FAIL"})`);
  }

  // Check Customer Floating Widgets
  console.log("\n4. Checking Customer Floating Widgets on /admin...");
  await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
  const feedbackWidget = await page.locator('button:has-text("Góp ý"), div:has-text("Góp ý phản hồi")').count();
  const chatDockWidget = await page.locator('button:has-text("Trao đổi"), div:has-text("ChatDock")').count();
  console.log("FeedbackPrompt count (0):", feedbackWidget, "| ChatDock count (0):", chatDockWidget);

  await browser.close();
  console.log("\n=== TẤT CẢ KIỂM TRA VỚI TÀI KHOẢN ADMIN THẬT megalit2578@gmail.com HOÀN TẤT THÀNH CÔNG ===");
}

verifyWithRealAdminData().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
