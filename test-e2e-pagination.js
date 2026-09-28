const BASE = 'http://localhost:8080';

async function request(url, options = {}) {
  const res = await fetch(BASE + url, options);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function login(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed: ' + JSON.stringify(res.data));
  return res.data.data.accessToken;
}

async function run() {
  console.log('=== DATABASE 30+ ITEMS PAGINATION & SEARCH VERIFICATION ===');
  const staffToken = await login('staff.support@astrotarot.demo', 'admin123');
  const managerToken = await login('manager@astrotarot.demo', 'admin123');

  console.log('1. Seeding 35 blogs via Staff & Manager workflow...');
  const createdIds = [];
  const timestamp = Date.now();

  for (let i = 1; i <= 35; i++) {
    const slug = `seed-blog-page-test-${timestamp}-${i}`;
    const title = `Bài viết Kiểm thử Phân trang số ${i} - ${i % 2 === 0 ? 'Tarot' : 'Chiêm tinh'}`;
    const createRes = await request('/api/v1/staff/blogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + staffToken },
      body: JSON.stringify({
        title,
        slug,
        summary: `Tóm tắt bài viết số ${i} phục vụ kiểm thử phân trang và tìm kiếm.`,
        content: `Nội dung chi tiết bài viết số ${i} với từ khóa phân loại kiểm thử tự động.`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23'
      })
    });

    const blogId = createRes.data?.data?.id;
    if (blogId) {
      createdIds.push(blogId);

      // Distribute statuses:
      // 1-15: PUBLISHED
      // 16-25: PENDING
      // 26-30: REJECTED
      // 31-35: DRAFT
      if (i <= 30) {
        // Submit to PENDING
        await request(`/api/v1/staff/blogs/${blogId}/submit`, {
          method: 'PATCH',
          headers: { 'Authorization': 'Bearer ' + staffToken }
        });

        if (i <= 15) {
          // Approve & Publish
          await request(`/api/v1/blogs/${blogId}/review`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + managerToken },
            body: JSON.stringify({ action: 'APPROVED' })
          });
          await request(`/api/v1/blogs/${blogId}/publish`, {
            method: 'PATCH',
            headers: { 'Authorization': 'Bearer ' + managerToken }
          });
        } else if (i > 25 && i <= 30) {
          // Reject with reason
          await request(`/api/v1/blogs/${blogId}/review`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + managerToken },
            body: JSON.stringify({ action: 'REJECTED', rejectionReason: `Lý do từ chối bài số ${i}: Cần chỉnh sửa.` })
          });
        }
      }
    }
  }

  console.log(`Successfully seeded ${createdIds.length} blogs.`);

  console.log('\n2. Testing Public List Pagination & Search:');
  const pubPage0 = await request('/api/v1/blogs?page=0&size=5');
  console.log('Public Page 0 (size 5):', {
    totalElements: pubPage0.data?.data?.totalElements,
    totalPages: pubPage0.data?.data?.totalPages,
    currentPage: pubPage0.data?.data?.currentPage,
    contentLength: pubPage0.data?.data?.content?.length
  });

  const pubPage2 = await request('/api/v1/blogs?page=2&size=5');
  console.log('Public Page 2 (size 5):', {
    currentPage: pubPage2.data?.data?.currentPage,
    contentLength: pubPage2.data?.data?.content?.length,
    firstTitleOnPage: pubPage2.data?.data?.content?.[0]?.title
  });

  const pubSearch = await request('/api/v1/blogs?keyword=Tarot&page=0&size=5');
  console.log('Public Search "Tarot":', {
    totalElements: pubSearch.data?.data?.totalElements,
    totalPages: pubSearch.data?.data?.totalPages,
    contentLength: pubSearch.data?.data?.content?.length,
    matchedTitles: pubSearch.data?.data?.content?.map(b => b.title)
  });

  console.log('\n3. Testing Manager Review Queue Filtering by Status:');
  const mgrPending = await request('/api/v1/blogs/all?status=PENDING&page=0&size=10', {
    headers: { 'Authorization': 'Bearer ' + managerToken }
  });
  console.log('Manager Filter PENDING:', {
    totalElements: mgrPending.data?.data?.totalElements,
    totalPages: mgrPending.data?.data?.totalPages,
    contentLength: mgrPending.data?.data?.content?.length
  });

  const mgrRejected = await request('/api/v1/blogs/all?status=REJECTED&page=0&size=10', {
    headers: { 'Authorization': 'Bearer ' + managerToken }
  });
  console.log('Manager Filter REJECTED:', {
    totalElements: mgrRejected.data?.data?.totalElements,
    totalPages: mgrRejected.data?.data?.totalPages,
    contentLength: mgrRejected.data?.data?.content?.length
  });

  const mgrPublished = await request('/api/v1/blogs/all?status=PUBLISHED&page=0&size=10', {
    headers: { 'Authorization': 'Bearer ' + managerToken }
  });
  console.log('Manager Filter PUBLISHED:', {
    totalElements: mgrPublished.data?.data?.totalElements,
    totalPages: mgrPublished.data?.data?.totalPages,
    contentLength: mgrPublished.data?.data?.content?.length
  });

  console.log('\n4. Testing Staff My Blogs Filter by Status:');
  const staffDrafts = await request('/api/v1/staff/blogs/me?status=DRAFT&page=0&size=10', {
    headers: { 'Authorization': 'Bearer ' + staffToken }
  });
  console.log('Staff Filter DRAFT:', {
    totalElements: staffDrafts.data?.data?.totalElements,
    totalPages: staffDrafts.data?.data?.totalPages,
    contentLength: staffDrafts.data?.data?.content?.length
  });

  const staffPending = await request('/api/v1/staff/blogs/me?status=PENDING&page=0&size=10', {
    headers: { 'Authorization': 'Bearer ' + staffToken }
  });
  console.log('Staff Filter PENDING:', {
    totalElements: staffPending.data?.data?.totalElements,
    totalPages: staffPending.data?.data?.totalPages,
    contentLength: staffPending.data?.data?.content?.length
  });
}

run().catch(console.error);
