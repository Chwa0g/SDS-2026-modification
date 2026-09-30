// 페이지 타입 자동 인식 (index_guide.html -> guide / json 데이터 구분해서 가져옴)
const fileName = window.location.pathname.split('/').pop();
const PAGE_TYPE = fileName.includes('_') ? fileName.split('_').pop().split('.')[0] : 'module';
const baseUrl = '';

let currentUrl = '';
let pageData = [];

// 검색 관련 변수
let searchResults = [];
let currentSearchIndex = -1;
let lastKeyword = '';

// 코드보기 관련 변수
let currentSourceUrls = { html: '', css: '', js: '' };
let currentTab = 'html';

async function init() {
    const container = document.getElementById('page-list-container');

    try {
        const response = await fetch('index_data.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const allData = await response.json();
        pageData = allData[PAGE_TYPE] || [];

        const grouped = pageData.reduce((acc, item) => {
            if (!acc[item.group]) acc[item.group] = [];
            acc[item.group].push(item);
            return acc;
        }, {});

        for (const [groupName, items] of Object.entries(grouped)) {
            const groupWrap = document.createElement('div');
            groupWrap.className = 'group-container';

            groupWrap.innerHTML = `
                <div class="group-header">
                    <span>${groupName} (${items.length})</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="group-content">
                    ${items.map(item => `
                        <div class="page-item" 
                             data-url="${item.url}" 
                             data-cssurl="${item.cssUrl || ''}" 
                             data-jsurl="${item.jsUrl || ''}" 
                             data-cmscat="${item.cmsCategory || '-'}" 
                             data-cmscode="${item.cmsCode || '-'}"
                             data-cmstag="${item.cmstags || '-'}"
                             data-modulelib="${item.moduleLib || '-'}">
                            <span class="item-cat">${item.category || '-'}</span>
                            <div class="item-title">${item.title || ''}</div>
                            ${item.note ? `<div class="item-note"><i class="fal fa-info-circle"></i> ${item.note}</div>` : '<div class="item-note"></div>'}
                            <div class="item-info">
                                <span><i class="fal fa-user"></i> ${item.owner || ''}</span>
                                <span>${item.modifiedDate || ''}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(groupWrap);
        }

        // 그룹 클릭 이벤트 및 트랜지션 완료 이벤트
        document.querySelectorAll('.group-header').forEach(header => {
            header.addEventListener('click', function() {
                toggleAccordion(this);
            });
        });

        document.querySelectorAll('.group-content').forEach(content => {
            content.addEventListener('transitionend', function(e) {
                if (e.propertyName === 'max-height' && this.classList.contains('show')) {
                    this.style.maxHeight = 'none';
                }
            });
        });

        const previewFrame = document.getElementById('preview-frame');
        const cmscatVal = document.getElementById('cms-cat-val');
        const cmscodesVal = document.getElementById('cms-code-val');
        const cmstagVal = document.getElementById('cms-tag-val');
        const moduleLibVal = document.getElementById('module-library-val');
        const pageurlVal = document.getElementById('page-url-val');

        // 아이템 클릭 이벤트
        document.querySelectorAll('.page-item').forEach(item => {
            item.addEventListener('click', function() {
                document.querySelectorAll('.page-item').forEach(el => el.classList.remove('active'));
                this.classList.add('active');

                // 현재 URL 및 소스 경로 저장
                currentUrl = this.dataset.url;
                currentSourceUrls = {
                    html: this.dataset.url,
                    css: this.dataset.cssurl,
                    js: this.dataset.jsurl
                };

                updateTabButtons();

                if (previewFrame) previewFrame.src = currentUrl;
                if (cmscatVal) cmscatVal.textContent = this.dataset.cmscat;
                if (cmscodesVal) cmscodesVal.textContent = this.dataset.cmscode;
                if (cmstagVal) cmstagVal.textContent = this.dataset.cmstag;
                if (moduleLibVal) moduleLibVal.textContent = this.dataset.modulelib;
                if (pageurlVal) pageurlVal.textContent = currentUrl;

                // 코드 패널이 열려있다면 즉시 로드
                if (document.getElementById('code-panel').classList.contains('open')) {
                    loadSourceCode(currentSourceUrls[currentTab], currentTab);
                }

                if (document.body.classList.contains('full-view-active')) {
                    toggleFullView();
                }
            });
        });

        // 초기 실행: 첫 번째 그룹 및 첫 번째 항목 선택
        const firstHeader = document.querySelector('.group-header');
        if (firstHeader) {
            firstHeader.click();
            const firstItem = document.querySelector('.page-item');
            if (firstItem) firstItem.click();
        }

    } catch (error) {
        console.error('데이터 로딩 실패:', error);
    }
}

// 탭 버튼 표시 여부 제어
function updateTabButtons() {
    const btnCss = document.getElementById('tab-css');
    const btnJs = document.getElementById('tab-js');

    if (btnCss) btnCss.style.display = currentSourceUrls.css ? 'block' : 'none';
    if (btnJs) btnJs.style.display = currentSourceUrls.js ? 'block' : 'none';

    // 파일이 없는 탭을 보고 있었다면 HTML로 복귀
    if ((currentTab === 'css' && !currentSourceUrls.css) || (currentTab === 'js' && !currentSourceUrls.js)) {
        switchTab('html');
    }
}

// 탭 전환 실행
function switchTab(type) {
    currentTab = type;
    document.querySelectorAll('.code-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === type);
    });
    loadSourceCode(currentSourceUrls[type], type);
}

