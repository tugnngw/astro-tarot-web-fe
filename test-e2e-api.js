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
  if (!res.ok) throw new Error('Login failed for ' + email + ': ' + JSON.stringify(res.data));
  return res.data.data.accessToken;
}

async function run() {
  console.log('=== 1. AUTHENTICATION TOKENS ===');
  const adminToken = await login('admin@example.com', 'admin123');
  const managerToken = await login('manager@astrotarot.demo', 'admin123');
  const staffToken = await login('staff.support@astrotarot.demo', 'admin123');
  const userToken = await login('user.an@astrotarot.demo', 'admin123');
  console.log('Admin, Manager, Staff, User tokens obtained successfully.');

  console.log('\n=== 2. PUBLIC API VERIFICATION ===');
  const pubList = await request('/api/v1/blogs?page=0&size=10');
  console.log('GET /api/v1/blogs:', pubList.status, 'Total elements:', pubList.data?.data?.totalElements, 'Items in page:', pubList.data?.data?.content?.length);

  const existingSlug = pubList.data?.data?.content?.[0]?.slug;
  if (existingSlug) {
    const pubDetail = await request('/api/v1/blogs/' + existingSlug);
    console.log('GET /api/v1/blogs/' + existingSlug + ':', pubDetail.status, 'Title:', pubDetail.data?.data?.title);
  }

  const pub404 = await request('/api/v1/blogs/non-existent-slug-404-test');
  console.log('GET /api/v1/blogs/non-existent-slug-404-test:', pub404.status, pub404.data?.error?.code || pub404.data?.message);

  console.log('\n=== 3. AUTHOR LIFECYCLE (STAFF) ===');
  const timestamp = Date.now();
  const newBlogSlug = 'bai-viet-e2e-test-' + timestamp;
  const createRes = await request('/api/v1/staff/blogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + staffToken },
    body: JSON.stringify({
      title: 'Bài viết E2E Test ' + timestamp,
      slug: newBlogSlug,
      summary: 'Tóm tắt bài viết test E2E thực tế',
      content: 'Nội dung chi tiết của bài viết kiểm thử E2E tự động trên môi trường thật.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23'
    })
  });
  console.log('POST /api/v1/staff/blogs (Create DRAFT):', createRes.status, 'Status:', createRes.data?.data?.status, 'ID:', createRes.data?.data?.id);
  const blogId = createRes.data?.data?.id;

  const updateRes = await request('/api/v1/staff/blogs/' + blogId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + staffToken },
    body: JSON.stringify({
      title: 'Bài viết E2E Test Updated ' + timestamp,
      slug: newBlogSlug,
      summary: 'Tóm tắt bài viết test E2E thực tế (Updated)',
      content: 'Nội dung chi tiết cập nhật của bài viết kiểm thử E2E.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23'
    })
  });
  console.log('PUT /api/v1/staff/blogs/' + blogId + ' (Update DRAFT):', updateRes.status, 'Title:', updateRes.data?.data?.title);

  const submitRes = await request('/api/v1/staff/blogs/' + blogId + '/submit', {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + staffToken }
  });
  console.log('PATCH /api/v1/staff/blogs/' + blogId + '/submit (Submit PENDING):', submitRes.status, 'Status:', submitRes.data?.data?.status);

  console.log('\n=== 4. REJECTION & RESUBMIT LIFECYCLE (FLOW C) ===');
  const rejectRes = await request('/api/v1/blogs/' + blogId + '/review', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + managerToken },
    body: JSON.stringify({
      action: 'REJECTED',
      rejectionReason: 'Cần bổ sung thêm ví dụ thực tế về trải bài Tarot.'
    })
  });
  console.log('PATCH /api/v1/blogs/' + blogId + '/review (Manager REJECTED):', rejectRes.status, 'Status:', rejectRes.data?.data?.status, 'Reason:', rejectRes.data?.data?.rejectionReason);

  const editRejectedRes = await request('/api/v1/staff/blogs/' + blogId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + staffToken },
    body: JSON.stringify({
      title: 'Bài viết E2E Test Updated After Rejection ' + timestamp,
      slug: newBlogSlug,
      summary: 'Tóm tắt bài viết sau khi sửa lỗi từ chối',
      content: 'Nội dung đã được bổ sung ví dụ thực tế về trải bài 3 lá Tarot theo yêu cầu.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23'
    })
  });
  console.log('PUT /api/v1/staff/blogs/' + blogId + ' (Edit REJECTED -> Auto DRAFT):', editRejectedRes.status, 'Status:', editRejectedRes.data?.data?.status, 'Reason:', editRejectedRes.data?.data?.rejectionReason);

  const resubmitRes = await request('/api/v1/staff/blogs/' + blogId + '/submit', {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + staffToken }
  });
  console.log('PATCH /api/v1/staff/blogs/' + blogId + '/submit (Resubmit PENDING):', resubmitRes.status, 'Status:', resubmitRes.data?.data?.status);

  console.log('\n=== 5. MODERATION APPROVAL & PUBLISH (FLOW D) ===');
  const approveRes = await request('/api/v1/blogs/' + blogId + '/review', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + managerToken },
    body: JSON.stringify({
      action: 'APPROVED'
    })
  });
  console.log('PATCH /api/v1/blogs/' + blogId + '/review (Manager APPROVED):', approveRes.status, 'Status:', approveRes.data?.data?.status);

  const publishRes = await request('/api/v1/blogs/' + blogId + '/publish', {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + managerToken }
  });
  console.log('PATCH /api/v1/blogs/' + blogId + '/publish (Manager PUBLISH):', publishRes.status, 'Status:', publishRes.data?.data?.status);

  const publicCheck = await request('/api/v1/blogs/' + newBlogSlug);
  console.log('GET /api/v1/blogs/' + newBlogSlug + ' (Publicly Accessible):', publicCheck.status, 'Status:', publicCheck.data?.data?.status);

  console.log('\n=== 6. ADMIN HARD DELETION (FLOW E) ===');
  const deleteRes = await request('/api/v1/blogs/' + blogId, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + adminToken }
  });
  console.log('DELETE /api/v1/blogs/' + blogId + ' (Admin DELETE):', deleteRes.status);

  const postDeleteCheck = await request('/api/v1/blogs/' + newBlogSlug);
  console.log('GET /api/v1/blogs/' + newBlogSlug + ' (After Admin Delete):', postDeleteCheck.status, '(Expected: 404)');

  console.log('\n=== 7. RBAC MATRIX VERIFICATION ===');
  const unauthMe = await request('/api/v1/staff/blogs/me');
  console.log('Unauthenticated GET /api/v1/staff/blogs/me -> Status:', unauthMe.status, '(Expected 401)');

  const unauthAll = await request('/api/v1/blogs/all');
  console.log('Unauthenticated GET /api/v1/blogs/all -> Status:', unauthAll.status, '(Expected 401)');

  const userMe = await request('/api/v1/staff/blogs/me', { headers: { 'Authorization': 'Bearer ' + userToken } });
  console.log('User GET /api/v1/staff/blogs/me -> Status:', userMe.status, '(Expected 403)');

  const userAll = await request('/api/v1/blogs/all', { headers: { 'Authorization': 'Bearer ' + userToken } });
  console.log('User GET /api/v1/blogs/all -> Status:', userAll.status, '(Expected 403)');

  const staffAll = await request('/api/v1/blogs/all', { headers: { 'Authorization': 'Bearer ' + staffToken } });
  console.log('Staff GET /api/v1/blogs/all -> Status:', staffAll.status, '(Expected 403)');

  const managerAll = await request('/api/v1/blogs/all', { headers: { 'Authorization': 'Bearer ' + managerToken } });
  console.log('Manager GET /api/v1/blogs/all -> Status:', managerAll.status, '(Expected 200)');

  const adminAll = await request('/api/v1/blogs/all', { headers: { 'Authorization': 'Bearer ' + adminToken } });
  console.log('Admin GET /api/v1/blogs/all -> Status:', adminAll.status, '(Expected 200)');

  console.log('\n=== 8. NEGATIVE & BOUNDARY CASES ===');
  const badReq = await request('/api/v1/staff/blogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + staffToken },
    body: JSON.stringify({
      title: '',
      slug: '',
      content: ''
    })
  });
  console.log('POST /api/v1/staff/blogs (Empty fields):', badReq.status, '(Expected 400)');

  const notFoundReview = await request('/api/v1/blogs/00000000-0000-0000-0000-000000000000/review', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + managerToken },
    body: JSON.stringify({ action: 'APPROVED' })
  });
  console.log('PATCH non-existent ID review -> Status:', notFoundReview.status, '(Expected 404)');
}

run().catch(console.error);
