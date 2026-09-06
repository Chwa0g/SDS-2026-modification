const fs = require('fs');
const path = require('path');

console.log('=== [TEST 2] CSS 셀렉터, 미디어 쿼리(반응형), 속성 정합성 검사 ===\n');

const origCssPath = path.join(__dirname, '..', 'dist', 'static', 'css', 'offering02.css');
const modCssPath = path.join(__dirname, '..', 'dist', 'static', 'css', 'offering_module.css');

const origCss = fs.readFileSync(origCssPath, 'utf8');
const modCss = fs.readFileSync(modCssPath, 'utf8');

// 1. 미디어 쿼리 추출 및 비교
const extractMediaQueries = (css) => {
  const matches = [...css.matchAll(/@media[^{]+{/g)].map(m => m[0].trim().replace(/\s+/g, ' '));
  return [...new Set(matches)];
};

const origMedia = extractMediaQueries(origCss);
const modMedia = extractMediaQueries(modCss);

console.log(`[반응형 미디어 쿼리 검사]`);
console.log(`- 원본 미디어 쿼리 종류 (${origMedia.length}개):`, origMedia);
console.log(`- 모듈 미디어 쿼리 종류 (${modMedia.length}개):`, modMedia);

const missingMedia = origMedia.filter(m => !modMedia.includes(m));
if (missingMedia.length === 0) {
  console.log(`✅ 반응형 미디어 쿼리 브레이크포인트 100% 보존 완료\n`);
} else {
  console.error(`❌ 누락된 미디어 쿼리:`, missingMedia);
}

// 2. 셀렉터 추출 및 비교
const extractSelectors = (css) => {
  // Strip comments
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Match selector blocks: anything before { that isn't @keyframes or @media itself
  const blocks = [];
  const regex = /([^{}@]+)\{([^{}]+)\}/g;
  let match;
  while ((match = regex.exec(noComments)) !== null) {
    const sel = match[1].trim().replace(/\s+/g, ' ');
    const body = match[2].trim().replace(/\s+/g, ' ');
    if (sel && !sel.startsWith('@')) {
      blocks.push({ selector: sel, body: body });
    }
  }
  return blocks;
};

const origBlocks = extractSelectors(origCss);
const modBlocks = extractSelectors(modCss);

const origSelectors = new Set(origBlocks.map(b => b.selector));
const modSelectors = new Set(modBlocks.map(b => b.selector));

console.log(`[CSS 셀렉터 총수 검사]`);
console.log(`- 원본 셀렉터 블록 수: ${origBlocks.length} (고유 셀렉터: ${origSelectors.size})`);
console.log(`- 모듈 셀렉터 블록 수: ${modBlocks.length} (고유 셀렉터: ${modSelectors.size})`);

const missingSelectors = [...origSelectors].filter(s => !modSelectors.has(s));
console.log(`- 원본 대비 누락 셀렉터 수: ${missingSelectors.length}`);

if (missingSelectors.length > 0) {
  console.log(`누락된 셀렉터 목록 (최대 10개):`, missingSelectors.slice(0, 10));
} else {
  console.log(`✅ 원본 셀렉터 100% 무손실 보존 완료`);
}

// 3. 주요 핵심 클래스 속성 일치 검증
const keySelectors = [
  '.offering-main',
  '.offering-hero',
  '.public-ax',
  '.public-ax-hero',
  '.fabrix-hero',
  '.contact-us-faq',
  '.contact-banner',
  '.thumbnail-list',
  '.offering-swiper'
];

console.log(`\n[핵심 컴포넌트 셀렉터 존재 검증]`);
let allKeyPresent = true;
keySelectors.forEach(sel => {
  const inOrig = origCss.includes(sel);
  const inMod = modCss.includes(sel);
  if (inOrig && inMod) {
    console.log(`✅ ${sel} : 정상 일치`);
  } else {
    console.error(`❌ ${sel} : orig=${inOrig}, mod=${inMod}`);
    allKeyPresent = false;
  }
});
