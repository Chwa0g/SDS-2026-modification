function bindActiveSlideFocus(swiper, selector) {
    if (!swiper) return null;

    const $swiper = $(selector);
    const FOCUSABLE_SELECTOR = ["a[href]", "button:not([disabled])", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])", "[tabindex]", ".main-promotion__item-list"].join(
        ", ",
    );

    const MANAGED_ATTR = "data-swiper-focus-managed";
    const TABINDEX_ATTR = "data-swiper-original-tabindex";
    const NO_TABINDEX = "__none__";

    function saveOriginalTabindex($focusable) {
        if ($focusable.attr(MANAGED_ATTR) === "true") return;

        const tabindex = $focusable.attr("tabindex");

        $focusable.attr({
            [MANAGED_ATTR]: "true",
            [TABINDEX_ATTR]: tabindex == null ? NO_TABINDEX : tabindex,
        });
    }

    function restoreOriginalTabindex($focusable) {
        const originalTabindex = $focusable.attr(TABINDEX_ATTR);

        if (originalTabindex === NO_TABINDEX || originalTabindex == null) {
            $focusable.removeAttr("tabindex");
        } else {
            $focusable.attr("tabindex", originalTabindex);
        }
    }

    function update() {
        const $slides = $swiper.find(".swiper-slide");

        $slides.each(function () {
            const $slide = $(this);
            const isActive = $slide.hasClass("swiper-slide-active");
            const $focusables = $slide.find(FOCUSABLE_SELECTOR);

            if (isActive) {
                $slide.removeAttr("aria-hidden");

                $focusables.each(function () {
                    const $focusable = $(this);

                    saveOriginalTabindex($focusable);
                    restoreOriginalTabindex($focusable);
                });

                return;
            }

            $slide.attr("aria-hidden", "true");

            $focusables.each(function () {
                const $focusable = $(this);

                saveOriginalTabindex($focusable);
                $focusable.attr("tabindex", "-1");
            });
        });
    }

    function destroy() {
        swiper.off("slideChange transitionEnd loopFix update resize breakpoint", update);

        $swiper.find(`[${MANAGED_ATTR}="true"]`).each(function () {
            const $focusable = $(this);

            restoreOriginalTabindex($focusable);
            $focusable.removeAttr(MANAGED_ATTR).removeAttr(TABINDEX_ATTR);
        });

        $swiper.find(".swiper-slide").removeAttr("aria-hidden");
    }

    update();
    swiper.on("slideChange transitionEnd loopFix update resize breakpoint", update);

    return { update, destroy };
}

// 260819 : 포커스 이슈
function createMainSwiper(key, selector, isLoop, duration = 3000, autoplayState = "playing") {
    const swiperEl = document.querySelector(selector);

    if (!swiperEl) return null;

    const slideCount = swiperEl.querySelectorAll(".swiper-wrapper > .swiper-slide:not(.swiper-slide-duplicate)").length;

    // slidesPerView가 1이므로 2개 이상일 때만 슬라이드 가능
    const canSlide = slideCount > 1;
    const useLoop = isLoop && canSlide;

    const options = {
        slidesPerView: 1,
        watchOverflow: true,
        loop: useLoop,

        autoplay: useLoop
            ? {
                  delay: duration,
                  disableOnInteraction: false,
              }
            : false,

        pagination: {
            el: `${selector} .swiper-pagination`,
            type: "bullets",
            clickable: canSlide,

            ...(isLoop && {
                renderBullet(index, className) {
                    return `
                        <button
                            type="button"
                            class="${className}"
                            aria-label="${index + 1}번째 슬라이드로 이동"
                        >
                            <span class="swiper-pagination-bullet__number">
                                ${String(index + 1).padStart(2, "0")}
                            </span>

                            <span class="swiper-pagination-bullet__bar"></span>
                        </button>
                    `;
                },
            }),
        },

        navigation: {
            prevEl: `${selector} .swiper-control__button--prev`,
            nextEl: `${selector} .swiper-control__button--next`,
        },
    };

    const mainKVSwiper = createResponsiveSwiper(
        [
            {
                key,
                selector,
                always: true,
                options,
            },
        ],
        {
            breakpoint: null,
            namespace: `.${key}`,
        },
    );

    mainKVSwiper.init();

    const swiper = mainKVSwiper.swipers?.[key] || swiperEl.swiper;

    // Swiper lock 상태
    function updateLockState() {
        const isLocked = !canSlide || swiper?.isLocked;

        $(selector).toggleClass("is-swiper-lock", Boolean(isLocked));
    }

    // prev / next 비활성화 상태일 경우 Tab 접근 제외
    function updateNavigationFocus() {
        $(selector)
            .find(".swiper-control__button--prev, .swiper-control__button--next")
            .each(function () {
                const $button = $(this);

                const isDisabled = $button.hasClass("swiper-button-disabled") || $button.attr("aria-disabled") === "true";

                if (isDisabled) {
                    $button.attr("tabindex", "-1");
                } else {
                    $button.removeAttr("tabindex");
                }
            });
    }

    // 최초 상태 반영
    updateLockState();
    updateNavigationFocus();

    // 현재 active 슬라이드만 Tab 이동 허용
    bindActiveSlideFocus(swiper, selector);

    if (swiper) {
        swiper.on("slideChange transitionEnd lock unlock loopFix update resize breakpoint", function () {
            updateLockState();
            updateNavigationFocus();
        });
    }

    if (autoplayState === "paused" && swiper?.autoplay) {
        swiper.autoplay.stop();

        const $playButton = $(selector).find(".swiper-control__button--play");

        if ($playButton.length) {
            $playButton.addClass("is-paused").attr("aria-label", "슬라이드 재생");
        }
    }

    return mainKVSwiper;
}

// 스와이퍼 테마
function bindSwiperControlTheme(swiper, selector) {
    if (!swiper) return null;

    const $swiper = $(selector);
    const $swiperControl = $swiper.find(".swiper-control");

    if (!$swiper.length || !$swiperControl.length) return null;

    function updateControlTheme() {
        const $activeSlide = $(swiper.slides[swiper.activeIndex]);
        const isWhiteTheme = $activeSlide.data("control-theme") === "white";

        $swiperControl.toggleClass("swiper-control--white", isWhiteTheme);
    }

    updateControlTheme();

    swiper.on("slideChange loopFix", updateControlTheme);

    return updateControlTheme;
}
// e:260730

