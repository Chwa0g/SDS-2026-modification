/**
 * @file offering_module.js
 * @description 오퍼링(Offering) 페이지 전용 3단계 블록 모듈형 스크립트
 * 
 * [모듈 아키텍처 목차]
 * ==========================================================================
 * PART 1: [BASE] 완전 공통 베이스 모듈 (Global Base)
 *   1-1. 웹 접근성(WAI-ARIA) 자동 강화 (initAccessibility)
 *   1-2. 스크롤 반응형 라이즈업 인터랙션 (initRiseEffects)
 *   1-3. 페이지 리소스 로드 상태 관리 (initPageLoadState)
 * 
 * PART 2: [SHARED SECTIONS] 공통 섹션 인터랙션 모듈 (Shared Section Modules)
 *   2-1. [SHARED-SEC: FAQ] FAQ 아코디언 모듈 (initFaq)
 *   2-2. [SHARED-SEC: STICKY NAV] 상단 탭 네비게이션 & 스크롤스파이 (initOfferingNav)
 *   2-3. [SHARED-SEC: INSIGHT] 인사이트 & 리스트 더보기 버튼 (initViewMoreButtons)
 *   2-4. [SHARED-SEC: SWIPER] 슬라이더 키보드 접근성 & 리모트 컨트롤 (initSwipers)
 *   2-5. [SHARED-SEC: VIDEO] 비디오 플레이어 재생/일시정지 제어 (initVideoControls)
 * 
 * PART 3: [PAGE-SPECIFIC SECTIONS] 페이지별 전용 섹션 모듈 (Page Sections)
 *   3-1. [PAGE: AI FULLSTACK] AI 풀스택 (initAIFullstackModule)
 *   3-2. [PAGE: PUBLIC SECTOR AX] 공공 AX 컨설팅 (initPublicSectorModule)
 *   3-3. [PAGE: FABRIX] 패브릭스 (initFabrixModule)
 *   3-4. [PAGE: SCP] 삼성 클라우드 플랫폼 (initScpModule)
 *   3-5. [PAGE: BRITY AUTOMATION] 브리티 오토메이션 (initBrityAutoModule)
 *   3-6. [PAGE: BRITY WORKS] 브리티 웍스 (initBrityWorksModule)
 *   3-7. [PAGE: BRITY WORKS GOV] 브리티 웍스 공공 (initBrityGovModule)
 *   3-8. [PAGE: GUIDE] 오퍼링 가이드 (initOfferingGuideModule)
 * 
 * PART 4: [ORCHESTRATOR & API] 통합 실행기 및 개발자 확장 API
 *   4-1. 페이지 자동 감지 및 등록된 모듈 실행 (init)
 *   4-2. 신규 페이지/섹션 플러그인 확장 등록 (OfferingModule.registerPage)
 * ==========================================================================
 */