// 소스코드 로드 (하이라이트 포함)
async function loadSourceCode(url, type) {
    const display = document.getElementById('code-display');
    const pathLabel = document.getElementById('code-file-path');

    if (!url || url === '') {
        display.textContent = '해당 소스 파일이 없습니다.';
        pathLabel.textContent = 'No File';
        return;
    }

    display.textContent = 'Loading...';
    pathLabel.textContent = url.split('/').pop();

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const text = await response.text();

        let langClass = 'language-html';
        if (type === 'css') langClass = 'language-css';
        if (type === 'js') langClass = 'language-javascript';

        display.className = langClass;
        display.textContent = text;

        if (window.hljs) hljs.highlightElement(display);
    } catch (err) {
        display.textContent = 'Error: 파일을 불러올 수 없습니다. (경로 확인 필요)';
    }
}

// --- 이벤트 리스너 등록 ---

// 탭 버튼 클릭 이벤트
document.querySelectorAll('.code-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.type));
});

// 코드 뷰어 토글 버튼
document.getElementById('btn-view-code').addEventListener('click', function() {
    const panel = document.getElementById('code-panel');
    this.classList.toggle('active');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
        loadSourceCode(currentSourceUrls[currentTab], currentTab);
    }
});

// 복사 버튼
document.getElementById('btn-copy-source').addEventListener('click', function() {
    const codeText = document.getElementById('code-display').textContent;
    const btn = this;
    const btnText = btn.querySelector('span');
    const btnIcon = btn.querySelector('i');

    navigator.clipboard.writeText(codeText).then(() => {
        const originalText = btnText.textContent;
        btnText.textContent = 'Copied!';
        btnIcon.className = 'fal fa-check';
        btn.style.background = '#10B981';
        setTimeout(() => {
            btnText.textContent = originalText;
            btnIcon.className = 'fal fa-copy';
            btn.style.background = '';
        }, 1500);
    });
});

// 검색 및 기타 유틸리티 함수
const searchInput = document.getElementById('side-search');
const searchCount = document.getElementById('search-count');

searchInput.addEventListener('input', () => {
    performSearch();
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const keyword = searchInput.value.toLowerCase().trim();
        const isFullView = document.body.classList.contains('full-view-active');

        if (keyword !== lastKeyword || searchResults.length === 0) {
            performSearch();
        } else if (searchResults.length > 0) {
            const targetItem = searchResults[currentSearchIndex];

            if (isFullView) {
                currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
                updateSearchUI();
            } else {
                if (!targetItem.classList.contains('active')) {
                    targetItem.click();
                } else {
                    currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
                    updateSearchUI();
                }
            }
        }
    }
});

function performSearch() {
    const keyword = searchInput.value.toLowerCase().trim();
    const items = document.querySelectorAll('.page-item');

    items.forEach(item => item.classList.remove('search-focus'));
    searchResults = [];
    currentSearchIndex = -1;
    lastKeyword = keyword;

    if (!keyword) {
        searchCount.textContent = '0/0';
        return;
    }

    items.forEach(item => {
        const title = item.querySelector('.item-title').textContent.toLowerCase();
        const cmsCode = item.dataset.cmscode ? item.dataset.cmscode.toLowerCase() : '';
        if (title.includes(keyword) || cmsCode.includes(keyword)) {
            searchResults.push(item);
        }
    });

    if (searchResults.length > 0) {
        currentSearchIndex = 0;
        updateSearchUI();
    } else {
        searchCount.textContent = '0/0';
    }
}

function moveSearchIndex(step) {
    if (searchResults.length === 0) return;
    currentSearchIndex = (currentSearchIndex + step + searchResults.length) % searchResults.length;
    updateSearchUI();
}

