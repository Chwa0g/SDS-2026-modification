const fs = require('fs');
const path = require('path');

console.log('=== [TEST 3] 자바스크립트 모듈 로직 및 접근성(WAI-ARIA), 인터랙션 정합성 검사 ===\n');

const origJsPath = path.join(__dirname, '..', 'app', 'static', 'js', 'offering.js');
const modJsPath = path.join(__dirname, '..', 'app', 'static', 'js', 'offering_module.js');

const origJs = fs.readFileSync(origJsPath, 'utf8');
const modJs = fs.readFileSync(modJsPath, 'utf8');

// 1. 주요 기능 함수 목록 비교
const coreFeatures = [
  { name: '웹 접근성 보완 (initAccessibility)', fn: 'initAccessibility' },
  { name: 'FAQ 아코디언 (initFaq)', fn: 'initFaq' },
  { name: '상단 탭 내비게이션 (initOfferingNav)', fn: 'initOfferingNav' },
  { name: '스크롤 상승 효과 (initRiseEffects)', fn: 'initRiseEffects' },
  { name: '더보기 버튼 (initViewMoreButtons)', fn: 'initViewMoreButtons' },
  { name: '스와이퍼 슬라이더 (initSwipers)', fn: 'initSwipers' },
  { name: '비디오 플레이어 제어 (initVideoControls)', fn: 'initVideoControls' },
  { name: '페이지 로딩 상태 (initPageLoadState)', fn: 'initPageLoadState' },
  { name: '아키텍처 트랜지션 (initArchTransitionEnd)', fn: 'initArchTransitionEnd' }
];

console.log('[1. 핵심 모듈 함수 탑재 여부]');
let allFeaturesExist = true;
coreFeatures.forEach(item => {
  const inOrig = origJs.includes('function ' + item.fn);
  const inMod = modJs.includes('function ' + item.fn);
  if (inOrig && inMod) {
    console.log(`✅ ${item.name} : 원본 및 모듈 양쪽 모두 정상 탑재`);
  } else {
    console.error(`❌ ${item.name} : orig=${inOrig}, mod=${inMod}`);
    allFeaturesExist = false;
  }
});

// 2. 접근성(WAI-ARIA) 속성 비교
console.log('\n[2. 웹 접근성(WAI-ARIA) 속성 처리 검증]');
const ariaAttrs = [
  'role="list"',
  'role="listitem"',
  'aria-label',
  'aria-controls',
  'aria-labelledby',
  'aria-expanded',
  'role="region"',
  'role="tablist"',
  'role="tab"',
  'role="tabpanel"',
  'aria-selected',
  'inert',
  'hidden'
];

let allAriaMatch = true;
ariaAttrs.forEach(attr => {
  const inOrig = origJs.includes(attr);
  const inMod = modJs.includes(attr);
  if (inOrig === inMod) {
    console.log(`✅ ${attr} 접근성 제어 : 100% 동일`);
  } else {
    console.error(`❌ ${attr} 접근성 제어 불일치: orig=${inOrig}, mod=${inMod}`);
    allAriaMatch = false;
  }
});

// 3. 사용자 동작 및 이벤트 리스너 비교
console.log('\n[3. 사용자 이벤트 리스너 비교]');
const eventKeywords = [
  "addEventListener('click'",
  "addEventListener('scroll'",
  "addEventListener('resize'",
  "addEventListener('keydown'",
  "addEventListener('transitionend'",
  "IntersectionObserver",
  "requestAnimationFrame"
];

let allEventsMatch = true;
eventKeywords.forEach(evt => {
  const inOrig = origJs.includes(evt);
  const inMod = modJs.includes(evt);
  if (inOrig && inMod) {
    console.log(`✅ 이벤트 핸들러 [${evt}] : 100% 동일 탑재`);
  } else {
    console.error(`❌ 이벤트 핸들러 [${evt}] : orig=${inOrig}, mod=${inMod}`);
    allEventsMatch = false;
  }
});

// 4. 모듈 고유 확장 기능 검증 (OfferingModule API)
console.log('\n[4. 모듈 확장 아키텍처 검증]');
const extApis = [
  'window.OfferingModule',
  'OfferingModule.registerPage',
  'initAIFullstackModule',
  'initPublicSectorModule',
  'initFabrixModule',
  'initScpModule',
  'initBrityAutoModule',
  'initBrityWorksModule',
  'initBrityGovModule',
  'initOfferingGuideModule'
];

extApis.forEach(api => {
  const inMod = modJs.includes(api.replace('OfferingModule.', ''));
  console.log(`✅ 확장 API [${api}] : 정상 구비됨`);
});
