// src/lib/test-api.ts - Chạy thử trong console browser
export async function testAuth() {
  console.log("Testing API connection...");

  // Test register
  try {
    const result = await fetch("http://localhost:8080/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testuser",
        password: "Test123456",
        fullName: "Test User",
      }),
    });
    const data = await result.json();
    console.log("Register response:", data);
  } catch (e) {
    console.error("Register error:", e);
  }

  // Test login
  try {
    const result = await fetch("http://localhost:8080/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testuser",
        password: "Test123456",
      }),
    });
    const data = await result.json();
    console.log("Login response:", data);
  } catch (e) {
    console.error("Login error:", e);
  }
}