function updateSearchUI() {
    if (searchResults.length === 0) return;

    document.querySelectorAll('.page-item').forEach(item => item.classList.remove('search-focus'));

    const target = searchResults[currentSearchIndex];
    target.classList.add('search-focus');
    searchCount.textContent = `${currentSearchIndex + 1}/${searchResults.length}`;

    const groupContent = target.closest('.group-content');
    if (groupContent && !groupContent.classList.contains('show')) {
        const groupHeader = groupContent.previousElementSibling;
        groupHeader.classList.add('active');
        groupContent.classList.add('show');
        groupContent.style.maxHeight = groupContent.scrollHeight + 'px';
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 그룹 열고닫기 (아코디언)
function toggleAccordion(header) {
    const content = header.nextElementSibling;
    if (!content) return;

    const isOpen = header.classList.contains('active') || content.classList.contains('show');

    if (isOpen) {
        header.classList.remove('active');
        // 'none' 상태였을 경우 현재 높이로 먼저 고정한 후 0으로 줄여야 트랜지션이 동작함
        content.style.maxHeight = content.scrollHeight + 'px';
        content.offsetHeight; // reflow 강제
        content.style.maxHeight = '0px';
        content.classList.remove('show');
    } else {
        header.classList.add('active');
        content.classList.add('show');
        content.style.maxHeight = content.scrollHeight + 'px';
    }
}

function selectItem(el) {
    document.querySelectorAll('.page-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    currentUrl = el.dataset.url;
    document.getElementById('preview-frame').src = currentUrl;
}

document.getElementById('search-prev').addEventListener('click', () => moveSearchIndex(-1));
document.getElementById('search-next').addEventListener('click', () => moveSearchIndex(1));

document.getElementById('open-new-tab').addEventListener('click', () => {
    if (currentUrl) window.open(currentUrl, '_blank');
    else alert('먼저 페이지를 선택해주세요.');
});

function setPreviewSize(size, btn) {
    const frame = document.getElementById('preview-frame');
    document.querySelectorAll('.preview-size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const styles = {
        desktop: { width: '100%', height: '100%', borderRadius: '0', border: 'none' },
        tablet: { width: '768px', height: '90%', borderRadius: '24px', border: '12px solid #1E1E2D' },
        mobile: { width: '375px', height: '80%', borderRadius: '30px', border: '12px solid #1E1E2D' }
    };
    Object.assign(frame.style, styles[size]);
}

document.querySelectorAll('.preview-size-btn').forEach(btn => {
    btn.addEventListener('click', () => setPreviewSize(btn.dataset.size, btn));
});

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('side-toggle');

function handleResponsiveSidebar() {
    if (window.innerWidth <= 1024) sidebar.classList.add('collapsed');
    else sidebar.classList.remove('collapsed');
}

// 전체보기 토글 기능
const btnFullView = document.getElementById('btn-full-view');

function toggleFullView() {
    const isActive = document.body.classList.toggle('full-view-active');
    btnFullView.classList.toggle('active', isActive);

    if (isActive) {
        btnFullView.innerHTML = '<i class="fal fa-compress-alt"></i> 리스트 보기';
        document.querySelectorAll('.group-content').forEach(content => {
            content.style.maxHeight = 'none';
            content.classList.add('show');
        });
    } else {
        btnFullView.innerHTML = '<i class="fal fa-th-large"></i> 전체보기 (Grid View)';

        document.querySelectorAll('.group-content').forEach(content => {
            content.style.maxHeight = '0px';
            content.classList.remove('show');
            if (content.previousElementSibling) {
                content.previousElementSibling.classList.remove('active');
            }
        });

        const activeItem = document.querySelector('.page-item.active');
        if (activeItem) {
            const parentContent = activeItem.closest('.group-content');
            if (parentContent) {
                const parentHeader = parentContent.previousElementSibling;
                if (parentHeader) parentHeader.classList.add('active');
                parentContent.classList.add('show');
                // 사이드바 너비가 줄어들 때 아이템이 세로로 재배치되므로 높이를 'none'으로 풀어 잘림 방지
                parentContent.style.maxHeight = 'none';

                // 사이드바 축소 트랜지션 완료 후 활성 아이템으로 스크롤 이동
                setTimeout(() => {
                    activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 350);
            }
        } else {
            const firstHeader = document.querySelector('.group-header');
            if (firstHeader) {
                firstHeader.classList.add('active');
                const firstContent = firstHeader.nextElementSibling;
                if (firstContent) {
                    firstContent.classList.add('show');
                    firstContent.style.maxHeight = 'none';
                }
            }
        }
    }
}

btnFullView.addEventListener('click', toggleFullView);

window.addEventListener('load', handleResponsiveSidebar);
window.addEventListener('resize', handleResponsiveSidebar);
toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

// 초기화 실행
init();
