/**
 * @file offering.js
 * @description 오퍼링 페이지의 FAQ 아코디언, 내비게이션, 스크롤 애니메이션, Swiper 슬라이더 및 웹 접근성 강화를 제어하는 스크립트입니다.
 */

(function () {
  'use strict';

  /**
   * FAQ 아코디언 기능 초기화 함수
   * 페이지 내의 모든 FAQ 목록(`.contact-us-faq__list`)을 찾아 각 아코디언 아이템에 대해
   * 클릭/키보드 이벤트 핸들러 및 웹 접근성(WAI-ARIA) 속성을 독립적으로 부여합니다.
   *
   * @function initFaq
   * @returns {void}
   */
  function initFaq() {
    const faqLists = document.querySelectorAll('.contact-us-faq__list');
    if (faqLists.length === 0) return;

    faqLists.forEach(function (faqList, listIndex) {
      const faqButtons = faqList.querySelectorAll('.contact-us-faq__button');
      if (faqButtons.length === 0) return;

      // WAI-ARIA 접근성 설정
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

        // 버튼 고유 ID 부여
        if (!button.id) {
          button.id = 'faqButton-' + uniqueIdSuffix;
        }

        let panelId = button.getAttribute('aria-controls');
        let panel = panelId ? document.getElementById(panelId) : null;

        // 연결된 패널 엘리먼트가 없는 경우 하위 요소에서 탐색
        if (!panel && item) {
          panel = item.querySelector('.contact-us-faq__answer');
        }

        if (panel) {
          // 패널 고유 ID 부여 및 ARIA 연결
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
            panel.setAttribute('tabindex', '-1');
          } else {
            panel.hidden = true;
            panel.setAttribute('inert', '');
            panel.removeAttribute('tabindex');
          }
        } else {
          button.setAttribute('aria-expanded', 'false');
        }

        // 마우스 클릭 및 엔터 키다운 이벤트 바인딩
        button.addEventListener('click', function () {
          const currentPanelId = button.getAttribute('aria-controls');
          const currentPanel = currentPanelId ? document.getElementById(currentPanelId) : null;
          const isOpen = button.getAttribute('aria-expanded') === 'true';

          if (isOpen) {
            if (item) item.classList.remove('is-active');
            button.setAttribute('aria-expanded', 'false');

            if (currentPanel) {
              currentPanel.hidden = true;
              currentPanel.removeAttribute('tabindex');
              currentPanel.setAttribute('inert', '');
            }
            button.focus();
            return;
          }

          // 동일 FAQ 리스트 내 다른 활성화된 아이템들 비활성화
          faqList.querySelectorAll('.contact-us-faq__item').forEach(function (faqItem) {
            faqItem.classList.remove('is-active');

            const otherButton = faqItem.querySelector('.contact-us-faq__button');
            if (otherButton) {
              otherButton.setAttribute('aria-expanded', 'false');

              const otherPanelId = otherButton.getAttribute('aria-controls');
              const otherPanel = otherPanelId ? document.getElementById(otherPanelId) : null;

              if (otherPanel) {
                otherPanel.hidden = true;
                otherPanel.removeAttribute('tabindex');
                otherPanel.setAttribute('inert', '');
              }
            }
          });

          // 선택된 아이템 활성화
          if (item) item.classList.add('is-active');
          button.setAttribute('aria-expanded', 'true');

          if (currentPanel) {
            currentPanel.hidden = false;
            currentPanel.setAttribute('tabindex', '-1');
            currentPanel.removeAttribute('inert');

            try {
              currentPanel.focus({ preventScroll: true });
            } catch (e) {
              currentPanel.focus();
            }
          }
        });

        button.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            button.click();
          }
        });
      });
    });
  }

  /**
   * Offering 페이지 탭 내비게이션 기능 초기화 함수
   * 메인 콘텐츠 내의 `[data-label]` 속성이 정의된 섹션들을 분석하여 상단 탭 메뉴를 자동 구성하고,
   * 스크롤 시 해당 섹션의 활성화 표시 및 부드러운 스크롤 이동 기능을 지원합니다.
   *
   * @function initOfferingNav
   * @returns {void}
   */
  function initOfferingNav() {
    const offeringNavList = document.querySelector('.offering-nav__list');
    const mainContent = document.getElementById('mainContent');
    const offeringSections = mainContent ? Array.from(mainContent.querySelectorAll('[data-label]')) : [];

    if (!offeringNavList || offeringSections.length === 0) return;

    /**
     * 섹션 리스트를 바탕으로 탭 링크 목록 동적 생성
     * @private
     */
    function generateNavLinks() {
      offeringNavList.innerHTML = '';
      offeringSections.forEach(function (section, i) {
        // ID가 누락된 경우 동적 할당
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

    /**
     * 생성된 내비게이션 링크들에 웹 접근성 태그 및 엔터 키보드 이벤트 부여
     * @private
     */
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

    /**
     * 내비게이션 링크 클릭 시 부드러운 스크롤 이동 이벤트 핸들러 바인딩
     * @private
     */
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

            // 포커스 세팅을 통한 키보드 접근성 유지
            targetSection.setAttribute('tabindex', '-1');
            targetSection.focus({ preventScroll: true });
          }
        } catch (error) {
          console.error('부드러운 스크롤 타겟 설정 에러:', targetId, error);
        }
      });
    }

    /**
     * 현재 스크롤 위치를 감지하여 해당하는 메뉴 탭 링크를 활성화 상태로 변경
     * @private
     */
    function updateActiveNavLink() {
      const scrollPos = window.scrollY !== undefined ? window.scrollY : window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;

      // 스크롤이 바닥에 닿았는지 체크 (오차범위 10px)
      const isAtBottom = scrollPos + winHeight >= docHeight - 10;
      let currentSectionId = '';

      if (isAtBottom && offeringSections.length > 0) {
        currentSectionId = offeringSections[offeringSections.length - 1].id;
      } else {
        // 각 섹션의 활성화 가능 범위를 탐색 (상단 100px 오프셋 반영)
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

    // 스크롤 및 윈도우 리사이즈 시 내비게이션 활성화 위치 갱신
    window.addEventListener('scroll', updateActiveNavLink, { passive: true });
    window.addEventListener('resize', updateActiveNavLink);
  }

  /**
   * 스크롤 반응형 페이드인/라이즈 효과 기능 초기화 함수
   * IntersectionObserver API를 우선 활용하여 요소가 화면에 진입하는 시점에 `riseup` 클래스를 추가하며,
   * 미지원 구형 브라우저 환경에서는 스크롤 위치 체크 방식으로 대체 동작합니다.
   *
   * @function initRiseEffects
   * @returns {void}
   */
  function initRiseEffects() {
    const riseTargets = Array.from(document.querySelectorAll('[data-rise]'));
    if (riseTargets.length === 0) return;

    /**
     * 단일 요소의 라이즈 효과 시작
     * @private
     * @param {HTMLElement} target - 라이즈 효과를 적용할 타겟 엘리먼트
     */
    const triggerRiseCurrent = function (target) {
      if (!target || target.dataset.riseTriggered) return;
      target.dataset.riseTriggered = 'true';
      target.classList.add('riseup');
    };

    /**
     * 하위 계층형 아이템들에 대해 시간차 순차 라이즈 효과 시작
     * @private
     * @param {HTMLElement} target - 라이즈 효과를 시작할 부모 타겟 엘리먼트
     */
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

    /**
     * 타겟 속성에 맞춰 단일 또는 순차 시간차 효과 호출
     * @private
     * @param {HTMLElement} target - 라이즈 대상 엘리먼트
     */
    const runRiseForTarget = function (target) {
      const riseType = target.dataset.rise;
      if (riseType === 'step') {
        triggerRiseStep(target);
      } else {
        triggerRiseCurrent(target);
      }
    };

    // 최신 브라우저의 IntersectionObserver 활용 (성능 향상)
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
        root: null, // 뷰포트 기준
        rootMargin: '0px 0px -10% 0px', // 뷰포트 하단 10% 영역 내에서 트리거
        threshold: 0.1
      });

      riseTargets.forEach(function (target) {
        if (!target.dataset.riseTriggered) {
          observer.observe(target);
        }
      });
    } else {
      // IntersectionObserver 미지원 환경 (구형 브라우저 대체 폴백)
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
   * view-more 버튼 초기화
   * data-view 속성으로 타겟 ID를 지정하고 data-show 만큼 항목을 차례로 노출합니다.
   * @function initViewMoreButtons
   * @returns {void}
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

      const items = Array.from(targetEl.querySelectorAll('.offering-grid__item'));
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
          }, 50)
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
   * Swiper 슬라이드 중 비활성화(화면에 보이지 않는) 슬라이드의 초점(Focus)을 차단하여
   * Tab 키 탐색 시 비활성화 슬라이드로 접근하는 현상을 막고, 활성화된 슬라이드만 Tab으로 탐색 가능하게 합니다.
   * 방향키로 슬라이드 이동 시 해당 슬라이드의 첫 번째 포커싱 요소로 자동 이동합니다.
   *
   * @function updateSlideFocusability
   * @param {Object} swiper - Swiper 인스턴스
   * @param {boolean} [shouldFocus=false] - 활성화된 슬라이드의 첫 번째 요소로 포커스를 강제 이동할지 여부
   * @returns {void}
   */
  function updateSlideFocusability(swiper, shouldFocus) {
    if (!swiper || !swiper.slides || swiper.slides.length === 0) return;

    setTimeout(function () {
      const slides = Array.from(swiper.slides || []);
      let activeSlideEl = null;

      slides.forEach(function (slide) {
        // 활성화(화면에 노출된) 슬라이드 여부 판단
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

      // 방향키 조작 시 새로 활성화된 슬라이드의 첫 번째 포커스 가능 요소로 이동
      const autoFocusNeeded = !!shouldFocus;
      if (autoFocusNeeded && activeSlideEl) {
        const firstFocusable = activeSlideEl.querySelector('a:not([tabindex="-1"]), button:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex="0"]');
        if (firstFocusable) {
          try {
            firstFocusable.focus({ preventScroll: true });
          } catch (e) {
            firstFocusable.focus();
          }
        } else {
          if (!activeSlideEl.hasAttribute('tabindex')) {
            activeSlideEl.setAttribute('tabindex', '-1');
          }
          try {
            activeSlideEl.focus({ preventScroll: true });
          } catch (e) {
            activeSlideEl.focus();
          }
        }
      }
    }, 0);
  }

  /**
   * Swiper 슬라이더 플러그인 초기화 및 웹 접근성 설정 함수
   * 페이지에 위치한 Swiper 슬라이더들을 전역 Swiper 생성자를 이용하여 커스텀 네비게이션 옵션으로 활성화합니다.
   *
   * @function initSwipers
   * @returns {void}
   */
  function initSwipers() {
    if (typeof window.Swiper !== 'function') return;

    document.querySelectorAll('.offering-swiper').forEach(function (swiperEl) {
      // 중복 초기화 방지
      if (swiperEl.swiper) return;

      const isExpandSwiper = swiperEl.classList.contains('offering-swiper--expand');
      const desktopSlidesPerView = parseFloat(swiperEl.dataset.desktopSlidesPerView) || 1;
      const desktopSpaceBetween = parseInt(swiperEl.dataset.desktopSpaceBetween, 10) || 20;
      const loopCloneCount = Math.max(1, Math.ceil(desktopSlidesPerView));
      const offsetAfter = swiperEl.clientWidth / desktopSlidesPerView * (desktopSlidesPerView - 1);

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
            const swiper = this;
            updateSlideFocusability(swiper);
            const slides = Array.from(swiper.slides || []);
            const activeSlide = slides[swiper.activeIndex];
            if (activeSlide) {
              const activeVideo = activeSlide.querySelector('video');
              if (activeVideo) {
                activeVideo.currentTime = 0;
                activeVideo.play().catch(function () { });
              }
            }
          },
          slideChange: function () {
            const swiper = this;
            updateSlideFocusability(swiper, false);
            const slides = Array.from(swiper.slides || []);
            const activeSlide = slides[swiper.activeIndex];
            if (!activeSlide) return;

            // 활성화된 슬라이드의 비디오 재생 및 제어 버튼 상태 갱신
            const activeVideo = activeSlide.querySelector('video');
            if (activeVideo) {
              activeVideo.currentTime = 0;
              activeVideo.play().catch(function (e) {
                console.warn('Video play interrupted:', e);
              });

              const controls = activeSlide.querySelector('[data-control="video"]');
              if (controls) {
                const buttons = controls.querySelectorAll('button');
                buttons.forEach(function (btn) {
                  if (btn.getAttribute('data-button') === 'play') {
                    btn.classList.add('is-active');
                  } else {
                    btn.classList.remove('is-active');
                  }
                });
              }
            }

            // 비활성화된 모든 슬라이드의 비디오 일시정지 및 리셋
            slides.forEach(function (slide, idx) {
              if (idx !== swiper.activeIndex) {
                const inactiveVideo = slide.querySelector('video');
                if (inactiveVideo) {
                  inactiveVideo.pause();
                  inactiveVideo.currentTime = 0;

                  const controls = slide.querySelector('[data-control="video"]');
                  if (controls) {
                    const buttons = controls.querySelectorAll('button');
                    buttons.forEach(function (btn) {
                      if (btn.getAttribute('data-button') === 'pause') {
                        btn.classList.add('is-active');
                      } else {
                        btn.classList.remove('is-active');
                      }
                    });
                  }
                }
              }
            });
          },
          slideChangeTransitionEnd: function () {
            updateSlideFocusability(this, false);
          },
          resize: function () {
            updateSlideFocusability(this);
          }
        },
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
            0: {
              slidesPerView: 1,
              slidesOffsetAfter: 464,
            },
            768: {
              slidesPerView: 1,
              slidesOffsetAfter: 0,
            }
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
          // slidesOffsetAfter: offsetAfter,
          breakpoints: {
            0: {
              slidesPerView: 1,
              // slidesOffsetAfter: offsetAfter,
            },
            768: {
              slidesPerView: 1,
              slidesOffsetAfter: 0,
            }
          }
        });
      }

      let swiperInstance = null;

      try {
        swiperInstance = new window.Swiper(swiperEl, swiperOptions);
        if (swiperInstance) {
          updateSlideFocusability(swiperInstance);

          // 해당 Swiper 슬라이더 내부 요소에 포커스가 있는 상태에서 방향키(Left/Right) 조작 감지 및 해당 슬라이더만 이동
          swiperEl.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.keyCode === 37 || e.keyCode === 39) {
              const activeEl = document.activeElement;
              if (activeEl && (activeEl.closest('.swiper-slide') || swiperEl.contains(activeEl))) {
                e.preventDefault();
                e.stopPropagation();

                if (e.key === 'ArrowLeft' || e.keyCode === 37) {
                  if (typeof swiperInstance.slidePrev === 'function') {
                    swiperInstance.slidePrev();
                  }
                } else if (e.key === 'ArrowRight' || e.keyCode === 39) {
                  if (typeof swiperInstance.slideNext === 'function') {
                    swiperInstance.slideNext();
                  }
                }
                updateSlideFocusability(swiperInstance, true);
              }
            }
          });
        }
      } catch (e) {
        console.error('Swiper 초기화 에러:', swiperEl, e);
      }

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

          remoteWrapper.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.keyCode === 37 || e.keyCode === 39) {
              const activeEl = document.activeElement;
              if (activeEl && remoteWrapper.contains(activeEl)) {
                e.preventDefault();
                e.stopPropagation();

                if (e.key === 'ArrowLeft' || e.keyCode === 37) {
                  if (typeof swiperInstance.slidePrev === 'function') {
                    swiperInstance.slidePrev();
                  }
                } else if (e.key === 'ArrowRight' || e.keyCode === 39) {
                  if (typeof swiperInstance.slideNext === 'function') {
                    swiperInstance.slideNext();
                  }
                }
                updateSlideFocusability(swiperInstance, true);
              }
            }
          });

          swiperInstance.on('slideChange', function () {
            updateRemoteState(getRemoteActiveIndex(this));
          });

          updateRemoteState(getRemoteActiveIndex(swiperInstance));
        }
      }

      // 키보드 사용자를 위한 Swiper 컴포넌트 접근성 속성 보완 설정 (AccessibilityI18n 다국어 연동)
      if (typeof window.AccessibilityI18n === 'object' && typeof window.AccessibilityI18n.applyToContainer === 'function') {
        window.AccessibilityI18n.applyToContainer(swiperEl);
      } else {
        const prev = swiperEl.querySelector('.offering-swiper-button-prev');
        const next = swiperEl.querySelector('.offering-swiper-button-next');
        const pagination = swiperEl.querySelector('.offering-swiper-pagination');

        if (prev && !prev.getAttribute('aria-label')) {
          prev.setAttribute('aria-label', '이전 슬라이드');
        }
        if (next && !next.getAttribute('aria-label')) {
          next.setAttribute('aria-label', '다음 슬라이드');
        }
        if (pagination) {
          pagination.setAttribute('role', 'navigation');
        }
      }
      swiperEl.setAttribute('role', 'region');
      if (!swiperEl.getAttribute('aria-label')) {
        const label = typeof window.AccessibilityI18n === 'object' ? window.AccessibilityI18n.getLabel('paginationRole') : '슬라이드 목록';
        swiperEl.setAttribute('aria-label', label);
      }
    });
  }

  /**
   * 비디오 재생/일시정지 제어 기능 초기화 함수
   * `[data-video="wrapper"]` 엘리먼트 하위의 `[data-control="video"]` 엘리먼트 내 버튼들을 클릭할 때
   * 상위 wrapper 내의 video 요소를 찾아 재생하거나 일시정지합니다.
   *
   * @function initVideoControls
   * @returns {void}
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
            buttons.forEach(function (btn) {
              if (btn.getAttribute('data-button') === 'play') {
                btn.classList.add('is-active');
              } else {
                btn.classList.remove('is-active');
              }
            });
          } else if (action === 'pause') {
            video.pause();
            buttons.forEach(function (btn) {
              if (btn.getAttribute('data-button') === 'pause') {
                btn.classList.add('is-active');
              } else {
                btn.classList.remove('is-active');
              }
            });
          }
        });
      });
    });
  }

  /**
   * 전체적인 웹 접근성(A11y) 강화 초기화 함수
   * HTML 수정을 최소화하기 위해 동적으로 접근성 관련 속성(aria-label, alt, title 등)을 보완합니다.
   *
   * @function initAccessibility
   * @returns {void}
   */
  function initAccessibility() {
    // 링크 텍스트(자세히 보기)에 맥락 제공
    const viewMoreLinks = document.querySelectorAll('a');
    viewMoreLinks.forEach(function (link) {
      const text = link.textContent.trim();
      if (text === '자세히 보기' || text === '더 알아보기' || text === '더 보기') {
        // 부모 컨테이너 내의 제목(H1-H6 또는 특정 클래스)을 찾아 aria-label 생성
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

      // 새 창 열림 링크에 안내 추가
      if (link.getAttribute('target') === '_blank') {
        if (!link.hasAttribute('title')) {
          link.setAttribute('title', '새 창 열림');
        }
        // rel 보안 속성 자동 보완
        if (!link.hasAttribute('rel')) {
          link.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });

    // 장식용 이미지 처리 (alt가 비어있는 경우 aria-hidden 부여)
    const images = document.querySelectorAll('img');
    images.forEach(function (img) {
      if (img.hasAttribute('alt') && img.getAttribute('alt').trim() === '') {
        // alt="" 인 경우 명시적으로 장식용임을 선언
        img.setAttribute('aria-hidden', 'true');
        img.setAttribute('role', 'presentation');
      }
    });

    // 아이콘 요소(<i>, <span> 등 배경 이미지를 사용하는 경우) 처리
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
   * 전체 리소스 로드 완료 후 `.offering-main`에 `loaded` 클래스를 추가합니다.
   * @function markLoaded
   * @returns {void}
   */
  function markLoaded() {
    const offeringMain = document.querySelector('.offering-main');
    if (offeringMain) {
      offeringMain.classList.add('loaded');
    }
  }

  /**
   * 전체 리소스가 로드된 후 페이지 상태를 처리합니다.
   * @function initPageLoadState
   * @returns {void}
   */
  function initPageLoadState() {
    if (document.readyState === 'complete') {
      markLoaded();
    } else {
      window.addEventListener('load', markLoaded, { once: true });
    }
  }

  /**
   * `.stack-content__arch` 요소에 대해 CSS `transitionend` 이벤트를 듣고
   * 종료 시 `transition-end` 클래스를 추가합니다.
   * @function initArchTransitionEnd
   * @returns {void}
   */
  function initArchTransitionEnd() {
    const archEls = Array.from(document.querySelectorAll('.stack-content__arch'));
    if (archEls.length === 0) return;

    archEls.forEach(function (el) {
      const handler = function (ev) {
        if (ev && ev.propertyName && ev.propertyName !== 'transform') return;

        // SCSS는 .transition-end가 .stack-content 내부에 적용되어
        // .stack-content 요소에 클래스를 추가하면 스타일이 적용됩니다.
        const container = el.closest('.stack-content') || el.parentElement;
        if (container) container.classList.add('transition-end');

        el.removeEventListener('transitionend', handler);
      };

      el.addEventListener('transitionend', handler);
    });
  }

  /**
   * 오퍼링 관련 모듈들을 총괄하여 한 번에 초기화하는 메인 실행기 함수
   * @function init
   * @returns {void}
   */
  function init() {
    initAccessibility(); // 접근성 강화를 최우선 실행
    initFaq();
    initOfferingNav();
    initRiseEffects();
    initArchTransitionEnd();
    initSwipers();
    initVideoControls();
    initViewMoreButtons();
    initPageLoadState();
  }

  // DOM 로드 완료 상태 감지 및 이벤트 연결
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
