import { chromium } from "playwright";

const BASE_URL = "http://localhost:8081";

const ADMIN_USER = {
  id: "u-admin-1",
  name: "Quản Trị Viên",
  full_name: "Quản Trị Viên",
  username: "admin_megalit",
  email: "megalit2578@gmail.com",
  role: "admin",
  permissions: [
    "USER_BASIC",
    "READER_MANAGE_PROFILE",
    "SUPPORT_VIEW",
    "SUPPORT_RESPOND",
    "STAFF_VIEW",
    "STAFF_MANAGE",
    "ADMIN_READERS_VIEW",
    "ADMIN_READERS_REVIEW",
    "BLOG_CREATE",
    "BLOG_REVIEW",
    "CATALOG_MANAGE",
    "ORDERS_MANAGE",
    "USERS_MANAGE",
    "AUDIT_VIEW",
    "PAYMENTS_MANAGE",
    "PAYOUT_REVIEW",
    "REPORT_REVIEW",
  ],
  joinedAt: "2026-01-01T00:00:00Z",
};

const MEMBER_USER = {
  id: "u-user-1",
  name: "Thành Viên Test",
  full_name: "Thành Viên Test",
  username: "user_test",
  email: "user@astrotarot.vn",
  role: "user",
  permissions: ["USER_BASIC", "READER_APPLY"],
  joinedAt: "2026-01-01T00:00:00Z",
};

const STAFF_USER = {
  id: "u-staff-1",
  name: "Nhân Viên Reader",
  full_name: "Nhân Viên Reader",
  username: "staff_reader",
  email: "staff@astrotarot.vn",
  role: "staff",
  permissions: [
    "USER_BASIC",
    "READER_APPLY",
    "READER_MANAGE_PROFILE",
    "SUPPORT_VIEW",
    "SUPPORT_RESPOND",
    "PAYOUT_REQUEST",
    "ADMIN_READERS_VIEW",
    "ADMIN_READERS_REVIEW",
    "BLOG_CREATE",
  ],
  joinedAt: "2026-01-01T00:00:00Z",
};

const MANAGER_USER = {
  id: "u-mgr-1",
  name: "Quản Lý Vận Hành",
  full_name: "Quản Lý Vận Hành",
  username: "manager_ops",
  email: "manager@astrotarot.vn",
  role: "manager",
  permissions: [
    "USER_BASIC",
    "SUPPORT_VIEW",
    "STAFF_VIEW",
    "STAFF_MANAGE",
    "ADMIN_READERS_VIEW",
    "ADMIN_READERS_REVIEW",
    "REPORT_REVIEW",
    "BLOG_CREATE",
    "BLOG_REVIEW",
    "CATALOG_MANAGE",
  ],
  joinedAt: "2026-01-01T00:00:00Z",
};

async function setupMockRoutes(page, currentUser) {
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        userId: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        fullName: currentUser.full_name,
        role: currentUser.role.toUpperCase(),
        permissions: currentUser.permissions,
        accessToken: "mock-access-token-xyz",
        refreshToken: "mock-refresh-token-xyz",
        expiresIn: 3600,
      }),
    });
  });

  await page.route("**/api/v1/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        fullName: currentUser.full_name,
        role: currentUser.role.toUpperCase(),
        permissions: currentUser.permissions,
        createdAt: currentUser.joinedAt,
      }),
    });
  });
}

async function injectSession(page, user) {
  await page.addInitScript((u) => {
    localStorage.setItem("astrotarot_user_v2", JSON.stringify(u));
    localStorage.setItem("astrotarot_access_token", "mock-access-token-xyz");
    localStorage.setItem("astrotarot_refresh_token", "mock-refresh-token-xyz");
  }, user);
}

