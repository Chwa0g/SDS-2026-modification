/**
 * Accessibility I18n Manager
 * data-country 속성에 따라 슬라이더 제어 버튼(이전/다음/정지/재생), 불릿 및 슬라이드의 접근성 속성(aria-label 등)을 다국어로 통합 관리합니다.
 * 언어 팩(LANG_PACKS)과 국가 코드 매핑(COUNTRY_MAP)이 분리되어 있어 손쉬운 유지보수가 가능합니다.
 * 지원 국가 코드: kr(국문), en(영문), us(미주), la(라틴아메리카), vn(베트남), eu(유럽), in(인도)
 */
(function (global) {
    "use strict";

    // 1. 언어 팩 정의 (텍스트 수정 및 신규 언어 추가 시 여기에서 관리)
    const LANG_PACKS = {
        // 한국어
        kr: {
            slide: "슬라이드",
            prev: "이전 슬라이드",
            next: "다음 슬라이드",
            play: "슬라이드 재생",
            pause: "슬라이드 정지",
            bullet: "{index}번째 슬라이드로 이동",
            bulletGuide: " (방향키로 불릿 이동 가능)",
            paginationRole: "슬라이드 목록",
            newWindow: "새창열림",
        },
        // 영어 (글로벌 / 미주 / 유럽 / 인도 공통)
        en: {
            slide: "slide",
            prev: "Previous slide",
            next: "Next slide",
            play: "Play slide",
            pause: "Pause slide",
            bullet: "Go to slide {index}",
            bulletGuide: " (Use arrow keys to navigate)",
            paginationRole: "Slide list",
            newWindow: "Opens in a new window",
        },
        // 라틴아메리카 (포르투갈어 / 스페인어)
        la: {
            slide: "diapositiva",
            prev: "Slide anterior",
            next: "Próximo slide",
            play: "Reproduzir slide",
            pause: "Pausar slide",
            bullet: "Ir para o slide {index}",
            bulletGuide: " (Use as teclas de seta para navegar)",
            paginationRole: "Lista de slides",
            newWindow: "Abrir em uma nova janela",
        },
        // 베트남어
        vn: {
            slide: "trang chiếu",
            prev: "Trang chiếu trước",
            next: "Trang chiếu tiếp theo",
            play: "Phát trang chiếu",
            pause: "Tạm dừng trang chiếu",
            bullet: "Chuyển đến trang chiếu {index}",
            bulletGuide: " (Sử dụng các phím mũi tên để di chuyển)",
            paginationRole: "Danh sách trang chiếu",
            newWindow: "Mở trong cửa sổ mới",
        },
    };

    // 2. 국가 코드 -> 언어 팩 매핑 테이블 (신규 국가 코드 추가 시 언어 팩 지정)
    const COUNTRY_MAP = {
        kr: LANG_PACKS.kr,
        ko: LANG_PACKS.kr,

        en: LANG_PACKS.en,
        us: LANG_PACKS.en,
        eu: LANG_PACKS.en,
        in: LANG_PACKS.en,

        la: LANG_PACKS.la,
        vn: LANG_PACKS.vn,
    };

    /**
     * 현재 html 태그의 data-country 또는 URL 경로에서 국가 코드 추출
     */
    function getCountry() {
        const html = document.documentElement || document.querySelector("html");
        let country = html ? html.getAttribute("data-country") : "";

        if (!country) {
            country = window.location.pathname.split("/")[1]?.toLowerCase() || "";
        } else {
            country = country.toLowerCase();
        }

        return COUNTRY_MAP[country] ? country : "kr"; // 기본값 kr
    }

    /**
     * 국가 코드에 대응하는 언어 팩 딕셔너리 반환
     */
    function getDict() {
        const country = getCountry();
        return COUNTRY_MAP[country] || LANG_PACKS.kr;
    }

    /**
     * 특정 라벨 키에 해당하는 다국어 텍스트 조회
     */
    function getLabel(key, params = {}) {
        const dict = getDict();
        let template = dict[key] || LANG_PACKS.kr[key] || "";

        Object.keys(params).forEach((pKey) => {
            template = template.replace(new RegExp(`\\{${pKey}\\}`, "g"), params[pKey]);
        });

        return template;
    }

    /**
     * 지정된 요소 또는 문서 전체 슬라이드 제어버튼/불릿/슬라이드 접근성 속성 전면 업데이트
     */
    function applyToContainer(container = document) {
        const root = typeof container === "string" ? document.querySelector(container) : container;
        if (!root) return;

        // 1. 슬라이드 본체 (.swiper-slide)
        const slides = root.querySelectorAll(".swiper-slide");
        slides.forEach((slide) => {
            if (!slide.getAttribute("role")) {
                slide.setAttribute("role", "group");
            }
            slide.setAttribute("aria-roledescription", getLabel("slide"));
        });

        // 2. Pagination 컨테이너 (.swiper-pagination)
        const paginations = root.querySelectorAll(".swiper-pagination");
        paginations.forEach((pag) => {
            if (!pag.getAttribute("aria-label")) {
                pag.setAttribute("aria-label", getLabel("paginationRole"));
            }
        });

        // 3. 이전 버튼 (.swiper-control__button--prev, .offering-swiper-button-prev)
        const prevBtns = root.querySelectorAll(
            ".swiper-control__button--prev, .offering-swiper-button-prev, [data-controls='prev']"
        );
        prevBtns.forEach((btn) => {
            btn.setAttribute("aria-label", getLabel("prev"));
            const isDisabled = btn.classList.contains("swiper-button-disabled") || btn.hasAttribute("disabled");
            btn.setAttribute("aria-disabled", isDisabled ? "true" : "false");
        });

        // 4. 다음 버튼 (.swiper-control__button--next, .offering-swiper-button-next)
        const nextBtns = root.querySelectorAll(
            ".swiper-control__button--next, .offering-swiper-button-next, [data-controls='next']"
        );
        nextBtns.forEach((btn) => {
            btn.setAttribute("aria-label", getLabel("next"));
            const isDisabled = btn.classList.contains("swiper-button-disabled") || btn.hasAttribute("disabled");
            btn.setAttribute("aria-disabled", isDisabled ? "true" : "false");
        });

        // 5. 재생 / 정지 버튼
        const playBtns = root.querySelectorAll(
            ".swiper-control__button--play, .swiper-control__button--pause, [data-controls='play'], [data-controls='pause']"
        );
        playBtns.forEach((btn) => {
            const isPlaying = btn.classList.contains("is-playing") || btn.classList.contains("swiper-control__button--play");
            const labelKey = isPlaying ? "pause" : "play";
            btn.setAttribute("aria-label", getLabel(labelKey));
        });

        // 6. Pagination 불릿 및 리모트 버튼 (title 속성 전면 제거 및 aria-label 100% 부여)
        const updateBullet = (bullet, index) => {
            const isActive = bullet.classList.contains("swiper-pagination-bullet-active") || bullet.classList.contains("is-active");
            const label = getLabel("bullet", { index: index + 1 }) + getLabel("bulletGuide");

            if (bullet.tagName.toLowerCase() === "span" && !bullet.getAttribute("role")) {
                bullet.setAttribute("role", "button");
            }

            bullet.setAttribute("aria-label", label);
            bullet.setAttribute("aria-selected", isActive ? "true" : "false");
            bullet.setAttribute("aria-current", isActive ? "true" : "false");
        };

        const pagContainers = root.querySelectorAll(".swiper-pagination, [data-swiper-remote]");
        if (pagContainers.length > 0) {
            pagContainers.forEach((pag) => {
                const containerBullets = pag.querySelectorAll(".swiper-pagination-bullet, .media-swiper-remote__button");
                containerBullets.forEach((bullet, idx) => updateBullet(bullet, idx));
            });
        } else {
            const allBullets = root.querySelectorAll(".swiper-pagination-bullet, .media-swiper-remote__button");
            allBullets.forEach((bullet, idx) => updateBullet(bullet, idx));
        }

        // 7. target="_blank" 앵커 태그 title 다국어 자동 부여 (기존 title 존재 시 해당 언어로 교체, 미존재 시 생성)
        const newWinLinks = root.querySelectorAll('a[target="_blank"]');
        const newWinText = getLabel("newWindow");
        if (newWinText) {
            newWinLinks.forEach((link) => {
                link.setAttribute("title", newWinText);
            });
        }
    }

    let isObserving = false;
    function startObserver() {
        if (isObserving || typeof MutationObserver === "undefined" || !document.body) return;

        let timer = null;
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            for (let i = 0; i < mutations.length; i++) {
                const m = mutations[i];
                if (m.type === "childList" || (m.type === "attributes" && (m.attributeName === "class" || m.attributeName === "data-country"))) {
                    shouldUpdate = true;
                    break;
                }
            }

            if (shouldUpdate) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    applyToContainer(document);
                }, 20);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "data-country"],
        });

        isObserving = true;
    }

    const AccessibilityI18n = {
        LANG_PACKS,
        COUNTRY_MAP,
        getCountry,
        getDict,
        getLabel,
        applyToContainer,
        init() {
            const run = () => {
                applyToContainer(document);
                startObserver();
            };

            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", run);
            } else {
                run();
            }
        },
    };

    global.AccessibilityI18n = AccessibilityI18n;
    AccessibilityI18n.init();
})(typeof window !== "undefined" ? window : this);
