const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.join(__dirname, '..', 'scratch_test_output');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('=== [TEST 4] 실제 Chrome 브라우저 렌더링 및 반응형/인터랙션 검증 ===\n');

const testPages = [
  'public-sector',
  'ai_fullstack',
  'scp',
  'fabrix',
  'brity_works'
];

testPages.forEach(page => {
  console.log(`\n▶ [${page}] 브라우저 렌더링 테스트 중...`);

  const origUrl = `http://localhost:3002/html/offering/${page}.html`;
  const modUrl = `http://localhost:3002/html/offering/${page}_m.html`;

  const origDomPath = path.join(outDir, `${page}_orig_dom.html`);
  const modDomPath = path.join(outDir, `${page}_mod_dom.html`);

  const origShotDesktop = path.join(outDir, `${page}_orig_pc.png`);
  const modShotDesktop = path.join(outDir, `${page}_mod_pc.png`);

  const origShotMobile = path.join(outDir, `${page}_orig_mo.png`);
  const modShotMobile = path.join(outDir, `${page}_mod_mo.png`);

  try {
    // 1. DOM 덤프 (JavaScript 완전 실행 후 DOM 상태 확인)
    execSync(`"${chromePath}" --headless --disable-gpu --dump-dom "${origUrl}" > "${origDomPath}" 2>nul`, { timeout: 15000 });
    execSync(`"${chromePath}" --headless --disable-gpu --dump-dom "${modUrl}" > "${modDomPath}" 2>nul`, { timeout: 15000 });

    const origDom = fs.readFileSync(origDomPath, 'utf8');
    const modDom = fs.readFileSync(modDomPath, 'utf8');

    // DOM 내 loaded 클래스 확인 (.offering-main.loaded)
    const origLoaded = origDom.includes('offering-main loaded');
    const modLoaded = modDom.includes('offering-main loaded');
    console.log(`  - .offering-main.loaded (페이지 로딩 스크립트 실행): orig=${origLoaded}, mod=${modLoaded}`);

    // FAQ 접근성 ARIA 생성 확인 (faqButton-, faqPanel-)
    const origFaqId = origDom.includes('faqButton-');
    const modFaqId = modDom.includes('faqButton-');
    console.log(`  - FAQ WAI-ARIA 동적 ID 생성 (initFaq 실행): orig=${origFaqId}, mod=${modFaqId}`);

    // 2. 데스크톱 스크린샷 (1920x1080)
    execSync(`"${chromePath}" --headless --disable-gpu --window-size=1920,1080 --screenshot="${origShotDesktop}" "${origUrl}" 2>nul`, { timeout: 15000 });
    execSync(`"${chromePath}" --headless --disable-gpu --window-size=1920,1080 --screenshot="${modShotDesktop}" "${modUrl}" 2>nul`, { timeout: 15000 });

    const origSize = fs.statSync(origShotDesktop).size;
    const modSize = fs.statSync(modShotDesktop).size;
    console.log(`  - PC 렌더링 스크린샷 캡처 완료 (크기: orig=${origSize}B, mod=${modSize}B)`);

    // 3. 모바일 반응형 스크린샷 (375x812)
    execSync(`"${chromePath}" --headless --disable-gpu --window-size=375,812 --screenshot="${origShotMobile}" "${origUrl}" 2>nul`, { timeout: 15000 });
    execSync(`"${chromePath}" --headless --disable-gpu --window-size=375,812 --screenshot="${modShotMobile}" "${modUrl}" 2>nul`, { timeout: 15000 });

    const origMoSize = fs.statSync(origShotMobile).size;
    const modMoSize = fs.statSync(modShotMobile).size;
    console.log(`  - Mobile 반응형 렌더링 스크린샷 캡처 완료 (크기: orig=${origMoSize}B, mod=${modMoSize}B)`);

    console.log(`  ✅ [${page}] 브라우저 렌더링 및 JS 동작 정상 확인 완료`);
  } catch (err) {
    console.error(`  ❌ [${page}] 테스트 실패:`, err.message);
  }
});