async function runVerification() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const consoleErrors = [];

  console.log("=== BẮT ĐẦU KIỂM THỬ POST-REFACTOR ADMIN ===");

  // -------------------------------------------------------------
  // 1. ADMIN LOGIN FLOW
  // -------------------------------------------------------------
  console.log("\n--- 1. ADMIN LOGIN FLOW ---");
  const loginContext = await browser.newContext();
  const loginPage = await loginContext.newPage();
  loginPage.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[Login Page Error] ${msg.text()}`);
  });

  await setupMockRoutes(loginPage, ADMIN_USER);
  await loginPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

  // Open login modal
  const loginBtn = loginPage.getByRole("button", { name: "Đăng nhập" }).first();
  await loginBtn.click();
  await loginPage.waitForSelector('input[placeholder="Email"]', { timeout: 5000 });

  await loginPage.fill('input[placeholder="Email"]', "megalit2578@gmail.com");
  await loginPage.fill('input[placeholder="Mật khẩu"]', "12345678");

  const submitBtn = loginPage.getByRole("button", { name: "Đăng nhập" }).last();
  await submitBtn.click();

  await loginPage.waitForURL("**/admin", { timeout: 5000 });
  const finalUrl = loginPage.url();
  console.log("URL sau login:", finalUrl);
  const loginPass = finalUrl.endsWith("/admin");
  console.log("Login redirect to /admin:", loginPass ? "PASS" : "FAIL");

  await loginContext.close();

  // -------------------------------------------------------------
  // 2. ADMIN HEADER & DROPDOWN & WORKSPACE
  // -------------------------------------------------------------
  console.log("\n--- 2. ADMIN HEADER & DROPDOWN & WORKSPACE ---");
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const adminPage = await adminContext.newPage();
  adminPage.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[Admin Page Error] ${msg.text()}`);
  });

  await setupMockRoutes(adminPage, ADMIN_USER);
  await injectSession(adminPage, ADMIN_USER);
  await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });

  // Check branding & badge
  const adminBadge = await adminPage.locator('header span:has-text("Admin")').count();
  console.log("Admin badge in header:", adminBadge > 0 ? "PASS" : "FAIL");

  // Check desktop nav links
  const headerNav = adminPage.locator("header nav.hidden.lg\\:flex");
  const navText = await headerNav.innerText().catch(() => "");
  console.log("Desktop Nav Content:", JSON.stringify(navText));

  const forbiddenDesktop = ["Trang chủ", "Tarot AI", "Gói cước AI", "Reader", "Shop", "Blog", "Bàn làm việc", "Quản lý"];
  const foundForbiddenDesktop = forbiddenDesktop.filter((item) => navText.includes(item));
  console.log("Forbidden desktop nav items found:", foundForbiddenDesktop);
  const desktopNavPass = foundForbiddenDesktop.length === 0 && navText.includes("Khu vực Quản trị");
  console.log("Admin Desktop Nav:", desktopNavPass ? "PASS" : "FAIL");

  // Check wallet button
  const walletBtnCount = await adminPage.locator('button[title*="Ví ASTROTAROT"]').count();
  console.log("Admin Wallet Button visible (expected 0):", walletBtnCount, walletBtnCount === 0 ? "PASS" : "FAIL");

  // Check Mobile Drawer
  await adminPage.setViewportSize({ width: 375, height: 812 });
  const hamburger = adminPage.locator('header button[aria-label="Mở menu"]');
  await hamburger.click();
  const mobileNav = adminPage.locator("header nav.lg\\:hidden");
  const mobileNavText = await mobileNav.innerText().catch(() => "");
  console.log("Mobile Nav Content:", JSON.stringify(mobileNavText));
  const foundForbiddenMobile = forbiddenDesktop.filter((item) => mobileNavText.includes(item));
  console.log("Forbidden mobile nav items found:", foundForbiddenMobile);
  const mobileNavPass = foundForbiddenMobile.length === 0 && mobileNavText.includes("Khu vực Quản trị");
  console.log("Admin Mobile Nav:", mobileNavPass ? "PASS" : "FAIL");

  // Reset to desktop for dropdown and workspace
  await adminPage.setViewportSize({ width: 1280, height: 800 });
  await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });

  // -------------------------------------------------------------
  // 3. ADMIN DROPDOWN
  // -------------------------------------------------------------
  console.log("\n--- 3. ADMIN DROPDOWN ---");
  const avatarBtn = adminPage.locator("header button:has(span.overflow-hidden)");
  await avatarBtn.click();
  await adminPage.waitForTimeout(300);

  const dropdown = adminPage.locator("header div.absolute.right-0");
  const dropdownText = await dropdown.innerText().catch(() => "");
  console.log("Dropdown Content:\n" + dropdownText);

  const expectedDropdownItems = ["Hồ sơ cá nhân", "Cài đặt tài khoản", "Đăng xuất"];
  const forbiddenDropdownItems = [
    "Không gian của tôi",
    "Lịch hẹn của tôi",
    "Lịch khách đặt với tôi",
    "Ví ASTROTAROT",
    "Bản đồ sao",
    "Gói cước AI",
    "Lịch sử trải bài",
    "Hỗ trợ",
  ];

  const hasAllExpected = expectedDropdownItems.every((item) => dropdownText.includes(item));
  const foundForbiddenDropdown = forbiddenDropdownItems.filter((item) => dropdownText.includes(item));
  console.log("Forbidden dropdown items found:", foundForbiddenDropdown);
  const dropdownPass = hasAllExpected && foundForbiddenDropdown.length === 0;
  console.log("Admin Dropdown Menu:", dropdownPass ? "PASS" : "FAIL");

  // Click outside to close dropdown
  await adminPage.mouse.click(10, 10);
  await adminPage.waitForTimeout(200);

  // -------------------------------------------------------------
  // 4. ADMIN WORKSPACE TABS
  // -------------------------------------------------------------
  console.log("\n--- 4. ADMIN WORKSPACE TABS ---");
  await adminPage.waitForSelector('nav[role="tablist"]', { timeout: 5000 });
  const tabButtons = adminPage.locator('nav[role="tablist"] button');
  const tabCount = await tabButtons.count();
  const tabLabels = [];
  for (let i = 0; i < tabCount; i++) {
    tabLabels.push((await tabButtons.nth(i).innerText()).trim());
  }
  console.log("Tab Count:", tabCount);
  console.log("Tab Labels:", tabLabels);

  const expected11Tabs = [
    "Tổng quan",
    "Quản lý Blog",
    "Tài khoản",
    "Hồ sơ Reader",
    "Gói AI",
    "Thanh toán",
    "Rút tiền",
    "Báo cáo vi phạm",
    "Nhật ký hệ thống",
    "Bảng phân quyền",
    "Sản phẩm liên kết",
  ];

  const hasMyBlogList = tabLabels.includes("Bài viết của tôi");
  console.log("'Bài viết của tôi' present:", hasMyBlogList);
  const all11TabsMatch = tabLabels.length === 11 && expected11Tabs.every((t) => tabLabels.includes(t));
  console.log("Workspace 11 Tabs Match:", all11TabsMatch && !hasMyBlogList ? "PASS" : "FAIL");

  // -------------------------------------------------------------
  // 5. ADMIN DIRECT ROUTE TEST (USER-ONLY ROUTES)
  // -------------------------------------------------------------
  console.log("\n--- 5. ADMIN DIRECT ROUTE TEST ---");
  const userOnlyRoutes = [
    "/home",
    "/profile/astrology",
    "/profile/wallet",
    "/profile/subscription",
    "/bookings",
    "/tarot-history",
    "/support",
  ];

  let allDirectRoutesRedirectPass = true;
  for (const route of userOnlyRoutes) {
    await adminPage.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    await adminPage.waitForTimeout(500);
    const destUrl = adminPage.url();
    const redirected = destUrl.endsWith("/admin");
    console.log(`Access ${route} -> Redirected to: ${destUrl} (${redirected ? "PASS" : "FAIL"})`);
    if (!redirected) allDirectRoutesRedirectPass = false;
  }
  console.log("Direct Member Routes Redirection:", allDirectRoutesRedirectPass ? "PASS" : "FAIL");

  // -------------------------------------------------------------
  // 6. ADMIN PUBLIC ROUTE TEST
  // -------------------------------------------------------------
  console.log("\n--- 6. ADMIN PUBLIC ROUTE TEST ---");
  const publicRoutes = ["/tarot", "/readers", "/shop", "/blogs"];
  for (const route of publicRoutes) {
    await adminPage.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    await adminPage.waitForTimeout(300);
    const destUrl = adminPage.url();
    const headerTitle = await adminPage.locator("header").innerText().catch(() => "");
    const isAdminHeader = headerTitle.includes("Admin") && !headerTitle.includes("Tarot AI");
    console.log(`Access ${route} -> URL: ${destUrl} | Admin Header Kept: ${isAdminHeader}`);
  }

  // -------------------------------------------------------------
  // 7. CUSTOMER WIDGETS
  // -------------------------------------------------------------
  console.log("\n--- 7. CUSTOMER WIDGETS ---");
  await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
  const feedbackWidget = await adminPage.locator('button:has-text("Góp ý"), div:has-text("Góp ý phản hồi")').count();
  const chatDockWidget = await adminPage.locator('button:has-text("Trao đổi"), div:has-text("ChatDock")').count();
  console.log("FeedbackPrompt count (expected 0):", feedbackWidget);
  console.log("ChatDock count (expected 0):", chatDockWidget);
  const widgetsPass = feedbackWidget === 0 && chatDockWidget === 0;
  console.log("Customer Widgets Hidden for Admin:", widgetsPass ? "PASS" : "FAIL");

  await adminContext.close();

  // -------------------------------------------------------------
  // 8. ROLE REGRESSION (USER, STAFF, MANAGER)
  // -------------------------------------------------------------
  console.log("\n--- 8. ROLE REGRESSION ---");

  // 8.1 USER
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  await setupMockRoutes(userPage, MEMBER_USER);
  await injectSession(userPage, MEMBER_USER);
  await userPage.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
  const userHomeUrl = userPage.url();
  console.log("USER /home URL:", userHomeUrl, userHomeUrl.endsWith("/home") ? "PASS" : "FAIL");

  await userPage.goto(`${BASE_URL}/tarot`, { waitUntil: "networkidle" });
  console.log("USER /tarot URL:", userPage.url(), userPage.url().endsWith("/tarot") ? "PASS" : "FAIL");

  await userPage.goto(`${BASE_URL}/shop`, { waitUntil: "networkidle" });
  console.log("USER /shop URL:", userPage.url(), userPage.url().endsWith("/shop") ? "PASS" : "FAIL");
  await userContext.close();

  // 8.2 STAFF
  const staffContext = await browser.newContext();
  const staffPage = await staffContext.newPage();
  await setupMockRoutes(staffPage, STAFF_USER);
  await injectSession(staffPage, STAFF_USER);
  await staffPage.goto(`${BASE_URL}/staff`, { waitUntil: "networkidle" });
  const staffUrl = staffPage.url();
  const staffNavText = await staffPage.locator("header nav").innerText().catch(() => "");
  console.log("STAFF /staff URL:", staffUrl, staffUrl.endsWith("/staff") ? "PASS" : "FAIL");
  console.log("STAFF Nav Text:", staffNavText, staffNavText.includes("Bàn làm việc") ? "PASS" : "FAIL");
  await staffContext.close();

  // 8.3 MANAGER
  const mgrContext = await browser.newContext();
  const mgrPage = await mgrContext.newPage();
  await setupMockRoutes(mgrPage, MANAGER_USER);
  await injectSession(mgrPage, MANAGER_USER);
  await mgrPage.goto(`${BASE_URL}/manager`, { waitUntil: "networkidle" });
  const mgrUrl = mgrPage.url();
  const mgrNavText = await mgrPage.locator("header nav").innerText().catch(() => "");
  console.log("MANAGER /manager URL:", mgrUrl, mgrUrl.endsWith("/manager") ? "PASS" : "FAIL");
  console.log("MANAGER Nav Text:", mgrNavText, mgrNavText.includes("Quản lý") ? "PASS" : "FAIL");
  await mgrContext.close();

  // -------------------------------------------------------------
  // DEPRECATED ROUTE REDIRECTS (/reader, /reader-hub -> /staff)
  // -------------------------------------------------------------
  console.log("\n--- DEPRECATED ROUTE REDIRECTS ---");
  const redirectContext = await browser.newContext();
  const redirectPage = await redirectContext.newPage();
  await redirectPage.goto(`${BASE_URL}/reader`, { waitUntil: "networkidle" });
  console.log("/reader redirect ->", redirectPage.url(), redirectPage.url().endsWith("/staff") ? "PASS" : "FAIL");
  await redirectPage.goto(`${BASE_URL}/reader-hub`, { waitUntil: "networkidle" });
  console.log("/reader-hub redirect ->", redirectPage.url(), redirectPage.url().endsWith("/staff") ? "PASS" : "FAIL");
  await redirectContext.close();

  console.log("\n--- CONSOLE ERRORS SUMMARY ---");
  console.log("Total console errors:", consoleErrors.length);
  consoleErrors.forEach((err) => console.log(" -", err));

  await browser.close();
}

runVerification().catch((err) => {
  console.error("Verification failed with error:", err);
  process.exit(1);
});