(function (window, document) {
  'use strict';

  /* ==========================================================================
     PART 1: [BASE] 완전 공통 베이스 모듈 (Global Base)
     ========================================================================== */

  /**
   * 1-1. 웹 접근성(A11y) 자동 보완 모듈
   */
  function initAccessibility() {
    // 1) 자세히 보기 링크 맥락 보완
    const viewMoreLinks = document.querySelectorAll('a');
    viewMoreLinks.forEach(function (link) {
      const text = link.textContent.trim();
      if (text === '자세히 보기' || text === '더 알아보기' || text === '더 보기') {
        const container = link.closest('div, section, li');
        if (container) {
          const titleEl = container.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="heading"]');
          if (titleEl) {
            const titleText = titleEl.textContent.trim();
            if (titleText && !link.hasAttribute('aria-label')) {
              link.setAttribute('aria-label', `${titleText} ${text}`);
            }
          }
        }
      }

      // 2) 새 창 열림 링크 안내 및 보안 rel 속성
      if (link.getAttribute('target') === '_blank') {
        if (!link.hasAttribute('title')) {
          link.setAttribute('title', '새 창 열림');
        }
        if (!link.hasAttribute('rel')) {
          link.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });

    // 3) alt 속성 누락 및 장식용 이미지 aria-hidden 처리
    const images = document.querySelectorAll('img');
    images.forEach(function (img) {
      if (img.hasAttribute('alt') && img.getAttribute('alt').trim() === '') {
        img.setAttribute('aria-hidden', 'true');
        img.setAttribute('role', 'presentation');
      }
    });

    // 4) 텍스트가 없는 아이콘 요소 aria-hidden 처리
    const icons = document.querySelectorAll('i, span[class*="icon"]');
    icons.forEach(function (icon) {
      const style = window.getComputedStyle(icon);
      const hasBgImage = style.backgroundImage && style.backgroundImage !== 'none';
      const hasNoText = !icon.textContent.trim();

      if ((hasBgImage || icon.classList.contains('icon')) && hasNoText) {
        if (!icon.hasAttribute('aria-hidden')) {
          icon.setAttribute('aria-hidden', 'true');
        }
      }
    });
  }

  /**
   * 1-2. 스크롤 반응형 라이즈업 인터랙션 모듈
   */
  function initRiseEffects() {
    const riseTargets = Array.from(document.querySelectorAll('[data-rise]'));
    if (riseTargets.length === 0) return;

    const triggerRiseCurrent = function (target) {
      if (!target || target.dataset.riseTriggered) return;
      target.dataset.riseTriggered = 'true';
      target.classList.add('riseup');
    };

    const triggerRiseStep = function (target) {
      if (!target || target.dataset.riseTriggered) return;
      target.dataset.riseTriggered = 'true';
      target.classList.add('riseup');

      const stepItems = Array.from(target.querySelectorAll('[data-rise-step]'))
        .sort(function (a, b) {
          return parseFloat(a.dataset.riseStep || '0') - parseFloat(b.dataset.riseStep || '0');
        });

      stepItems.forEach(function (item, index) {
        setTimeout(function () {
          item.classList.add('riseup');
        }, index * 200);
      });
    };

    const runRiseForTarget = function (target) {
      const riseType = target.dataset.rise;
      if (riseType === 'step') {
        triggerRiseStep(target);
      } else {
        triggerRiseCurrent(target);
      }
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const target = entry.target;
            runRiseForTarget(target);
            observer.unobserve(target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
      });

      riseTargets.forEach(function (target) {
        if (!target.dataset.riseTriggered) {
          observer.observe(target);
        }
      });
    } else {
      const isElementInView = function (element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
      };

      const checkRiseTargets = function () {
        riseTargets.forEach(function (target) {
          if (!target.dataset.riseTriggered && isElementInView(target)) {
            runRiseForTarget(target);
          }
        });
      };

      checkRiseTargets();
      window.addEventListener('scroll', checkRiseTargets, { passive: true });
      window.addEventListener('resize', checkRiseTargets);
    }
  }

  /**
   * 1-3. 페이지 로딩 상태 관리 모듈
   */
  function markLoaded() {
    const offeringMain = document.querySelector('.offering-main');
    if (offeringMain) {
      offeringMain.classList.add('loaded');
    }
  }

  function initPageLoadState() {
    if (document.readyState === 'complete') {
      markLoaded();
    } else {
      window.addEventListener('load', markLoaded, { once: true });
    }
  }

  /**
   * 1-4. 아키텍처 다이어그램 트랜지션 완료 감지 모듈
   */
  function initArchTransitionEnd() {
    const archEls = Array.from(document.querySelectorAll('.stack-content__arch'));
    if (archEls.length === 0) return;

    archEls.forEach(function (el) {
      const handler = function (ev) {
        if (ev && ev.propertyName && ev.propertyName !== 'transform') return;

        const container = el.closest('.stack-content') || el.parentElement;
        if (container) container.classList.add('transition-end');

        el.removeEventListener('transitionend', handler);
      };

      el.addEventListener('transitionend', handler);
    });
  }



  /* ==========================================================================
     PART 2: [SHARED SECTIONS] 공통 섹션 인터랙션 모듈 (Shared Section Modules)
     ========================================================================== */

  /**
   * 2-1. [SHARED-SEC: FAQ] 공통 FAQ 아코디언 모듈
   */
  function initFaq() {
    const faqLists = document.querySelectorAll('.contact-us-faq__list');
    if (faqLists.length === 0) return;

    faqLists.forEach(function (faqList, listIndex) {
      const faqButtons = faqList.querySelectorAll('.contact-us-faq__button');
      if (faqButtons.length === 0) return;

      faqList.setAttribute('role', 'list');
      if (!faqList.hasAttribute('aria-label')) {
        faqList.setAttribute('aria-label', 'FAQ 목록');
      }

      faqList.querySelectorAll('.contact-us-faq__item').forEach(function (faqItem) {
        faqItem.setAttribute('role', 'listitem');
      });

      faqButtons.forEach(function (button, buttonIndex) {
        const item = button.closest('.contact-us-faq__item');
        const uniqueIdSuffix = `${listIndex + 1}-${buttonIndex + 1}`;

        if (!button.id) {
          button.id = 'faqButton-' + uniqueIdSuffix;
        }

        let panelId = button.getAttribute('aria-controls');
        let panel = panelId ? document.getElementById(panelId) : null;

        if (!panel && item) {
          panel = item.querySelector('.contact-us-faq__answer');
        }

        if (panel) {
          if (!panel.id) {
            panel.id = 'faqPanel-' + uniqueIdSuffix;
          }
          button.setAttribute('aria-controls', panel.id);
          panel.setAttribute('role', 'region');
          panel.setAttribute('aria-labelledby', button.id);

          const isOpen = item && item.classList.contains('is-active');
          button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

          if (isOpen) {
            panel.hidden = false;
            panel.removeAttribute('inert');
          } else {
            panel.hidden = true;
            panel.setAttribute('inert', '');
          }
        } else {
          button.setAttribute('aria-expanded', 'false');
        }

        button.addEventListener('click', function () {
          const currentPanelId = button.getAttribute('aria-controls');
          const currentPanel = currentPanelId ? document.getElementById(currentPanelId) : null;
          const isOpen = button.getAttribute('aria-expanded') === 'true';

          if (isOpen) {
            if (item) item.classList.remove('is-active');
            button.setAttribute('aria-expanded', 'false');

            if (currentPanel) {
              currentPanel.hidden = true;
              currentPanel.setAttribute('inert', '');
            }
            button.focus();
            return;
          }

          // 동일 FAQ 리스트 내 다른 활성화 아이템 닫기
          faqList.querySelectorAll('.contact-us-faq__item').forEach(function (faqItem) {
            faqItem.classList.remove('is-active');

            const otherButton = faqItem.querySelector('.contact-us-faq__button');
            if (otherButton) {
              otherButton.setAttribute('aria-expanded', 'false');
              const otherPanelId = otherButton.getAttribute('aria-controls');
              const otherPanel = otherPanelId ? document.getElementById(otherPanelId) : null;
              if (otherPanel) {
                otherPanel.hidden = true;
                otherPanel.setAttribute('inert', '');
              }
            }
          });

          // 현재 선택 아이템 열기
          if (item) item.classList.add('is-active');
          button.setAttribute('aria-expanded', 'true');

          if (currentPanel) {
            currentPanel.hidden = false;
            currentPanel.removeAttribute('inert');
          }

          button.focus();
        });

        // W3C WAI-ARIA 키보드 조작 지원 (ArrowUp, ArrowDown, Home, End)
        button.addEventListener('keydown', function (e) {
          const allButtons = Array.from(faqList.querySelectorAll('.contact-us-faq__button'));
          const currentIndex = allButtons.indexOf(button);
          if (currentIndex === -1) return;

          let targetButton = null;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            targetButton = allButtons[(currentIndex + 1) % allButtons.length];
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            targetButton = allButtons[(currentIndex - 1 + allButtons.length) % allButtons.length];
          } else if (e.key === 'Home') {
            e.preventDefault();
            targetButton = allButtons[0];
          } else if (e.key === 'End') {
            e.preventDefault();
            targetButton = allButtons[allButtons.length - 1];
          }

          if (targetButton) {
            targetButton.focus();
          }
        });
      });
    });
  }

  /**
   * 2-2. [SHARED-SEC: STICKY NAV] 공통 탭 내비게이션 & 스크롤스파이 모듈
   */
  function initOfferingNav() {
    const offeringNavList = document.querySelector('.offering-nav__list');
    const mainContent = document.getElementById('mainContent');
    const offeringSections = mainContent ? Array.from(mainContent.querySelectorAll('[data-label]')) : [];

    if (!offeringNavList || offeringSections.length === 0) return;

    function generateNavLinks() {
      offeringNavList.innerHTML = '';
      offeringSections.forEach(function (section, i) {
        if (!section.id) {
          section.id = 'offeringSection-' + (i + 1);
        }
        const sectionId = section.id;
        const sectionLabel = section.dataset.label || '';

        const listItem = document.createElement('li');
        listItem.classList.add('offering-nav__list-item');

        const link = document.createElement('a');
        link.classList.add('offering-nav__link');
        link.href = '#' + sectionId;
        link.setAttribute('role', 'tab');
        link.setAttribute('aria-controls', sectionId);
        link.textContent = sectionLabel;

        listItem.appendChild(link);
        offeringNavList.appendChild(listItem);
      });
    }

    function enhanceNavAccessibility() {
      offeringNavList.setAttribute('role', 'tablist');
      if (!offeringNavList.hasAttribute('aria-label')) {
        offeringNavList.setAttribute('aria-label', '섹션 내비게이션');
      }

      offeringNavList.querySelectorAll('a').forEach(function (link) {
        link.setAttribute('tabindex', '0');
        link.setAttribute('aria-selected', 'false');
        link.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            link.click();
          }
        });
      });
    }

    function bindSmoothScroll() {
      offeringNavList.addEventListener('click', function (e) {
        const targetLink = e.target.closest('a');
        if (!targetLink) return;

        const targetId = targetLink.getAttribute('href');
        if (!targetId || !targetId.startsWith('#') || targetId === '#') return;

        e.preventDefault();

        try {
          const targetSection = document.querySelector(targetId);
          if (targetSection) {
            const scrollPos = window.scrollY !== undefined ? window.scrollY : window.pageYOffset;
            const targetTop = targetSection.getBoundingClientRect().top + scrollPos;

            window.scrollTo({
              top: targetTop,
              behavior: 'smooth'
            });

            targetSection.setAttribute('tabindex', '-1');
            targetSection.focus({ preventScroll: true });
          }
        } catch (error) {
          console.error('부드러운 스크롤 타겟 설정 에러:', targetId, error);
        }
      });
    }

    function updateActiveNavLink() {
      const scrollPos = window.scrollY !== undefined ? window.scrollY : window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;

      const isAtBottom = scrollPos + winHeight >= docHeight - 10;
      let currentSectionId = '';

      if (isAtBottom && offeringSections.length > 0) {
        currentSectionId = offeringSections[offeringSections.length - 1].id;
      } else {
        for (let i = 0; i < offeringSections.length; i++) {
          const section = offeringSections[i];
          const sectionTop = section.getBoundingClientRect().top + scrollPos;
          const sectionHeight = section.offsetHeight;
          const threshold = 100;

          if (scrollPos >= sectionTop - threshold && scrollPos < sectionTop + sectionHeight - threshold) {
            currentSectionId = section.id;
            break;
          }
        }
      }

      offeringNavList.querySelectorAll('a').forEach(function (link) {
        const isCurrent = link.getAttribute('href') === '#' + currentSectionId;
        link.classList.toggle('is-current', isCurrent);
        link.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });
    }

    generateNavLinks();
    enhanceNavAccessibility();
    bindSmoothScroll();
    updateActiveNavLink();

    window.addEventListener('scroll', updateActiveNavLink, { passive: true });
    window.addEventListener('resize', updateActiveNavLink);
  }

  /**
   * 2-3. [SHARED-SEC: INSIGHT] 공통 인사이트 및 리스트 더보기 버튼 모듈
   */
  function initViewMoreButtons() {
    const buttons = Array.from(document.querySelectorAll('[data-view][data-show]'));
    if (buttons.length === 0) return;

    buttons.forEach(function (button) {
      const targetId = button.dataset.view;
      const increment = parseInt(button.dataset.show, 10) || 0;
      if (!targetId || increment <= 0) return;

      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const items = Array.from(targetEl.querySelectorAll('.offering-grid__item, .thumbnail-list__item, .border-row-list__item'));
      if (items.length === 0) return;

      const initialText = button.textContent.trim();
      const expandedText = button.dataset.expendText ? button.dataset.expendText.trim() : null;
      const mobileIncrement = parseInt(button.dataset.showMobile, 10) || 0;
      const getIncrement = function () {
        return window.innerWidth < 768 && mobileIncrement > 0 ? mobileIncrement : increment;
      };
      let visibleCount = getIncrement();
      let isExpanded = false;

      button.setAttribute('aria-controls', targetId);
      button.setAttribute('aria-expanded', 'false');

      const updateButtonState = function () {
        const allVisible = visibleCount >= items.length;

        if (expandedText) {
          button.textContent = allVisible ? expandedText : initialText;
          button.hidden = false;
          button.setAttribute('aria-expanded', allVisible ? 'true' : 'false');
          isExpanded = allVisible;
        } else {
          button.textContent = initialText;
          button.setAttribute('aria-expanded', allVisible ? 'true' : 'false');
          isExpanded = allVisible;

          if (!expandedText && allVisible) {
            button.hidden = true;
          }
        }
      };

      const updateVisibleItems = function () {
        items.forEach(function (item, index) {
          item.hidden = index >= visibleCount;
        });
        updateButtonState();
      };

      button.addEventListener('click', function () {
        const currentIncrement = getIncrement();
        if (expandedText && isExpanded) {
          visibleCount = currentIncrement;
          setTimeout(() => {
            button.focus();
            button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          }, 50);
        } else {
          visibleCount = Math.min(visibleCount + currentIncrement, items.length);
        }

        updateVisibleItems();
      });

      window.addEventListener('resize', function () {
        const newVisibleCount = Math.max(getIncrement(), visibleCount);
        if (newVisibleCount !== visibleCount) {
          visibleCount = newVisibleCount;
          updateVisibleItems();
        }
      });

      updateVisibleItems();
    });
  }

  /**
   * 2-4. [SHARED-SEC: SWIPER] 슬라이더 초점 제어 및 리모트 바인딩 모듈
   */
  function updateSlideFocusability(swiper, shouldFocus) {
    if (!swiper || !swiper.slides || swiper.slides.length === 0) return;

    setTimeout(function () {
      const slides = Array.from(swiper.slides || []);
      let activeSlideEl = null;

      slides.forEach(function (slide) {
        const isVisible = slide.classList.contains('swiper-slide-visible') ||
          slide.classList.contains('swiper-slide-active');

        if (slide.classList.contains('swiper-slide-active')) {
          activeSlideEl = slide;
        }

        const focusableEls = slide.querySelectorAll('a, button, input, select, textarea, [tabindex]');

        if (isVisible) {
          slide.removeAttribute('aria-hidden');
          focusableEls.forEach(function (el) {
            if (el.getAttribute('data-prev-tabindex') !== null) {
              const prevIdx = el.getAttribute('data-prev-tabindex');
              if (prevIdx === 'none') {
                el.removeAttribute('tabindex');
              } else {
                el.setAttribute('tabindex', prevIdx);
              }
              el.removeAttribute('data-prev-tabindex');
            } else {
              el.removeAttribute('tabindex');
            }
            el.removeAttribute('aria-hidden');
          });
        } else {
          slide.setAttribute('aria-hidden', 'true');
          focusableEls.forEach(function (el) {
            if (!el.hasAttribute('data-prev-tabindex')) {
              const currentTabIdx = el.getAttribute('tabindex');
              el.setAttribute('data-prev-tabindex', currentTabIdx !== null ? currentTabIdx : 'none');
            }
            el.setAttribute('tabindex', '-1');
            el.setAttribute('aria-hidden', 'true');
          });
        }
      });

      const autoFocusNeeded = !!shouldFocus;
      if (autoFocusNeeded && activeSlideEl) {
        const firstFocusable = activeSlideEl.querySelector('a:not([tabindex="-1"]), button:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex="0"]');
        if (firstFocusable) {
          try {
            firstFocusable.focus({ preventScroll: true });
          } catch (e) {
            firstFocusable.focus();
          }
        }
      }
    }, 0);
  }

  function initSwipers() {
    if (typeof window.Swiper !== 'function') return;

    document.querySelectorAll('.offering-swiper').forEach(function (swiperEl) {
      if (swiperEl.swiper) return;

      const isExpandSwiper = swiperEl.classList.contains('offering-swiper--expand');
      const desktopSlidesPerView = parseFloat(swiperEl.dataset.desktopSlidesPerView) || 1;
      const desktopSpaceBetween = parseInt(swiperEl.dataset.desktopSpaceBetween, 10) || 20;
      const loopCloneCount = Math.max(1, Math.ceil(desktopSlidesPerView));

      const swiperOptions = {
        loop: false,
        keyboard: false,
        a11y: false,
        watchSlidesProgress: true,
        navigation: {
          nextEl: swiperEl.querySelector('.offering-swiper-button-next'),
          prevEl: swiperEl.querySelector('.offering-swiper-button-prev'),
        },
        pagination: {
          el: swiperEl.querySelector('.offering-swiper-pagination'),
          type: 'custom',
          renderCustom: function (swiper, current, total) {
            const isMobile = window.innerWidth < 768;
            const fakeTotal = isExpandSwiper && !isMobile ? total : total;
            if (fakeTotal <= 1) return '';
            const safeCurrent = Math.max(1, Math.min(current, fakeTotal));
            const progressPercentage = (safeCurrent / fakeTotal) * 100;
            return `
              <div class="offering-swiper-track">
                <span class="offering-swiper-num current">${safeCurrent}</span>
                <span class="offering-swiper-track-wrap">
                  <span class="offering-swiper-track-fill" style="width: ${progressPercentage}%"></span>
                </span>
                <span class="offering-swiper-num">${fakeTotal}</span>
              </div>`;
          }
        },
        on: {
          init: function () {
            updateSlideFocusability(this);
          },
          slideChange: function () {
            updateSlideFocusability(this, false);
          },
          slideChangeTransitionEnd: function () {
            updateSlideFocusability(this, false);
          },
          resize: function () {
            updateSlideFocusability(this);
          }
        }
      };

      if (isExpandSwiper) {
        Object.assign(swiperOptions, {
          slidesPerView: 1.3,
          spaceBetween: 20,
          slidesOffsetAfter: 464,
          loop: true,
          loopAdditionalSlides: 2,
          loopedSlides: 2,
          breakpoints: {
            0: { slidesPerView: 1, slidesOffsetAfter: 464 },
            768: { slidesPerView: 1, slidesOffsetAfter: 0 }
          }
        });
      } else {
        Object.assign(swiperOptions, {
          slidesPerView: desktopSlidesPerView,
          spaceBetween: desktopSpaceBetween,
          slidesPerGroup: 1,
          loop: true,
          loopAdditionalSlides: loopCloneCount,
          loopedSlides: loopCloneCount,
          breakpoints: {
            0: { slidesPerView: 1 },
            768: { slidesPerView: 1, slidesOffsetAfter: 0 }
          }
        });
      }

      let swiperInstance = null;
      try {
        swiperInstance = new window.Swiper(swiperEl, swiperOptions);
        if (swiperInstance) {
          updateSlideFocusability(swiperInstance);

          swiperEl.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.keyCode === 37 || e.keyCode === 39) {
              const activeEl = document.activeElement;
              if (activeEl && (activeEl.closest('.swiper-slide') || swiperEl.contains(activeEl))) {
                e.preventDefault();
                e.stopPropagation();

                if (e.key === 'ArrowLeft' || e.keyCode === 37) {
                  if (typeof swiperInstance.slidePrev === 'function') swiperInstance.slidePrev();
                } else if (e.key === 'ArrowRight' || e.keyCode === 39) {
                  if (typeof swiperInstance.slideNext === 'function') swiperInstance.slideNext();
                }
                updateSlideFocusability(swiperInstance, true);
              }
            }
          });
        }
      } catch (e) {
        console.error('Swiper 초기화 에러:', swiperEl, e);
      }

      // 리모트 컨트롤러 바인딩
      if (swiperInstance && swiperEl.id) {
        const remoteWrapper = document.querySelector(`[data-swiper-remote="${swiperEl.id}"]`);
        if (remoteWrapper) {
          const remoteButtons = Array.from(remoteWrapper.querySelectorAll('.media-swiper-remote__button'));
          const remoteInner = remoteWrapper.querySelector('.media-swiper-remote__inner');

          const getRemoteActiveIndex = function (swiper) {
            if (!swiper) return 0;
            return swiper.params.loop ? swiper.realIndex : swiper.activeIndex;
          };

          const updateRemoteState = function (activeIndex) {
            remoteButtons.forEach(function (button, buttonIndex) {
              button.classList.toggle('is-active', buttonIndex === activeIndex);
            });
            const activeButton = remoteButtons[activeIndex];
            if (activeButton && remoteInner && typeof activeButton.scrollIntoView === 'function') {
              activeButton.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
            }
          };

          remoteButtons.forEach(function (button, index) {
            button.addEventListener('click', function () {
              if (!swiperInstance) return;
              const currentIndex = getRemoteActiveIndex(swiperInstance);
              if (currentIndex === index) return;
              if (swiperInstance.params.loop && typeof swiperInstance.slideToLoop === 'function') {
                swiperInstance.slideToLoop(index);
              } else {
                swiperInstance.slideTo(index);
              }
            });
          });

          swiperInstance.on('slideChange', function () {
            updateRemoteState(getRemoteActiveIndex(this));
          });

          updateRemoteState(getRemoteActiveIndex(swiperInstance));
        }
      }
    });
  }

  /**
   * 2-5. [SHARED-SEC: VIDEO] 공통 비디오 플레이어 제어 모듈
   */
  function initVideoControls() {
    const wrappers = document.querySelectorAll('[data-video="wrapper"]');
    if (wrappers.length === 0) return;

    wrappers.forEach(function (wrapper) {
      const video = wrapper.querySelector('video');
      const controls = wrapper.querySelector('[data-control="video"]');
      if (!video || !controls) return;

      const buttons = controls.querySelectorAll('button');
      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          const action = button.getAttribute('data-button');
          if (action === 'play') {
            video.play();
            buttons.forEach(btn => btn.classList.toggle('is-active', btn.getAttribute('data-button') === 'play'));
          } else if (action === 'pause') {
            video.pause();
            buttons.forEach(btn => btn.classList.toggle('is-active', btn.getAttribute('data-button') === 'pause'));
          }
        });
      });
    });
  }


  /* ==========================================================================
     PART 3: [PAGE-SPECIFIC SECTIONS] 페이지별 전용 섹션 모듈
     ========================================================================== */

  /**
   * 3-1. [PAGE: AI FULLSTACK] AI 풀스택 섹션 모듈
   */
  function initAIFullstackModule(root) {
    const mainEl = root || document.querySelector('.ai-fullstack');
    if (!mainEl) return;

    // 히어로 섹션 배경 활성화
    const heroBg = mainEl.querySelector('.stack-hero__bg');
    if (heroBg) {
      setTimeout(function () {
        heroBg.classList.add('is-active');
      }, 1000);
    }

    // 아키텍처 다이어그램 트랜지션 완료 감지
    const archEls = Array.from(mainEl.querySelectorAll('.stack-content__arch'));
    archEls.forEach(function (el) {
      const handler = function (ev) {
        if (ev && ev.propertyName && ev.propertyName !== 'transform') return;
        const container = el.closest('.stack-content') || el.parentElement;
        if (container) container.classList.add('transition-end');
        el.removeEventListener('transitionend', handler);
      };
      el.addEventListener('transitionend', handler);
    });

    // 섹션 바로가기 이동 버튼 ([data-move-to])
    const moveToButtons = mainEl.querySelectorAll('[data-move-to]');
    moveToButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const targetSelector = button.dataset.moveTo;
        if (!targetSelector) return;
        const targetEl = document.querySelector(targetSelector);
        if (!targetEl) return;
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /**
   * 3-2. [PAGE: PUBLIC SECTOR AX] 공공 AX 컨설팅 섹션 모듈
   */
  function initPublicSectorModule(root) {
    const mainEl = root || document.querySelector('.public-ax');
    if (!mainEl) return;

    const heroContent = mainEl.querySelector('.public-ax-hero__content');
    if (heroContent) {
      setTimeout(function () {
        heroContent.classList.add('is-active');
      }, 500);
    }
  }

  /**
   * 3-3. [PAGE: FABRIX] 패브릭스 모듈
   */
  function initFabrixModule(root) {
    const mainEl = root || document.querySelector('.fabrix');
    if (!mainEl) return;
  }

  /**
   * 3-4. [PAGE: SCP] 삼성 클라우드 플랫폼 모듈
   */
  function initScpModule(root) {
    const mainEl = root || document.querySelector('.scp');
    if (!mainEl) return;
  }

  /**
   * 3-5. [PAGE: BRITY AUTOMATION] 브리티 오토메이션 모듈
   */
  function initBrityAutoModule(root) {
    const mainEl = root || document.querySelector('.brity-auto');
    if (!mainEl) return;
  }

  /**
   * 3-6. [PAGE: BRITY WORKS] 브리티 웍스 모듈
   */
  function initBrityWorksModule(root) {
    const mainEl = root || document.querySelector('.brity-works');
    if (!mainEl) return;
  }

  /**
   * 3-7. [PAGE: BRITY WORKS GOV] 브리티 웍스 공공 모듈
   */
  function initBrityGovModule(root) {
    const mainEl = root || document.querySelector('.brity-gov');
    if (!mainEl) return;
  }

  /**
   * 3-8. [PAGE: GUIDE] 오퍼링 가이드 모듈
   */
  function initOfferingGuideModule(root) {
    const mainEl = root || document.querySelector('.offering-guide');
    if (!mainEl) return;
  }


  /* ==========================================================================
     PART 4: [ORCHESTRATOR & API] 통합 실행기 및 개발자 확장 API
     ========================================================================== */

  // 사용자 정의 페이지 모듈 레지스트리 (신규 페이지 추가용)
  const customPageRegistry = {};

  /**
   * 신규 오퍼링 페이지 스크립트 모듈 등록 API
   * 
   * @param {string} pageSelector - 페이지 식별 셀렉터 (예: '.my-new-page' 또는 '#myPage')
   * @param {Function} initFn - 해당 페이지 초기화 함수 (pageElement를 인자로 전달받음)
   */
  function registerPage(pageSelector, initFn) {
    if (typeof pageSelector === 'string' && typeof initFn === 'function') {
      customPageRegistry[pageSelector] = initFn;
    }
  }

  /**
   * 전체 오퍼링 모듈 통합 초기화 함수
   */
  function init() {
    // 1. PART 1 Base 모듈 실행
    initAccessibility();
    initRiseEffects();
    initPageLoadState();
    initArchTransitionEnd();

    // 2. PART 2 Shared Section 모듈 실행 (FAQ, 탭, 더보기, 슬라이더, 비디오)
    initFaq();
    initOfferingNav();
    initViewMoreButtons();
    initSwipers();
    initVideoControls();

    // 3. PART 3 기본 제공 페이지별 모듈 실행
    initAIFullstackModule();
    initPublicSectorModule();
    initFabrixModule();
    initScpModule();
    initBrityAutoModule();
    initBrityWorksModule();
    initBrityGovModule();
    initOfferingGuideModule();

    // 4. PART 4 개발자가 등록한 신규 페이지 모듈 실행
    Object.keys(customPageRegistry).forEach(function (selector) {
      const el = document.querySelector(selector);
      if (el) {
        try {
          customPageRegistry[selector](el);
        } catch (err) {
          console.error(`[OfferingModule] 커스텀 페이지 모듈 (${selector}) 실행 실패:`, err);
        }
      }
    });
  }

  // DOMContentLoaded 이벤트 감지 후 자동 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // 글로벌 API 노출
  window.OfferingModule = {
    init: init,
    registerPage: registerPage,
    // Base
    initAccessibility: initAccessibility,
    initRiseEffects: initRiseEffects,
    initArchTransitionEnd: initArchTransitionEnd,
    // Shared Sections
    initFaq: initFaq,
    initOfferingNav: initOfferingNav,
    initViewMoreButtons: initViewMoreButtons,
    initSwipers: initSwipers,
    initVideoControls: initVideoControls,
    // Page Sections
    initAIFullstackModule: initAIFullstackModule,
    initPublicSectorModule: initPublicSectorModule,
    initFabrixModule: initFabrixModule,
    initScpModule: initScpModule,
    initBrityAutoModule: initBrityAutoModule,
    initBrityWorksModule: initBrityWorksModule,
    initBrityGovModule: initBrityGovModule,
    initOfferingGuideModule: initOfferingGuideModule,
  };

})(window, document);
