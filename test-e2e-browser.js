import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('request', req => {
    if (req.url().includes('8080') || req.url().includes('api')) {
      console.log('REQ:', req.method(), req.url(), req.headers());
    }
  });

  page.on('response', async res => {
    if (res.url().includes('8080') || res.url().includes('api')) {
      let body = '';
      try { body = await res.text(); } catch {}
      console.log('RES:', res.status(), res.url(), body.substring(0, 150));
    }
  });

  await page.goto('http://localhost:8081/blogs', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  await browser.close();
}

run().catch(console.error);
