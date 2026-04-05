import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.join(process.cwd(), 'scripts/screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function shot(page: import('@playwright/test').Page, name: string) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
  console.log(`  📸 ${name}.png`);
}

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const issues: string[] = [];
function flag(msg: string) {
  issues.push(msg);
  console.log(`  ⚠️  ${msg}`);
}

(async () => {
  const browser = await chromium.launch();

  // ─────────────────────────────────────────────────────────────────────────
  // 1. 스플래시 — 데스크탑
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[1] 스플래시 데스크탑');
  const desk = await browser.newPage();
  await desk.setViewportSize({ width: 1280, height: 800 });
  await desk.goto(BASE_URL);
  await wait(3000); // 애니메이션 완료 대기
  await shot(desk, '01_splash_desktop');

  // 배경이 어두운지 확인
  const deskBg = await desk.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.fixed.inset-0');
    return el ? getComputedStyle(el).backgroundColor : null;
  });
  if (!deskBg || deskBg === 'rgba(0, 0, 0, 0)') flag('데스크탑 스플래시 배경색 미적용');

  // ─────────────────────────────────────────────────────────────────────────
  // 2. 스플래시 — 모바일
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[2] 스플래시 모바일');
  const mob = await browser.newPage();
  await mob.setViewportSize({ width: 390, height: 844 });
  await mob.goto(BASE_URL);
  await wait(3000);
  await shot(mob, '02_splash_mobile');

  // 가로 스크롤 체크
  const { scrollW, clientW } = await mob.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  if (scrollW > clientW) flag(`모바일 가로 스크롤 발생 (${scrollW} > ${clientW})`);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. 스플래시 클릭 → 온보딩 시작 화면
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[3] 온보딩 진입');
  await mob.locator('button').first().click();
  await wait(1200);
  await shot(mob, '03_onboarding_start_mobile');

  // 화면 전환이 일어났는지 (버튼 텍스트 변화 등)
  const bodyText = await mob.evaluate(() => document.body.innerText);
  if (bodyText.trim().length < 5) flag('온보딩 진입 후 화면 내용 없음');

  // ─────────────────────────────────────────────────────────────────────────
  // 4. 닉네임 입력 단계 (있으면)
  // ─────────────────────────────────────────────────────────────────────────
  const nameInput = mob.locator('input[type="text"]').first();
  if (await nameInput.isVisible()) {
    console.log('\n[4] 닉네임 입력');
    await nameInput.fill('테스트');
    await wait(300);
    await shot(mob, '04_nickname_input_mobile');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. 데스크탑 — 온보딩 진입 + 흐름
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[5] 데스크탑 온보딩');
  await desk.locator('button').first().click();
  await wait(1200);
  await shot(desk, '05_onboarding_start_desktop');

  // ─────────────────────────────────────────────────────────────────────────
  // 6. 어드민 로그인
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[6] 어드민 로그인');
  const adminDesk = await browser.newPage();
  await adminDesk.setViewportSize({ width: 1280, height: 800 });
  await adminDesk.goto(`${BASE_URL}/admin`);
  await wait(600);
  await shot(adminDesk, '06_admin_login_desktop');

  const adminMob = await browser.newPage();
  await adminMob.setViewportSize({ width: 390, height: 844 });
  await adminMob.goto(`${BASE_URL}/admin`);
  await wait(600);
  await shot(adminMob, '07_admin_login_mobile');

  // 로그인 폼 요소 점검
  for (const [label, page] of [['desktop', adminDesk], ['mobile', adminMob]] as const) {
    const pw = page.locator('input[type="password"]');
    const btn = page.locator('button[type="submit"]');
    if (!(await pw.isVisible())) flag(`[${label}] 비밀번호 input 없음`);
    if (!(await btn.isVisible())) flag(`[${label}] 로그인 버튼 없음`);
    if (!(await btn.isDisabled())) flag(`[${label}] 빈 입력 시 버튼 disabled 아님`);
  }

  // 틀린 비밀번호 에러 메시지 확인
  await adminMob.locator('input[type="password"]').fill('wrongpassword');
  await adminMob.locator('button[type="submit"]').click();
  await wait(2000);
  const errorMsg = adminMob.locator('p.text-red-400');
  if (await errorMsg.isVisible()) {
    console.log(`  ✅ 에러 메시지 노출: "${await errorMsg.textContent()}"`);
  } else {
    flag('틀린 비밀번호 입력 시 에러 메시지 없음');
  }
  await shot(adminMob, '08_admin_login_error_mobile');

  // ─────────────────────────────────────────────────────────────────────────
  // 7. 어드민 대시보드 — 미인증 리다이렉트
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[7] 어드민 대시보드 미인증 리다이렉트');
  await adminDesk.goto(`${BASE_URL}/admin/dashboard`);
  await wait(600);
  await shot(adminDesk, '09_admin_dashboard_no_auth');
  if (!adminDesk.url().includes('/admin') || adminDesk.url().includes('/dashboard')) {
    flag('미인증 /admin/dashboard 접근 시 /admin 리다이렉트 안 됨');
  } else {
    console.log(`  ✅ /admin 으로 리다이렉트 됨`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 결과 리포트
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  if (issues.length === 0) {
    console.log('✅ 발견된 이슈 없음');
  } else {
    console.log(`⚠️  이슈 ${issues.length}개:`);
    issues.forEach((i, n) => console.log(`  ${n + 1}. ${i}`));
  }
  console.log(`\n📁 스크린샷: ${OUT_DIR}`);

  await browser.close();
})();