$(function () {
    //260806: background motion
    (function () {
        const canvas = document.getElementById("mainBackground");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        const img = document.getElementById("silk");
        if (!gl) {
            document.getElementById("fallback").style.display = "flex";
            return;
        }

        const VERT = `
            attribute vec2 aPos;
            void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
        `;

        const FRAG = `
            precision highp float;
            uniform sampler2D uTex;
            uniform vec2  uRes;     // device px
            uniform float uCssH;    // css px height (진폭 기준)
            uniform vec2  uImg;     // 이미지 픽셀 크기
            uniform float uTime;
            uniform float uW;       // 각속도 2π/period
            uniform float uAmpPx;   // 수직 진폭(css px)
            uniform float uRotRad;  // 최대 회전(rad)
            uniform float uLag;     // 위상차 (초)
            uniform float uLine;    // 라인 강조 강도
            uniform float uHueAmp;  // hue 이동 대역 진폭(cycles)
            uniform float uHueCyc;  // hue 전체 순환 속도(cycles/sec)
            uniform float uSatB;    // 채도 브리딩

            // cover-fit: 화면을 꽉 채우도록 이미지 UV 매핑
            vec2 coverUV(vec2 uv) {
            float ca = uRes.x / uRes.y;
            float ia = uImg.x / uImg.y;
            vec2 st = uv;
            if (ca > ia) { st.y = (uv.y - 0.5) * (ia / ca) + 0.5; }
            else         { st.x = (uv.x - 0.5) * (ca / ia) + 0.5; }
            return st;
            }

            // 완만한 파동 + 미세 회전 warp
            vec2 warp(vec2 st, float t) {
            float ang = uRotRad * sin(uW * t);
            vec2 c = st - 0.5;
            float s = sin(ang), co = cos(ang);
            c = mat2(co, -s, s, co) * c;
            vec2 p = c + 0.5;
            float ay = uAmpPx / uCssH;   // css px → uv
            // 넓은 1차 파동(주도) + 옅은 2차 하모닉(유기적)
            p.y += ay * ( 0.78 * sin(st.x * 6.2831 * 1.05 + uW * t)
                        + 0.22 * sin(st.x * 6.2831 * 2.10 - uW * t * 0.9 + 1.3) );
            p.x += ay * 0.30 * sin(st.y * 6.2831 * 0.80 + uW * t + 0.6);
            return p;
            }

            vec3 rgb2hsv(vec3 c){
            vec4 K = vec4(0.0, -0.3333333, 0.6666667, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
            float d = q.x - min(q.w, q.y); float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0*d + e)), d/(q.x + e), q.x);
            }
            vec3 hsv2rgb(vec3 c){
            vec3 p = abs(fract(c.xxx + vec3(1.0, 0.6666667, 0.3333333)) * 6.0 - 3.0);
            return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
            }
            vec3 tex(vec2 st) { return texture2D(uTex, clamp(st, 0.001, 0.999)).rgb; }

            void main() {
            vec2 uv = gl_FragCoord.xy / uRes.xy;
            vec2 st = coverUV(uv);

            float t = uTime;
            vec2 p1 = warp(st, t);
            vec3 col = tex(p1);

            // --- 그라데이션 컬러가 결을 따라 자연스럽게 흐르며 변형 ---
            float dcoord = st.x * 0.72 + st.y * 0.28;                 // 실크 진행 방향
            float hue = uHueCyc * t                                   // 완만한 전체 순환
                        + uHueAmp * sin(dcoord * 6.2831 * 1.4 - uW * t * 0.8); // 색 대역 이동
            vec3 hsv = rgb2hsv(col);
            hsv.x = fract(hsv.x + hue);
            hsv.y = clamp(hsv.y * (1.0 + uSatB * sin(uW * t * 0.7 + dcoord * 3.0)), 0.0, 1.0);
            col = hsv2rgb(hsv);

            // 라인 레이어: 12–18% 늦은 위상으로 얇은 필라멘트만 추출
            vec2 p2 = warp(st, t - uLag);
            vec2 e = 1.6 / uRes;
            vec3 c0 = tex(p2);
            vec3 lp = (tex(p2 + vec2(e.x,0.0)) + tex(p2 - vec2(e.x,0.0))
                    + tex(p2 + vec2(0.0,e.y)) + tex(p2 - vec2(0.0,e.y))) * 0.25;
            vec3 hp = max(c0 - lp, 0.0) * 6.0;           // 밝은 라인 강조
            col = 1.0 - (1.0 - col) * (1.0 - hp * uLine); // screen blend

            gl_FragColor = vec4(col, 1.0);
            }
        `;

        function compile(type, src) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(s));
                return null;
            }
            return s;
        }
        const prog = gl.createProgram();
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(prog));
            document.getElementById("fallback").style.display = "flex";
            return;
        }
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const aPos = gl.getAttribLocation(prog, "aPos");
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        const U = {
            tex: gl.getUniformLocation(prog, "uTex"),
            res: gl.getUniformLocation(prog, "uRes"),
            cssH: gl.getUniformLocation(prog, "uCssH"),
            img: gl.getUniformLocation(prog, "uImg"),
            time: gl.getUniformLocation(prog, "uTime"),
            w: gl.getUniformLocation(prog, "uW"),
            amp: gl.getUniformLocation(prog, "uAmpPx"),
            rot: gl.getUniformLocation(prog, "uRotRad"),
            lag: gl.getUniformLocation(prog, "uLag"),
            line: gl.getUniformLocation(prog, "uLine"),
            hueAmp: gl.getUniformLocation(prog, "uHueAmp"),
            hueCyc: gl.getUniformLocation(prog, "uHueCyc"),
            satB: gl.getUniformLocation(prog, "uSatB"),
        };

        const DEG = Math.PI / 180;
        // 운영 기본값: 테스트 input 없이 이 값으로 자동 재생
        const state = {
            period: 6.4,
            amp: 10,
            rot: 0.4,
            lag: 15,
            line: 0.35,
            hueAmp: 18,
            hueCyc: 6,
            satB: 0.1,
        };

        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        let playing = !motionQuery.matches;
        let tPrev = 0;
        let tAcc = 0;
        let texReady = false;

        // ---- texture ----
        const tex = gl.createTexture();
        function uploadTexture() {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.uniform1i(U.tex, 0);
            texReady = true;
        }

        function resize() {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);

            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        const resizeEvent = Device.isMobile() ? "orientationchange" : "resize";

        window.addEventListener(resizeEvent, function () {
            setTimeout(resize, 100);
        });

        resize();

        function setUniforms() {
            gl.uniform2f(U.res, canvas.width, canvas.height);
            gl.uniform1f(U.cssH, innerHeight);
            gl.uniform2f(U.img, img.naturalWidth || 1600, img.naturalHeight || 985);
            gl.uniform1f(U.w, (2 * Math.PI) / state.period);
            gl.uniform1f(U.amp, state.amp);
            gl.uniform1f(U.rot, state.rot * DEG);
            gl.uniform1f(U.lag, (state.lag / 100) * state.period);
            gl.uniform1f(U.line, state.line);
            gl.uniform1f(U.hueAmp, state.hueAmp / 360.0); // deg -> cycles
            gl.uniform1f(U.hueCyc, state.hueCyc / 360.0); // deg/s -> cycles/s
            gl.uniform1f(U.satB, state.satB);
        }

        function draw() {
            setUniforms();
            gl.uniform1f(U.time, tAcc);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        // OS 설정이 실행 중 변경되면 즉시 반영
        motionQuery.addEventListener("change", (event) => {
            const shouldPlay = !event.matches;
            if (playing === shouldPlay) return;

            playing = shouldPlay;

            if (playing) {
                tPrev = performance.now();
                requestAnimationFrame(loop);
            } else if (texReady) {
                draw();
            }
        });

        function loop(now) {
            if (!playing) return;
            const dt = Math.min((now - tPrev) / 1000, 0.05);
            tPrev = now;
            tAcc += dt;
            if (texReady) draw();
            requestAnimationFrame(loop);
        }

        function start() {
            uploadTexture();
            tPrev = performance.now();
            if (playing) requestAnimationFrame(loop);
            else draw();
        }
        if (img.complete && img.naturalWidth) {
            start();
        } else {
            img.addEventListener("load", start, { once: true });
            img.addEventListener(
                "error",
                () => {
                    document.getElementById("fallback").style.display = "flex";
                },
                { once: true },
            );
        }
    })();

    // 260730 : kv 아이템 오버 추가
    if (!Device.isMobile()) {
        $(".main-kv [data-gif]").each(function () {
            const $item = $(this);
            const $bg = $item.find(".main-kv__swiper-bg").first();
            const gifSrc = $item.attr("data-gif");

            if (!gifSrc || !$bg.length) return;

            // GIF 파일 미리 캐시
            const preloadImage = new Image();
            preloadImage.src = gifSrc;

            $item
                .on("mouseenter", function () {
                    if ($bg.find(".image-hover").length) return;

                    const $gif = $("<img>", {
                        src: gifSrc,
                        alt: "",
                        class: "image-hover",
                        "aria-hidden": "true",
                    });

                    $bg.append($gif);
                })
                .on("mouseleave", function () {
                    $bg.find(".image-hover").remove();
                });
        });
    }

    countUp.init($(document), {
        duration: 2000,
        stagger: 70, //ms
        threshold: 0.4, //IntersectionObserver 옵션
        repeat: true,
        loopCount: 2, //턴 수
    });

    // KV
    const mainKvSwiperHero = createMainSwiper("mainKvSwiperHero", ".main-kv__swiper--hero", true, 7000);

    const mainKvSwiper01 = createMainSwiper("mainKvSwiper01", ".main-kv__swiper--insight");
    const mainKvSwiper02 = createMainSwiper("mainKvSwiper02", ".main-kv__swiper--resource");
    const mainKvSwiper03 = createMainSwiper("mainKvSwiper03", ".main-kv__swiper--summit");
    const mainKvSwiper04 = createMainSwiper("mainKvSwiper04", ".main-kv__swiper--case", true, 5000, "paused");
    const mainKvSwiper05 = createMainSwiper("mainKvSwiper05", ".main-kv__swiper--news");
    // promotion
    const mainPromotionSwiper01 = createMainSwiper("mainPromotionSwiper01", ".main-promotion__swiper--event", true, 5000, "paused");
    const mainPromotionSwiper02 = createMainSwiper("mainPromotionSwiper02", ".main-promotion__swiper--award", true, 5000, "paused");

    // s:260728 - 일단 award만 테마추가
    const promotionEvSwiper = mainPromotionSwiper01?.swipers?.mainPromotionSwiper01;
    bindSwiperControlTheme(promotionEvSwiper, ".main-promotion__swiper--event");
    // e:260728

    // insight - mobile
    // s:260728
    const MainInsightSwiper = (function () {
        const SELECTOR = ".main-insight__swiper";

        let swiper = null;
        let activeSlideFocus = null;

        function init() {
            if (swiper) return;

            const $swiper = $(`${SELECTOR} .swiper`);

            if (!$swiper.length) return;

            swiper = new Swiper($swiper[0], {
                slidesPerView: 1,
                slidesPerGroup: 1,
                initialSlide: 0,
                loop: true,

                pagination: {
                    el: `${SELECTOR} .swiper-pagination`,
                    clickable: true,

                    renderBullet(index, className) {
                        return `
                        <button
                            type="button"
                            class="${className}"
                            aria-label="${index + 1}번째 슬라이드로 이동"
                        >
                            <span class="swiper-pagination-bullet__number">
                                ${String(index + 1).padStart(2, "0")}
                            </span>

                            <span class="swiper-pagination-bullet__bar"></span>
                        </button>
                    `;
                    },
                },

                navigation: {
                    prevEl: `${SELECTOR} .swiper-control__button--prev`,
                    nextEl: `${SELECTOR} .swiper-control__button--next`,
                },
            });

            activeSlideFocus = bindActiveSlideFocus(swiper, SELECTOR);
        }

        function destroy() {
            if (!swiper) return;

            activeSlideFocus?.destroy();
            activeSlideFocus = null;

            swiper.destroy(true, true);
            swiper = null;
        }

        return {
            init,
            destroy,
        };
    })();
    // e:260724

    // s:260724
    const MainInsight = (function () {
        const SWIPER_SELECTOR = ".main-insight__swiper";
        const LIST_SELECTOR = ".main-insight__list";
        const ITEM_SELECTOR = ".main-insight__item";
        const BUTTON_SELECTOR = ".main-insight__button";
        const DESCRIPTION_SELECTOR = ".main-insight__description--footer";
        const PAGINATION_SELECTOR = ".swiper-pagination";
        const BULLET_SELECTOR = ".swiper-pagination-bullet";
        const PREV_SELECTOR = ".swiper-control__button--prev";
        const NEXT_SELECTOR = ".swiper-control__button--next";

        const ACTIVE_CLASS = "is-active";
        const CLONE_CLASS = "is-clone";
        const PASSING_CLASS = "is-passing";
        const POS_PREFIX = "is-pos-";

        const WIDTH_RATIOS = [67, 16, 10, 4, 1, 1, 1];

        const SPEED = 600;
        const EASING = "ease";

        let $swiper = $();
        let $list = $();

        let isAnimating = false;
        let isKeyboardAction = false;

        let $focusTarget = $();

        let resizeTimer = null;

        function init() {
            $swiper = $(SWIPER_SELECTOR);
            $list = $(LIST_SELECTOR);

            if (!$list.length) return;

            if (!$swiper.length) {
                $swiper = $list.closest(SWIPER_SELECTOR);
            }

            if (!$swiper.length) {
                $swiper = $list;
            }

            setup();
            bind();
        }

        function setup() {
            removeClones();
            resetTransform(false);
            renderPagination();
            applyNormalState(false);
        }

        function restoreOriginalOrder() {
            const $realItems = getRealItems();

            $(
                $realItems.toArray().sort(function (a, b) {
                    return Number($(a).attr("data-index")) - Number($(b).attr("data-index"));
                }),
            ).appendTo($list);
        }

        function renderPagination() {
            const $pagination = $swiper.find(PAGINATION_SELECTOR).first();
            const itemLength = getRealItems().length;

            if (!$pagination.length) return;

            let html = "";

            for (let index = 0; index < itemLength; index++) {
                html += `
                <button
                    type="button"
                    class="swiper-pagination-bullet"
                    aria-label="${index + 1}번째 슬라이드로 이동"
                    data-index="${index + 1}"
                >
                    <span class="swiper-pagination-bullet__number">
                        ${String(index + 1).padStart(2, "0")}
                    </span>
                    <span class="swiper-pagination-bullet__bar"></span>
                </button>
            `;
            }

            $pagination.html(html);
        }

        function updatePaginationByItem($item) {
            if (!$item || !$item.length) return;

            const activeIndex = Number($item.attr("data-index"));
            const $bullets = $swiper.find(BULLET_SELECTOR);

            if (Number.isNaN(activeIndex) || !$bullets.length) return;

            $bullets.removeClass("swiper-pagination-bullet-active").removeAttr("aria-current");

            $bullets.filter(`[data-index="${activeIndex}"]`).addClass("swiper-pagination-bullet-active").attr("aria-current", "true");
        }

        function slideToOriginalIndex(targetIndex) {
            if (isAnimating) return;

            const $realItems = getRealItems();

            const $targetItem = $realItems.filter(function () {
                return Number($(this).attr("data-index")) === targetIndex;
            });

            if (!$targetItem.length) return;

            const step = $realItems.index($targetItem);

            if (step <= 0) return;

            slideTo(step);
        }

        function bindControl() {
            $swiper.off(".mainInsightControl");

            $swiper.on("click.mainInsightControl", BULLET_SELECTOR, function () {
                const targetIndex = Number($(this).attr("data-index"));

                if (Number.isNaN(targetIndex)) return;

                slideToOriginalIndex(targetIndex);
            });

            $swiper.on("click.mainInsightControl", NEXT_SELECTOR, function () {
                if (isAnimating || getRealItems().length <= 1) return;

                slideTo(1);
            });

            $swiper.on("click.mainInsightControl", PREV_SELECTOR, function () {
                const itemLength = getRealItems().length;

                if (isAnimating || itemLength <= 1) return;

                slideTo(itemLength - 1);
            });
        }

        function bindResize() {
            $(window).off(".mainInsightResize");

            if (Device.isMobile()) {
                $(window).on("orientationchange.mainInsightResize", function () {
                    clearTimeout(resizeTimer);

                    resizeTimer = setTimeout(function () {
                        if (isAnimating) return;

                        setup();
                    }, 300);
                });

                return;
            }

            $(window).on("resize.mainInsightResize", function () {
                clearTimeout(resizeTimer);

                resizeTimer = setTimeout(function () {
                    if (isAnimating) return;

                    setup();
                }, 150);
            });
        }

        function bind() {
            $list.off(".mainInsight");

            $list.on("keydown.mainInsight", BUTTON_SELECTOR, function (e) {
                if (e.key !== "Enter" && e.key !== " ") return;

                isKeyboardAction = true;
                $focusTarget = $(this);
            });

            $list.on("click.mainInsight", BUTTON_SELECTOR, function (e) {
                if (isAnimating) return;

                const $button = $(this);
                const $item = $button.closest(ITEM_SELECTOR);

                if ($item.hasClass(CLONE_CLASS)) return;

                const isMouseClick = e.originalEvent && typeof e.originalEvent.detail === "number" && e.originalEvent.detail > 0;

                if (isMouseClick) {
                    isKeyboardAction = false;
                    $focusTarget = $();
                }

                const $realItems = getRealItems();
                const clickedIndex = $realItems.index($item);

                if (clickedIndex < 0) {
                    clearKeyboardState();
                    return;
                }

                if (clickedIndex === 0) {
                    clearKeyboardState();
                    return;
                }

                slideTo(clickedIndex);
            });

            bindControl();
            bindResize();
        }

        function slideTo(step) {
            const $realItems = getRealItems();

            if (step <= 0) {
                clearKeyboardState();
                return;
            }

            if (step >= $realItems.length) {
                clearKeyboardState();
                return;
            }

            isAnimating = true;

            removeClones();

            const $movingItems = $realItems.slice(0, step);
            const $clones = $movingItems.clone(false);

            $clones.addClass(CLONE_CLASS).removeClass(ACTIVE_CLASS).attr("aria-hidden", "true");

            $clones.find("a, button, input, select, textarea, [tabindex]").attr("tabindex", "-1");

            $list.append($clones);

            resetTransform(false);
            applyNormalStateWithClones(step, false);

            forceReflow();

            requestAnimationFrame(function () {
                const shiftX = getPassWidth(step);

                applyTargetState(step, true);

                $list.css({
                    transition: `transform ${SPEED}ms ${EASING}`,
                    transform: `translateX(${-shiftX}px)`,
                });
            });

            clearTimeout($list.data("mainInsightTimer"));

            const timer = setTimeout(function () {
                finishSlide(step);
            }, SPEED + 40);

            $list.data("mainInsightTimer", timer);
        }

        function finishSlide(step) {
            const $realItems = getRealItems();
            const $movingItems = $realItems.slice(0, step);

            $list.append($movingItems);

            removeClones();

            resetTransform(false);
            applyNormalState(false);

            isAnimating = false;

            if (isKeyboardAction && $focusTarget.length && $.contains(document, $focusTarget[0])) {
                $focusTarget.trigger("focus");
            }

            clearKeyboardState();
        }

        function applyNormalState(animate) {
            const swiperWidth = getSwiperWidth();
            const $realItems = getRealItems();

            setItemTransition(animate);
            clearItemState($realItems);

            $realItems.each(function (index) {
                const $item = $(this);
                const ratio = getNormalRatio(index);

                applyWidth($item, ratio, swiperWidth);
                $item.addClass(`${POS_PREFIX}${index}`);
            });

            $realItems.eq(0).addClass(ACTIVE_CLASS);

            updateDescriptionByItem($realItems.eq(0));
            updatePaginationByItem($realItems.eq(0));
        }

        function applyNormalStateWithClones(step, animate) {
            const swiperWidth = getSwiperWidth();
            const $realItems = getRealItems();
            const $clones = getCloneItems();

            setItemTransition(animate);
            clearItemState($realItems);
            clearItemState($clones);

            $realItems.each(function (index) {
                const $item = $(this);
                const ratio = getNormalRatio(index);

                applyWidth($item, ratio, swiperWidth);
                $item.addClass(`${POS_PREFIX}${index}`);
            });

            $clones.each(function (index) {
                const $clone = $(this);
                const pos = WIDTH_RATIOS.length - step + index;
                const ratio = getNormalRatio(pos);

                applyWidth($clone, ratio, swiperWidth);
                $clone.addClass(`${POS_PREFIX}${pos}`);
            });

            $realItems.eq(0).addClass(ACTIVE_CLASS);
        }

        function applyTargetState(step, animate) {
            const swiperWidth = getSwiperWidth();
            const $realItems = getRealItems();
            const $clones = getCloneItems();

            setItemTransition(animate);
            clearItemState($realItems);
            clearItemState($clones);

            $realItems.each(function (index) {
                const $item = $(this);

                if (index < step) {
                    const pos = WIDTH_RATIOS.length - step + index;
                    const ratio = getNormalRatio(pos);

                    applyWidth($item, ratio, swiperWidth);

                    $item.addClass(PASSING_CLASS).addClass(`${POS_PREFIX}${pos}`);

                    return;
                }

                const pos = index - step;
                const ratio = getNormalRatio(pos);

                applyWidth($item, ratio, swiperWidth);
                $item.addClass(`${POS_PREFIX}${pos}`);
            });

            $clones.each(function (index) {
                const $clone = $(this);
                const pos = WIDTH_RATIOS.length - step + index;
                const ratio = getNormalRatio(pos);

                applyWidth($clone, ratio, swiperWidth);
                $clone.addClass(`${POS_PREFIX}${pos}`);
            });

            $realItems.eq(step).addClass(ACTIVE_CLASS);

            updateDescriptionByItem($realItems.eq(step));
            updatePaginationByItem($realItems.eq(step));
        }

        function updateDescriptionByItem($item) {
            if (!$item || !$item.length) return;

            const descriptionIndex = Number($item.attr("data-index")) - 1;

            if (Number.isNaN(descriptionIndex)) return;

            $(DESCRIPTION_SELECTOR).removeClass(ACTIVE_CLASS).eq(descriptionIndex).addClass(ACTIVE_CLASS);
        }

        function getPassWidth(step) {
            const swiperWidth = getSwiperWidth();

            let moveRatio = 0;

            for (let i = 0; i < step; i++) {
                const pos = WIDTH_RATIOS.length - step + i;

                moveRatio += getNormalRatio(pos);
            }

            return getWidthByRatio(swiperWidth, moveRatio);
        }

        function applyWidth($item, ratio, swiperWidth) {
            const width = getWidthByRatio(swiperWidth, ratio);

            $item.css({
                width: `${width}px`,
            });
        }

        function getNormalRatio(index) {
            return WIDTH_RATIOS[index] || WIDTH_RATIOS[WIDTH_RATIOS.length - 1];
        }

        function getWidthByRatio(swiperWidth, ratio) {
            return swiperWidth * (ratio / 100);
        }

        function getSwiperWidth() {
            return $swiper.width();
        }

        function setItemTransition(animate) {
            const $items = getAllItems();

            if (!$items.length) return;

            const transition = animate ? `width ${SPEED}ms ${EASING}` : "none";

            $items.css("transition", transition);

            if (!animate) {
                forceReflow();
                $items.css("transition", "");
            }
        }

        function clearItemState($items) {
            $items.each(function () {
                const $item = $(this);

                $item.removeClass(ACTIVE_CLASS).removeClass(PASSING_CLASS);

                for (let i = 0; i < WIDTH_RATIOS.length; i++) {
                    $item.removeClass(`${POS_PREFIX}${i}`);
                }
            });
        }

        function resetTransform(animate) {
            $list.css({
                transition: animate ? `transform ${SPEED}ms ${EASING}` : "none",
                transform: "translateX(0)",
            });

            if (!animate) {
                forceReflow();

                $list.css({
                    transition: "",
                });
            }
        }

        function clearKeyboardState() {
            isKeyboardAction = false;
            $focusTarget = $();
        }

        function removeClones() {
            $list.children(`.${CLONE_CLASS}`).remove();
        }

        function getRealItems() {
            return $list.children(`${ITEM_SELECTOR}:not(.${CLONE_CLASS})`);
        }

        function getCloneItems() {
            return $list.children(`${ITEM_SELECTOR}.${CLONE_CLASS}`);
        }

        function getAllItems() {
            return $list.children(ITEM_SELECTOR);
        }

        function forceReflow() {
            if (!$list.length) return;

            $list[0].offsetHeight;
        }

        function reset() {
            clearTimeout($list.data("mainInsightTimer"));
            clearTimeout(resizeTimer);

            isAnimating = false;

            clearKeyboardState();

            $(window).off(".mainInsightResize");
            $swiper.off(".mainInsightControl");

            if ($list.length) {
                $list.off(".mainInsight");

                removeClones();
                restoreOriginalOrder();

                resetTransform(false);
                applyNormalState(false);
            }
        }

        return {
            init,
            reset,
        };
    })();
    // e:260724

    // service 스와이퍼
    // 260730
    const mainServiceSelector = ".main-service__swiper";
    const mainServiceSlideCount = $(".main-service__item").length;

    let mainServiceSwiper = null;
    let mainServiceMode = null;

    function getMainServiceMode() {
        const width = window.innerWidth;

        if (width <= 767) {
            return "mo";
        }

        if (width <= 1300) {
            return "tablet";
        }

        return "pc";
    }

    function getMainServiceOptions(mode) {
        if (mode === "mo") {
            return {
                slidesPerView: 1.6,
                spaceBetween: 15,
            };
        }

        if (mode === "tablet") {
            return {
                slidesPerView: 2.7,
                spaceBetween: 15,
            };
        }

        return {
            slidesPerView: 3.8,
            spaceBetween: 24,
        };
    }

    function updateMainServiceVisibleSlides(swiper) {
        if (!swiper || swiper.destroyed) return;

        const $slides = $(swiper.slides);
        const activeIndex = swiper.activeIndex;
        const visibleCount = Math.ceil(Number(swiper.params.slidesPerView) || 1);

        $slides.removeClass("is-visible");

        for (let i = 0; i < visibleCount; i++) {
            $slides.eq(activeIndex + i).addClass("is-visible");
        }
    }

    function initMainServiceSwiper() {
        const nextMode = getMainServiceMode();

        // 같은 구간일 때도 모바일 가로/세로 전환 시 높이/너비 재계산
        if (mainServiceMode === nextMode) {
            if (mainServiceSwiper && !mainServiceSwiper.destroyed) {
                mainServiceSwiper.update();
            }
            return;
        }

        mainServiceMode = nextMode;

        createMainServiceSwiper(nextMode);
    }

    function createMainServiceSwiper(mode) {
        const options = getMainServiceOptions(mode);

        const slidesPerView = options.slidesPerView;
        const canLoop = mainServiceSlideCount > slidesPerView;

        if (mainServiceSwiper && !mainServiceSwiper.destroyed) {
            mainServiceSwiper.destroy(true, true);
            mainServiceSwiper = null;
        }

        $(mainServiceSelector).toggleClass("is-swiper-lock", !canLoop).find(".swiper-slide").removeClass("is-visible");

        mainServiceSwiper = new Swiper(mainServiceSelector, {
            slidesPerView,
            slidesPerGroup: 1,
            spaceBetween: options.spaceBetween,
            observer: true,
            observeParents: true,

            longSwipes: false,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            loop: canLoop,
            loopedSlides: canLoop ? 6 : undefined,
            loopAdditionalSlides: canLoop ? 6 : 0,

            watchSlidesProgress: true,
            watchOverflow: true,

            pagination: {
                el: `${mainServiceSelector} .swiper-pagination`,
                clickable: true,

                renderBullet(index, className) {
                    return `
                    <button
                        type="button"
                        class="${className}"
                        aria-label="${index + 1}번째 슬라이드로 이동"
                    >
                        <span class="swiper-pagination-bullet__number">
                            ${String(index + 1).padStart(2, "0")}
                        </span>

                        <span class="swiper-pagination-bullet__bar"></span>
                    </button>
                `;
                },
            },

            navigation: {
                prevEl: `${mainServiceSelector} .swiper-control__button--prev`,
                nextEl: `${mainServiceSelector} .swiper-control__button--next`,
            },

            on: {
                init() {
                    const swiper = this;

                    bindActiveSlideFocus(swiper, mainServiceSelector);

                    requestAnimationFrame(function () {
                        //updateMainServiceVisibleSlides(swiper);
                        if (swiper.autoplay.running) {
                            swiper.autoplay.stop();
                            $(".main-service__swiper .swiper-control__button--play").addClass("is-paused").attr("aria-label", "슬라이드 재생");
                        }
                    });
                },

                slideChange() {
                    updateMainServiceVisibleSlides(this);
                },
            },
        });
    }

    initMainServiceSwiper();

    let mainServiceResizeTimer = null;
    $(window)
        .off(".mainServiceSwiper")
        .on("resize.mainServiceSwiper orientationchange.mainServiceSwiper", function () {
            clearTimeout(mainServiceResizeTimer);
            mainServiceResizeTimer = setTimeout(function () {
                initMainServiceSwiper();
                if (mainServiceSwiper && !mainServiceSwiper.destroyed) {
                    mainServiceSwiper.update();
                }
            }, 150);
        });
    // e:260728

    // 자동재생
    bindSwiperAutoplayToggle();

    //s:260804 마퀴
    //s:260805  마퀴 스와이퍼 제거, 애니메이션으로 재구성
    // const mainClientSelector = ".main-client__marquee-track";
    // // Swiper 생성 전에 원본 슬라이드 개수 계산
    // const mainClientSlideCount = $(`${mainClientSelector} .swiper-wrapper > .swiper-slide`).length;

    // const mainClientSwiper = createResponsiveSwiper(
    //     [
    //         {
    //             key: "mainClient",
    //             selector: mainClientSelector,

    //             options: {
    //                 slidesPerView: 6,
    //                 slidesPerGroup: 1,
    //                 loop: true,
    //                 speed: 5000,

    //                 allowTouchMove: false,

    //                 autoplay: {
    //                     delay: 0,
    //                     disableOnInteraction: false,
    //                 },

    //                 breakpoints: {
    //                     768: {
    //                         slidesPerView: 3,
    //                     },

    //                     1024: {
    //                         slidesPerView: 5,
    //                     },
    //                 },

    //                 pagination: {
    //                     el: `${mainClientSelector} .swiper-status`,
    //                     type: "custom",

    //                     renderCustom: function (swiper, current, total) {
    //                         const safeCurrent = Math.max(1, Math.min(current, total));

    //                         const progressPercentage = (safeCurrent / total) * 100;

    //                         return `
    //                         <span class="swiper-status__num swiper-status__num--current">
    //                             ${safeCurrent}
    //                         </span>

    //                         <span class="swiper-status__track">
    //                             <span
    //                                 class="swiper-status__fill"
    //                                 style="width: ${progressPercentage}%"
    //                             ></span>
    //                         </span>

    //                         <span class="swiper-status__num swiper-status__num--total">
    //                             ${total}
    //                         </span>
    //                     `;
    //                     },
    //                 },

    //                 on: {
    //                     init() {
    //                         const swiper = this;

    //                         requestAnimationFrame(function () {
    //                             if (!swiper || swiper.destroyed) return;

    //                             const $swiper = $(swiper.el);

    //                             const $playButton = $swiper.find(".swiper-control__button--play");

    //                             const $prevButton = $swiper.find(".swiper-control__button--prev");

    //                             const $nextButton = $swiper.find(".swiper-control__button--next");

    //                             swiper.mainClientPausedTranslate = null;
    //                             swiper.mainClientResumeTimer = null;
    //                             swiper.mainClientAutoplayRaf = null;
    //                             swiper.mainClientMoveRaf = null;
    //                             swiper.mainClientActionId = 0;

    //                             function clearPendingActions() {
    //                                 swiper.mainClientActionId += 1;

    //                                 clearTimeout(swiper.mainClientResumeTimer);

    //                                 swiper.mainClientResumeTimer = null;

    //                                 if (swiper.mainClientMoveRaf) {
    //                                     cancelAnimationFrame(swiper.mainClientMoveRaf);

    //                                     swiper.mainClientMoveRaf = null;
    //                                 }

    //                                 if (swiper.mainClientAutoplayRaf) {
    //                                     cancelAnimationFrame(swiper.mainClientAutoplayRaf);

    //                                     swiper.mainClientAutoplayRaf = null;
    //                                 }
    //                             }

    //                             function stopAutoplay() {
    //                                 if (!swiper.autoplay) return;

    //                                 swiper.autoplay.stop();
    //                             }

    //                             function updateSwiperState() {
    //                                 if (swiper.updateActiveIndex) {
    //                                     swiper.updateActiveIndex();
    //                                 }

    //                                 if (swiper.updateSlidesClasses) {
    //                                     swiper.updateSlidesClasses();
    //                                 }

    //                                 if (swiper.pagination && swiper.pagination.update) {
    //                                     swiper.pagination.update();
    //                                 }
    //                             }

    //                             function stopCurrentTransition(saveTranslate) {
    //                                 const currentTranslate = swiper.getTranslate();

    //                                 clearPendingActions();
    //                                 stopAutoplay();

    //                                 swiper.setTransition(0);
    //                                 swiper.setTranslate(currentTranslate);

    //                                 swiper.animating = false;

    //                                 updateSwiperState();

    //                                 if (saveTranslate !== false) {
    //                                     swiper.mainClientPausedTranslate = currentTranslate;
    //                                 }

    //                                 return currentTranslate;
    //                             }

    //                             function getNextSlideTranslate(currentTranslate) {
    //                                 const snapGrid = swiper.snapGrid || [];

    //                                 if (!snapGrid.length) {
    //                                     return currentTranslate;
    //                                 }

    //                                 const currentPosition = Math.abs(currentTranslate);

    //                                 for (let i = 0; i < snapGrid.length; i += 1) {
    //                                     if (snapGrid[i] > currentPosition + 1) {
    //                                         return -snapGrid[i];
    //                                     }
    //                                 }

    //                                 return -snapGrid[snapGrid.length - 1];
    //                             }

    //                             function startAutoplay(actionId) {
    //                                 if (!swiper.autoplay) return;

    //                                 swiper.autoplay.stop();

    //                                 swiper.mainClientAutoplayRaf = requestAnimationFrame(function () {
    //                                     swiper.mainClientAutoplayRaf = null;

    //                                     if (!swiper || swiper.destroyed || actionId !== swiper.mainClientActionId) {
    //                                         return;
    //                                     }

    //                                     swiper.setTransition(swiper.params.speed);

    //                                     swiper.autoplay.start();
    //                                 });
    //                             }

    //                             function resumeMarquee() {
    //                                 const currentTranslate = stopCurrentTransition(true);

    //                                 const actionId = swiper.mainClientActionId;

    //                                 const targetTranslate = getNextSlideTranslate(currentTranslate);

    //                                 const remainingDistance = Math.abs(targetTranslate - currentTranslate);

    //                                 const activeIndex = swiper.activeIndex || 0;

    //                                 const currentSlideSize = swiper.slidesSizesGrid[activeIndex] || swiper.slidesSizesGrid[0] || remainingDistance;

    //                                 swiper.mainClientPausedTranslate = null;

    //                                 if (remainingDistance <= 1 || !currentSlideSize) {
    //                                     if (swiper.loopFix) {
    //                                         swiper.loopFix();
    //                                     }

    //                                     updateSwiperState();

    //                                     startAutoplay(actionId);

    //                                     return;
    //                                 }

    //                                 const remainingSpeed = Math.max(50, swiper.params.speed * (remainingDistance / currentSlideSize));

    //                                 swiper.setTransition(remainingSpeed);

    //                                 swiper.setTranslate(targetTranslate);

    //                                 swiper.animating = true;

    //                                 swiper.mainClientResumeTimer = setTimeout(function () {
    //                                     swiper.mainClientResumeTimer = null;

    //                                     if (!swiper || swiper.destroyed || actionId !== swiper.mainClientActionId) {
    //                                         return;
    //                                     }

    //                                     swiper.setTransition(0);
    //                                     swiper.animating = false;

    //                                     updateSwiperState();

    //                                     if (swiper.loopFix) {
    //                                         swiper.loopFix();
    //                                     }

    //                                     updateSwiperState();

    //                                     startAutoplay(actionId);
    //                                 }, remainingSpeed + 30);
    //                             }

    //                             /*
    //                              * Swiper 4.5.0 기준
    //                              *
    //                              * loop 경계 이동 시 slideTo()로
    //                              * 인덱스를 직접 계산하지 않고
    //                              * slideNext(), slidePrev()를 사용한다.
    //                              */
    //                             function moveSlide(direction) {
    //                                 /*
    //                                  * 연타 중에는 activeIndex가 아직 이전 이동값일 수 있으므로
    //                                  * 마지막으로 요청한 targetIndex를 먼저 저장
    //                                  */
    //                                 let baseIndex = typeof swiper.mainClientButtonTargetIndex === "number" ? swiper.mainClientButtonTargetIndex : swiper.activeIndex;

    //                                 stopCurrentTransition(false);

    //                                 const actionId = swiper.mainClientActionId;

    //                                 swiper.setTransition(0);
    //                                 swiper.animating = false;

    //                                 updateSwiperState();

    //                                 /*
    //                                  * next는 기존 방식이 정상적으로 동작하므로
    //                                  * 저장된 prev 목표값을 초기화하고 기존 로직 유지
    //                                  */
    //                                 if (direction === "next") {
    //                                     swiper.mainClientButtonTargetIndex = null;

    //                                     if (swiper.loopFix) {
    //                                         swiper.loopFix();
    //                                     }

    //                                     swiper.setTransition(0);
    //                                     swiper.animating = false;

    //                                     updateSwiperState();

    //                                     swiper.mainClientMoveRaf = requestAnimationFrame(function () {
    //                                         swiper.mainClientMoveRaf = null;

    //                                         if (!swiper || swiper.destroyed || actionId !== swiper.mainClientActionId) {
    //                                             return;
    //                                         }

    //                                         swiper.slideNext(200, true);
    //                                     });

    //                                     $playButton.addClass("is-paused").attr("aria-label", "슬라이드 재생");

    //                                     return;
    //                                 }

    //                                 /*
    //                                  * Swiper 4.5.0의 prev 연타 처리
    //                                  *
    //                                  * 이동 중에는 activeIndex가 바로 갱신되지 않기 때문에
    //                                  * 직전에 요청한 목표 인덱스를 기준으로 계속 -1 처리
    //                                  */
    //                                 if (typeof swiper.mainClientButtonTargetIndex !== "number") {
    //                                     baseIndex = swiper.activeIndex;
    //                                 }

    //                                 let targetIndex = baseIndex - 1;

    //                                 /*
    //                                  * 복제 슬라이드 영역 끝에 도착하면
    //                                  * loopFix로 원본 영역 위치를 다시 맞춘 후 이동
    //                                  */
    //                                 if (targetIndex < 0) {
    //                                     if (swiper.loopFix) {
    //                                         swiper.loopFix();
    //                                     }

    //                                     swiper.setTransition(0);
    //                                     swiper.animating = false;

    //                                     updateSwiperState();

    //                                     targetIndex = swiper.activeIndex - 1;
    //                                 }

    //                                 swiper.mainClientButtonTargetIndex = targetIndex;

    //                                 swiper.mainClientMoveRaf = requestAnimationFrame(function () {
    //                                     swiper.mainClientMoveRaf = null;

    //                                     if (!swiper || swiper.destroyed || actionId !== swiper.mainClientActionId) {
    //                                         return;
    //                                     }

    //                                     swiper.slideTo(targetIndex, 200, true);
    //                                 });

    //                                 /*
    //                                  * 연타가 끝난 뒤 실제 activeIndex로 다시 동기화
    //                                  */
    //                                 clearTimeout(swiper.mainClientButtonResetTimer);

    //                                 swiper.mainClientButtonResetTimer = setTimeout(function () {
    //                                     if (!swiper || swiper.destroyed) return;

    //                                     swiper.mainClientButtonTargetIndex = null;

    //                                     updateSwiperState();

    //                                     if (swiper.loopFix) {
    //                                         swiper.loopFix();
    //                                     }

    //                                     updateSwiperState();
    //                                 }, 250);

    //                                 $playButton.addClass("is-paused").attr("aria-label", "슬라이드 재생");
    //                             }

    //                             $prevButton.off("click.mainClient").on("click.mainClient", function (event) {
    //                                 event.preventDefault();
    //                                 event.stopPropagation();
    //                                 event.stopImmediatePropagation();

    //                                 moveSlide("prev");
    //                             });

    //                             $nextButton.off("click.mainClient").on("click.mainClient", function (event) {
    //                                 event.preventDefault();
    //                                 event.stopPropagation();
    //                                 event.stopImmediatePropagation();

    //                                 moveSlide("next");
    //                             });

    //                             $playButton.off("click.mainClient").on("click.mainClient", function (event) {
    //                                 const $button = $(this);

    //                                 const isPaused = $button.hasClass("is-paused");

    //                                 event.preventDefault();
    //                                 event.stopPropagation();
    //                                 event.stopImmediatePropagation();

    //                                 if (isPaused) {
    //                                     $button.removeClass("is-paused").attr("aria-label", "슬라이드 정지");

    //                                     resumeMarquee();

    //                                     return;
    //                                 }

    //                                 stopCurrentTransition(true);

    //                                 $button.addClass("is-paused").attr("aria-label", "슬라이드 재생");
    //                             });
    //                         });
    //                     },
    //                     slideChange() {
    //                         const swiper = this;

    //                         /*
    //                          * 자동재생이나 버튼 이동이 정상 완료된 뒤
    //                          * 현재 실제 index를 계속 동기화
    //                          */
    //                         if (!swiper.animating) {
    //                             swiper.mainClientTargetRealIndex = swiper.realIndex || 0;
    //                         }
    //                     },

    //                     transitionEnd() {
    //                         const swiper = this;

    //                         if (!swiper || swiper.destroyed) return;

    //                         swiper.mainClientTargetRealIndex = swiper.realIndex || 0;

    //                         if (swiper.pagination && swiper.pagination.update) {
    //                             swiper.pagination.update();
    //                         }
    //                     },

    //                     resize() {
    //                         const swiper = this;
    //                         const $swiper = $(swiper.el);

    //                         const $playButton = $swiper.find(".swiper-control__button--play");

    //                         requestAnimationFrame(function () {
    //                             if (!swiper || swiper.destroyed || !swiper.autoplay) {
    //                                 return;
    //                             }

    //                             clearTimeout(swiper.mainClientResumeTimer);

    //                             swiper.mainClientResumeTimer = null;

    //                             if ($playButton.hasClass("is-paused")) {
    //                                 swiper.autoplay.stop();

    //                                 const currentTranslate = swiper.getTranslate();

    //                                 swiper.setTransition(0);
    //                                 swiper.setTranslate(currentTranslate);

    //                                 swiper.animating = false;
    //                                 swiper.mainClientPausedTranslate = currentTranslate;

    //                                 if (swiper.updateActiveIndex) {
    //                                     swiper.updateActiveIndex();
    //                                 }

    //                                 if (swiper.updateSlidesClasses) {
    //                                     swiper.updateSlidesClasses();
    //                                 }

    //                                 swiper.mainClientTargetRealIndex = swiper.realIndex || 0;

    //                                 return;
    //                             }

    //                             swiper.animating = false;

    //                             swiper.autoplay.stop();

    //                             requestAnimationFrame(function () {
    //                                 if (!swiper || swiper.destroyed || !swiper.autoplay) {
    //                                     return;
    //                                 }

    //                                 swiper.setTransition(swiper.params.speed);

    //                                 swiper.autoplay.start();
    //                             });
    //                         });
    //                     },
    //                 },
    //             },
    //         },
    //     ],
    //     {
    //         breakpoint: false,
    //         namespace: ".mainClient",
    //     },
    // );

    // mainClientSwiper.init();

    const $marquee = $(".main-client__marquee");
    const $track = $marquee.find(".main-client__marquee-track");
    const $group = $marquee.find(".main-client__marquee-group");

    const $prevButton = $marquee.find(".swiper-control__button--prev");
    const $nextButton = $marquee.find(".swiper-control__button--next");
    const $playButton = $marquee.find(".swiper-control__button--play");
    const $status = $marquee.find(".swiper-status");

    if (!$track.length || !$group.length) return;

    /*
     * 원본 슬라이드만 저장
     */
    const $originalItems = $group.children(".main-client__marquee-item").clone();

    const originalCount = $originalItems.length;

    if (!originalCount) return;

    /*
      원본 + 복제 2세트
      총 3세트 구성
    */
    $group.empty();
    $group.append($originalItems.clone());
    $group.append($originalItems.clone().attr("aria-hidden", "true"));
    $group.append($originalItems.clone().attr("aria-hidden", "true"));

    let itemStep = 0;
    let setWidth = 0;

    //가운데 세트에서 시작
    let position = 0;

    // 자동 흐름 속도
    const marqueeSpeed = 50;

    // 이동 속도
    const stepDuration = 200;

    let isPlaying = true;

    let animationFrameId = null;
    let lastTimestamp = null;

    // 연타
    let stepStartPosition = 0;
    let stepTargetPosition = 0;
    let stepStartTime = null;
    let isStepAnimating = false;

    function getItemStep() {
        const $firstItem = $group.children(".main-client__marquee-item").eq(0);

        if (!$firstItem.length) return 0;

        return $firstItem.outerWidth(true);
    }

    function applyTransform() {
        $group.css("transform", "translate3d(" + position + "px, 0, 0)");
    }

    function wrapPosition() {
        if (!setWidth) return;

        while (position <= -setWidth * 2) {
            position += setWidth;
        }

        while (position > 0) {
            position -= setWidth;
        }
    }

    function getCurrentIndex() {
        if (!itemStep || !originalCount) return 0;

        let index = Math.round(-position / itemStep) % originalCount;

        if (index < 0) {
            index += originalCount;
        }

        return index;
    }

    function renderStatus() {
        const currentIndex = getCurrentIndex();
        const current = currentIndex + 1;

        const progressPercentage = (current / originalCount) * 100;

        $status.html(`
            <span class="swiper-status__num swiper-status__num--current">
                ${current}
            </span>

            <span class="swiper-status__track">
                <span
                    class="swiper-status__fill"
                    style="width: ${progressPercentage}%"
                ></span>
            </span>

            <span class="swiper-status__num swiper-status__num--total">
                ${originalCount}
            </span>
        `);
    }

    function updatePlayButton() {
        $playButton.toggleClass("is-paused", !isPlaying).attr("aria-label", isPlaying ? "슬라이드 정지" : "슬라이드 재생");
    }

    function calculateSize(preserveIndex) {
        //기존 itemStep 기준으로 현재 위치를 먼저 저장
        const currentIndex = preserveIndex && itemStep ? getCurrentIndex() : 0;

        itemStep = getItemStep();
        setWidth = itemStep * originalCount;

        if (!itemStep || !setWidth) return;

        position = -setWidth - currentIndex * itemStep;

        stepStartPosition = position;
        stepTargetPosition = position;
        stepStartTime = null;
        isStepAnimating = false;
        lastTimestamp = null;

        applyTransform();
        renderStatus();
    }

    function easeInOutCubic(progress) {
        if (progress < 0.5) {
            return 4 * progress * progress * progress;
        }

        return 1 - Math.pow(-2 * progress + 2, 3) / 2;
    }

    function startStep(direction) {
        isPlaying = false;
        updatePlayButton();

        wrapPosition();

        if (!isStepAnimating) {
            stepStartPosition = position;
            stepTargetPosition = position;
        } else {
            stepStartPosition = position;
        }

        stepTargetPosition -= direction * itemStep;

        while (stepTargetPosition <= -setWidth * 2) {
            stepTargetPosition += setWidth;
            stepStartPosition += setWidth;
            position += setWidth;
        }

        while (stepTargetPosition > 0) {
            stepTargetPosition -= setWidth;
            stepStartPosition -= setWidth;
            position -= setWidth;
        }

        applyTransform();

        stepStartTime = null;
        isStepAnimating = true;
    }

    function tick(timestamp) {
        if (lastTimestamp === null) {
            lastTimestamp = timestamp;
        }

        const deltaTime = (timestamp - lastTimestamp) / 1000;

        lastTimestamp = timestamp;

        if (isStepAnimating) {
            if (stepStartTime === null) {
                stepStartTime = timestamp;
            }

            const elapsed = timestamp - stepStartTime;

            const progress = Math.min(elapsed / stepDuration, 1);

            const easedProgress = easeInOutCubic(progress);

            position = stepStartPosition + (stepTargetPosition - stepStartPosition) * easedProgress;

            applyTransform();
            renderStatus();

            if (progress >= 1) {
                position = stepTargetPosition;

                wrapPosition();

                stepStartPosition = position;
                stepTargetPosition = position;

                isStepAnimating = false;
                stepStartTime = null;
                lastTimestamp = null;

                applyTransform();
                renderStatus();
            }
        } else if (isPlaying) {
            position -= marqueeSpeed * deltaTime;

            wrapPosition();
            applyTransform();
            renderStatus();
        }

        animationFrameId = requestAnimationFrame(tick);
    }

    $prevButton.off("click.mainClientMarquee").on("click.mainClientMarquee", function (event) {
        event.preventDefault();

        startStep(-1);
    });

    $nextButton.off("click.mainClientMarquee").on("click.mainClientMarquee", function (event) {
        event.preventDefault();

        startStep(1);
    });

    $playButton.off("click.mainClientMarquee").on("click.mainClientMarquee", function (event) {
        event.preventDefault();

        isPlaying = !isPlaying;

        if (isPlaying) {
            isStepAnimating = false;
            stepStartTime = null;

            wrapPosition();

            stepStartPosition = position;
            stepTargetPosition = position;

            lastTimestamp = null;

            applyTransform();
            renderStatus();
        }

        updatePlayButton();
    });

    let resizeTimer = null;

    const mainClientResizeEvent = Device.isMobile() ? "orientationchange.mainClientMarquee" : "resize.mainClientMarquee";

    $(window)
        .off(".mainClientMarquee")
        .on(mainClientResizeEvent, function () {
            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(function () {
                isStepAnimating = false;
                stepStartTime = null;
                lastTimestamp = null;

                calculateSize(true);
            }, 150);
        });
    // 초기화
    calculateSize(false);
    updatePlayButton();

    // 애니메이션 실행
    animationFrameId = requestAnimationFrame(tick);
    //e:260805  마퀴 스와이퍼 제거, 애니메이션으로 재구성

    const MainHandler = createBreakpointHandler({
        breakpoint: 1024,

        onReset: function () {
            MainInsight.reset();
            MainInsightSwiper.destroy();
        },

        onUnder: function () {
            // 1024 이하
            MainInsight.reset();
            setTimeout(() => {
                MainInsightSwiper.init();
            }, 600);
        },

        onOver: function () {
            // 1024 초과
            MainInsightSwiper.destroy();
            MainInsight.init();
        },
    });

    if ($(".main-insight").length) {
        MainHandler.init(true);
    }

    //260819 : 포커스 이슈 (모바일/태블릿 시각 순서에 맞춘 DOM 순서 및 포커스 순차 탐색 재배치)
    (function () {
        const media = window.matchMedia("(max-width: 1023px)");

        const $mainKv = $(".main-kv__grid");
        if (!$mainKv.length) return;

        const $insight = $(".main-kv__insight");
        const $hero = $(".main-kv__hero");
        const $news = $(".main-kv__news");
        const $ask = $(".main-kv__ask");
        const $summit = $(".main-kv__summit");
        const $resource = $(".main-kv__resource");
        const $case = $(".main-kv__case");

        function updateOrder(e) {
            if (e.matches) {
                // MO/TA 시각 순서 = DOM 순차 탐색(포커스) 순서
                // 1. Hero -> 2. Insight -> 3. Resource -> 4. Summit -> 5. News -> 6. Case -> 7. Ask
                $mainKv.append($hero, $insight, $resource, $summit, $news, $case, $ask);
            } else {
                // PC 원래 시각 및 포커스 순서
                // 1. Insight -> 2. Hero -> 3. News -> 4. Ask -> 5. Summit -> 6. Resource -> 7. Case
                $mainKv.append($insight, $hero, $news, $ask, $summit, $resource, $case);
            }
        }

        updateOrder(media);
        if (media.addEventListener) {
            media.addEventListener("change", updateOrder);
        } else if (media.addListener) {
            media.addListener(updateOrder);
        }
    })();
});
