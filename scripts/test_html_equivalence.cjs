const fs = require('fs');
const path = require('path');

const pages = [
  'ai_fullstack',
  'scp',
  'fabrix',
  'brity_automation',
  'brity_works',
  'brity_works_gov',
  'public-sector',
  'base'
];

console.log('=== [TEST 1] HTML 구조 및 마크업 일치성 검사 ===\n');

let allPassed = true;

pages.forEach(page => {
  const origPath = path.join(__dirname, '..', 'app', 'html', 'offering', `${page}.html`);
  const modPath = path.join(__dirname, '..', 'app', 'html', 'offering', `${page}_m.html`);

  if (!fs.existsSync(origPath) || !fs.existsSync(modPath)) {
    console.error(`❌ 파일 누락: ${page}`);
    allPassed = false;
    return;
  }

  const origContent = fs.readFileSync(origPath, 'utf8');
  const modContent = fs.readFileSync(modPath, 'utf8');

  // Normalize comments and expected differences (css and js links)
  const clean = (text) => {
    return text
      .replace(/\r\n/g, '\n')
      // normalize css links and wrapping comments
      .replace(/<!--\s*!\s*필수:\s*오퍼링\s*css\s*-->[\s\S]*?<!--\s*\/\/\s*!\s*필수:\s*오퍼링\s*css\s*-->/g, 'CSS_PLACEHOLDER')
      .replace(/<link\s+rel="stylesheet"\s+type="text\/css"\s+href="\/static\/css\/offering(_module|02)?\.css"\s*\/?>/g, '')
      // normalize js links and wrapping comments
      .replace(/<script\s+src="\/static\/js\/offering(_module)?\.js"><\/script>/g, 'JS_PLACEHOLDER')
      // remove module banners like <!-- ========================================== -->
      .replace(/<!--\s*={5,}\s*-->/g, '')
      .replace(/<!--\s*\[(페이지|공통)\s*모듈:[^\]]+\]\s*-->/g, '')
      // normalize whitespace
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  };

  const cleanOrig = clean(origContent);
  const cleanMod = clean(modContent);

  if (cleanOrig === cleanMod) {
    console.log(`✅ [${page}] 마크업 100% 동일 (차이점: CSS/JS 파일 경로 및 모듈 구분 주석만 상이)`);
  } else {
    console.error(`❌ [${page}] 마크업 차이점 발견!`);
    allPassed = false;
    const origLines = cleanOrig.split('\n');
    const modLines = cleanMod.split('\n');
    for (let i = 0; i < Math.max(origLines.length, modLines.length); i++) {
      if (origLines[i] !== modLines[i]) {
        console.log(`  라인 ${i}:`);
        console.log(`    ORIG: ${origLines[i]}`);
        console.log(`    MOD : ${modLines[i]}`);
        break;
      }
    }
  }
});

console.log('\nHTML 검증 결과:', allPassed ? '전 페이지 100% 일치 통과' : '일부 차이점 있음');
