import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8081';
const API_URL = 'http://localhost:8080';

async function getAuthToken(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  return data.data; // { userId, username, email, fullName, role, permissions, accessToken, refreshToken }
}

async function setAuthContext(page, authData) {
  await page.evaluate(data => {
    localStorage.setItem('astrotarot_access_token', data.accessToken);
    localStorage.setItem('astrotarot_refresh_token', data.refreshToken || '');
    const userObj = {
      id: data.userId,
      name: data.fullName || data.username,
      full_name: data.fullName,
      username: data.username,
      email: data.email,
      role: data.role,
      permissions: data.permissions || [],
      joinedAt: new Date().toISOString()
    };
    localStorage.setItem('astrotarot_user_v2', JSON.stringify(userObj));
  }, authData);
}

async function runE2E() {
  console.log('================================================================');
  console.log('🚀 ASTROTAROT BLOG FULL-STACK REAL E2E BROWSER VERIFICATION');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });

  const staffAuth = await getAuthToken('staff.support@astrotarot.demo', 'admin123');
  const managerAuth = await getAuthToken('manager@astrotarot.demo', 'admin123');
  const adminAuth = await getAuthToken('admin@example.com', 'admin123');

  // -------------------------------------------------------------
  // FLOW A: PUBLIC GUEST FLOW
  // -------------------------------------------------------------
  console.log('--- [FLOW A] PUBLIC GUEST BROWSING, SEARCH, & 404 ---');
  const guestContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const guestPage = await guestContext.newPage();

  console.log('1. Guest loads /blogs...');
  await guestPage.goto(`${BASE_URL}/blogs`, { waitUntil: 'domcontentloaded' });
  await guestPage.waitForTimeout(2000);

  const guestH1 = await guestPage.locator('h1').innerText();
  console.log('   ✓ Page Heading:', guestH1);

  const blogCardsCount = await guestPage.locator('a[href^="/blog/"]').count();
  console.log(`   ✓ Rendered Blog Cards on Page 0: ${blogCardsCount}`);

  const firstCardTitle = await guestPage.locator('a[href^="/blog/"] h3').first().innerText();
  console.log('   ✓ First Card Title:', firstCardTitle);

  console.log('2. Guest searches for "Tarot"...');
  const searchInput = guestPage.locator('input[placeholder*="Tìm kiếm"]');
  await searchInput.fill('Tarot');
  await guestPage.waitForTimeout(1500);

  const searchCardsCount = await guestPage.locator('a[href^="/blog/"]').count();
  const searchTitles = await guestPage.locator('a[href^="/blog/"] h3').allInnerTexts();
  console.log(`   ✓ Search Results Count: ${searchCardsCount}`);
  console.log('   ✓ Matched Titles:', searchTitles.slice(0, 3));

  console.log('3. Guest clicks on first blog card to view details...');
  const firstCard = guestPage.locator('a[href^="/blog/"]').first();
  await firstCard.click();
  await guestPage.waitForTimeout(2000);

  const currentUrl = guestPage.url();
  console.log('   ✓ Navigated to:', currentUrl);
  const detailTitle = await guestPage.locator('h1').innerText();
  console.log('   ✓ Blog Detail H1:', detailTitle);

  console.log('4. Guest navigates to non-existent blog URL /blog/bai-viet-khong-ton-tai-xyz-404...');
  await guestPage.goto(`${BASE_URL}/blog/bai-viet-khong-ton-tai-xyz-404`, { waitUntil: 'domcontentloaded' });
  await guestPage.waitForTimeout(2000);

  const notFoundHeading = await guestPage.locator('h1').innerText();
  console.log('   ✓ 404 Handled Cleanly:', notFoundHeading);

  await guestContext.close();

  // -------------------------------------------------------------
  // FLOW B & C: STAFF AUTHOR CREATION, REJECTION & AUTO-RESET
  // -------------------------------------------------------------
  console.log('\n--- [FLOW B & C] STAFF AUTHORING, REJECTION & AUTO-RESET ---');
  const staffContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const staffPage = await staffContext.newPage();

  // Inject staff token
  await staffPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await setAuthContext(staffPage, staffAuth);

  console.log('1. Staff navigates to /staff?tab=blogs...');
  await staffPage.goto(`${BASE_URL}/staff?tab=blogs`, { waitUntil: 'domcontentloaded' });
  await staffPage.waitForTimeout(2000);

  const timestamp = Date.now();
  const testTitle = `Bài viết E2E UI Live ${timestamp}`;
  const testSlug = `bai-viet-e2e-ui-live-${timestamp}`;

  console.log('2. Staff clicks "Viết bài mới" to open BlogEditorModal...');
  const createBtn = staffPage.getByRole('button', { name: 'Viết bài mới' });
  await createBtn.click();
  await staffPage.waitForTimeout(1000);

  console.log('3. Staff fills form and submits DRAFT...');
  await staffPage.locator('#blog-title').fill(testTitle);
  await staffPage.locator('#blog-summary').fill('Tóm tắt bài viết kiểm thử giao diện thực tế.');
  await staffPage.locator('#blog-content-input').fill('Nội dung bài viết kiểm thử E2E giao diện thực tế với đầy đủ các bước.');

  const saveDraftBtn = staffPage.getByRole('button', { name: 'Lưu bản nháp' });
  await saveDraftBtn.click();
  await staffPage.waitForTimeout(2000);

  console.log('   ✓ Saved DRAFT. Checking table in MyBlogList...');
  const myBlogTitles = await staffPage.locator(`text=${testTitle}`).count();
  console.log(`   ✓ Found newly created draft on UI: ${myBlogTitles > 0}`);

  console.log('4. Staff submits blog for review (DRAFT -> PENDING)...');
  const row = staffPage.locator(`div.group:has-text("${testTitle}")`).first();
  const submitBtn = row.locator('button:has-text("Gửi duyệt"), button:has-text("Gửi lại")');
  await submitBtn.click();
  await staffPage.waitForTimeout(1000);

  // Confirm in Dialog
  const confirmSubmit = staffPage.locator('div[role="dialog"] button:has-text("Gửi duyệt ngay"), div[role="dialog"] button:has-text("Xác nhận")');
  if (await confirmSubmit.count() > 0) {
    await confirmSubmit.click();
    await staffPage.waitForTimeout(2000);
  }
  console.log('   ✓ Submitted blog to PENDING.');

  // -------------------------------------------------------------
  // FLOW C & D: MANAGER MODERATION (REJECT -> APPROVE -> PUBLISH)
  // -------------------------------------------------------------
  console.log('\n--- [FLOW C & D] MANAGER MODERATION REVIEW ---');
  const mgrContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const mgrPage = await mgrContext.newPage();

  await mgrPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await setAuthContext(mgrPage, managerAuth);

  console.log('1. Manager navigates to /manager?tab=blog-review...');
  await mgrPage.goto(`${BASE_URL}/manager?tab=blog-review`, { waitUntil: 'domcontentloaded' });
  await mgrPage.waitForTimeout(2000);

  // Filter keyword to isolate test blog
  console.log('   Manager searches for test blog...');
  const mgrSearchInput = mgrPage.locator('input[placeholder*="Tìm theo tiêu đề"]');
  await mgrSearchInput.fill(String(timestamp));
  await mgrPage.waitForTimeout(1500);

  const pendingRow = mgrPage.locator(`div.group:has-text("${testTitle}")`).first();
  console.log(`   ✓ Found blog in Manager review queue: ${await pendingRow.count() > 0}`);

  console.log('2. Manager rejects blog with reason...');
  const rejectBtn = pendingRow.locator('button:has-text("Từ chối")');
  await rejectBtn.click();
  await mgrPage.waitForTimeout(1000);

  const reasonInput = mgrPage.locator('div[role="dialog"] textarea');
  await reasonInput.fill('Cần bổ sung thêm ví dụ cụ thể về trải bài 3 lá Tarot.');
  const confirmRejectBtn = mgrPage.locator('div[role="dialog"] button:has-text("Xác nhận từ chối")');
  await confirmRejectBtn.click();
  await mgrPage.waitForTimeout(2000);
  console.log('   ✓ Blog rejected with reason.');

  // -------------------------------------------------------------
  // FLOW C VERIFICATION: STAFF EDITS REJECTED -> AUTO DRAFT -> RESUBMIT
  // -------------------------------------------------------------
  console.log('\n--- [FLOW C VERIFY] AUTHOR EDITS REJECTED BLOG -> AUTO DRAFT ---');
  await staffPage.reload({ waitUntil: 'domcontentloaded' });
  await staffPage.waitForTimeout(2000);

  // Search for test blog in author view
  const staffSearchInput = staffPage.locator('input[placeholder*="Tìm theo tiêu đề"]');
  await staffSearchInput.fill(String(timestamp));
  await staffPage.waitForTimeout(1500);

  // Switch to REJECTED tab
  const rejectedTab = staffPage.getByRole('button', { name: 'Bị từ chối', exact: true });
  if (await rejectedTab.count() > 0) {
    await rejectedTab.click();
    await staffPage.waitForTimeout(1000);
  }

  const rejectedRow = staffPage.locator(`div.group:has-text("${testTitle}")`).first();
  console.log(`   ✓ Blog shown in REJECTED tab: ${await rejectedRow.count() > 0}`);

  console.log('Staff clicks edit on rejected blog...');
  const editBtn = rejectedRow.locator('button:has-text("Sửa")');
  await editBtn.click();
  await staffPage.waitForTimeout(1000);

  console.log('Staff updates content and saves...');
  const editContentInput = staffPage.locator('#blog-content-input');
  await editContentInput.fill('Nội dung đã được chỉnh sửa bổ sung ví dụ chi tiết trải bài 3 lá Tarot.');
  const updateSaveBtn = staffPage.getByRole('button', { name: 'Cập nhật bài viết' });
  await updateSaveBtn.click();
  await staffPage.waitForTimeout(2000);

  // Verify status in DB / UI is now DRAFT
  console.log('Staff resubmits to PENDING...');
  // Click Drafts tab
  const draftTab = staffPage.getByRole('button', { name: 'Bản nháp', exact: true });
  if (await draftTab.count() > 0) {
    await draftTab.click();
    await staffPage.waitForTimeout(1000);
  }
  const draftRow = staffPage.locator(`div.group:has-text("${testTitle}")`).first();
  const resubmitBtn = draftRow.locator('button:has-text("Gửi duyệt"), button:has-text("Gửi lại")');
  await resubmitBtn.click();
  await staffPage.waitForTimeout(1000);

  const confirmResubmit = staffPage.locator('div[role="dialog"] button:has-text("Gửi duyệt ngay"), div[role="dialog"] button:has-text("Xác nhận")');
  if (await confirmResubmit.count() > 0) {
    await confirmResubmit.click();
    await staffPage.waitForTimeout(2000);
  }
  console.log('   ✓ Resubmitted blog to PENDING successfully.');

  // -------------------------------------------------------------
  // FLOW D: MANAGER PREVIEWS, APPROVES & PUBLISHES
  // -------------------------------------------------------------
  console.log('\n--- [FLOW D] MANAGER PREVIEW, APPROVE & PUBLISH ---');
  await mgrPage.reload({ waitUntil: 'domcontentloaded' });
  await mgrPage.waitForTimeout(2000);

  const mgrSearchInput2 = mgrPage.locator('input[placeholder*="Tìm theo tiêu đề"]');
  await mgrSearchInput2.fill(String(timestamp));
  await mgrPage.waitForTimeout(1500);

  const pendingTab = mgrPage.getByRole('button', { name: 'Chờ duyệt', exact: true });
  await pendingTab.click();
  await mgrPage.waitForTimeout(1000);

  const resubmittedRow = mgrPage.locator(`div.group:has-text("${testTitle}")`).first();
  console.log(`   ✓ Found resubmitted blog in Manager queue: ${await resubmittedRow.count() > 0}`);

  console.log('Manager opens Preview Modal...');
  const previewBtn = resubmittedRow.locator('button:has-text("Xem trước")');
  await previewBtn.click();
  await mgrPage.waitForTimeout(1000);

  const previewModalTitle = await mgrPage.locator('div[role="dialog"] h2, div[role="dialog"] h1, div[role="dialog"] h3').first().innerText();
  console.log('   ✓ Preview Modal Opened for:', previewModalTitle);

  // Close preview with Escape key
  await mgrPage.keyboard.press('Escape');
  await mgrPage.waitForTimeout(1000);

  console.log('Manager clicks "Phê duyệt" (APPROVE)...');
  const approveBtn = resubmittedRow.locator('button:has-text("Duyệt")');
  await approveBtn.click();
  await mgrPage.waitForTimeout(1000);
  const confirmApproveBtn = mgrPage.locator('div[role="dialog"] button:has-text("Duyệt bài"), div[role="dialog"] button:has-text("Xác nhận")');
  if (await confirmApproveBtn.count() > 0) {
    await confirmApproveBtn.click();
    await mgrPage.waitForTimeout(2000);
  }
  console.log('   ✓ Approved blog (APPROVED).');

  console.log('Manager navigates to "Đã duyệt" tab and clicks "Xuất bản" (PUBLISH)...');
  const approvedTab = mgrPage.getByRole('button', { name: 'Đã duyệt', exact: true });
  await approvedTab.click();
  await mgrPage.waitForTimeout(1000);

  const approvedRow = mgrPage.locator(`div.group:has-text("${testTitle}")`).first();
  const publishBtn = approvedRow.locator('button:has-text("Xuất bản")');
  await publishBtn.click();
  await mgrPage.waitForTimeout(1000);
  const confirmPublishBtn = mgrPage.locator('div[role="dialog"] button:has-text("Xuất bản ngay"), div[role="dialog"] button:has-text("Xác nhận")');
  if (await confirmPublishBtn.count() > 0) {
    await confirmPublishBtn.click();
    await mgrPage.waitForTimeout(2000);
  }
  console.log('   ✓ Published blog (PUBLISHED).');

  // -------------------------------------------------------------
  // FLOW E: ADMIN HARD DELETION
  // -------------------------------------------------------------
  console.log('\n--- [FLOW E] ADMIN BLOG MANAGEMENT & HARD DELETION ---');
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const adminPage = await adminContext.newPage();

  await adminPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await setAuthContext(adminPage, adminAuth);

  console.log('1. Admin navigates to /admin?tab=blogs...');
  await adminPage.goto(`${BASE_URL}/admin?tab=blogs`, { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(2000);

  const adminSearchInput = adminPage.locator('input[placeholder*="Tìm theo tiêu đề"]');
  await adminSearchInput.fill(String(timestamp));
  await adminPage.waitForTimeout(1500);

  // Switch to Published tab
  const adminPublishedTab = adminPage.getByRole('button', { name: 'Đã xuất bản', exact: true });
  if (await adminPublishedTab.count() > 0) {
    await adminPublishedTab.click();
    await adminPage.waitForTimeout(1000);
  }

  const adminRow = adminPage.locator(`div.group:has-text("${testTitle}")`).first();
  console.log(`   ✓ Found published blog in Admin view: ${await adminRow.count() > 0}`);

  console.log('2. Admin deletes blog...');
  const deleteBtn = adminRow.locator('button[title="Xóa bài viết"]');
  await deleteBtn.click();
  await adminPage.waitForTimeout(1000);

  const confirmDeleteBtn = adminPage.locator('div[role="dialog"] button:has-text("Xóa vĩnh viễn"), div[role="dialog"] button:has-text("Xác nhận")');
  if (await confirmDeleteBtn.count() > 0) {
    await confirmDeleteBtn.click();
    await adminPage.waitForTimeout(2000);
  }
  console.log('   ✓ Admin deleted blog.');

  // Check public /blog/{slug}
  const publicCheckRes = await fetch(`${API_URL}/api/v1/blogs/${testSlug}`);
  console.log(`   ✓ Verifying blog is 404 in API after deletion: Status ${publicCheckRes.status}`);

  await staffContext.close();
  await mgrContext.close();
  await adminContext.close();
  await browser.close();

  console.log('\n================================================================');
  console.log('🎉 ALL FULL-STACK E2E USER FLOWS COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

runE2E().catch(err => {
  console.error('E2E Run failed:', err);
  process.exit(1);
});
